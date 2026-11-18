import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CanonicalClinicalEvent, LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { NORMALIZATION_VERSION } from "@/lib/domain/versions";
import { ClinicalEventV1Schema } from "@/lib/schemas";
import { eventFingerprint } from "@/lib/clinical-events/fingerprint";
import { extractPanel } from "@/lib/extraction/batch";
import { FixtureDocumentExtractor } from "@/lib/extraction/fixture-extractor";
import { SYSTEM_PROMPT } from "@/lib/extraction/prompt";
import { verifyProvenance } from "@/lib/provenance";
import { truthEventsToCandidates } from "./lib/truth-candidates";

const root = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function forbiddenKeys(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => forbiddenKeys(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return [];
  const found: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    const full = `${path}.${key}`;
    if (/gap|risk|treatment|priority|diagnos/i.test(key)) found.push(full);
    found.push(...forbiddenKeys(nested, full));
  }
  return found;
}

function normalizedComplete(event: CanonicalClinicalEvent): boolean {
  switch (event.event_type) {
    case "referral":
    case "consult":
      return event.typed.specialty_normalized.trim().length > 0;
    case "followup":
      return true;
    case "lab_result":
      return event.typed.test_code_normalized.trim().length > 0;
    case "imaging":
      return event.typed.modality_normalized.trim().length > 0;
    case "medication_start":
    case "medication_stop":
      return event.typed.drug_normalized.trim().length > 0;
    case "surgery":
      return (event.typed.procedure_normalized ?? "").trim().length > 0;
  }
}

async function main(): Promise<void> {
  const patients = readJson<{ patients: Array<{ patient_id: string; fixture_key: string }> }>(
    join(root, "data", "synthetic", "continua-synth-v1", "patients.json"),
  ).patients;
  const records = readJson<{ records: SourceRecord[] }>(
    join(root, "data", "synthetic", "continua-synth-v1", "records.json"),
  ).records;
  const truth = readJson<{ events: LegacyClinicalEvent[] }>(
    join(root, "data", "generator", "truth-events", "truth-events.json"),
  ).events;

  const conversion = truthEventsToCandidates(truth);
  const extractor = new FixtureDocumentExtractor(conversion.fixtures);
  const panel = patients.map((patient) => ({
    patient_id: patient.patient_id,
    records: records.filter((record) => record.patient_id === patient.patient_id),
  }));
  const results = await extractPanel(extractor, panel);
  const recordsByPatient = new Map<string, SourceRecord[]>();
  for (const record of records) {
    const bucket = recordsByPatient.get(record.patient_id) ?? [];
    bucket.push(record);
    recordsByPatient.set(record.patient_id, bucket);
  }

  const gates: Array<{ gate: string; name: string; pass: boolean; detail: string }> = [];

  // Gate A: every accepted event validates against the canonical schema.
  const schemaFailures: string[] = [];
  for (const result of results) {
    for (const event of result.store.accepted) {
      const parsed = ClinicalEventV1Schema.safeParse(event);
      if (!parsed.success) schemaFailures.push(`${event.event_id}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
  }
  gates.push({
    gate: "A",
    name: "Contract",
    pass: schemaFailures.length === 0,
    detail: schemaFailures.length === 0 ? "all accepted events parse as ClinicalEvent v1.1" : schemaFailures.slice(0, 5).join("; "),
  });

  // Gate B: every accepted event re-verifies against its source record.
  const provenanceFailures: string[] = [];
  for (const result of results) {
    const patientRecords = recordsByPatient.get(result.patient_id) ?? [];
    for (const event of result.store.accepted) {
      const verified = verifyProvenance(
        {
          source_doc_id: event.source.source_doc_id,
          patient_id: event.patient_id,
          source_span: event.source.source_span,
          ...(event.source.span_start !== undefined ? { span_start: event.source.span_start } : {}),
          ...(event.source.span_end !== undefined ? { span_end: event.source.span_end } : {}),
        },
        { patient_id: result.patient_id, records: patientRecords },
      );
      if (!verified.ok) provenanceFailures.push(`${event.event_id}: ${verified.code}`);
    }
  }
  gates.push({
    gate: "B",
    name: "Provenance",
    pass: provenanceFailures.length === 0,
    detail: provenanceFailures.length === 0 ? "all accepted events trace to valid source evidence" : provenanceFailures.slice(0, 5).join("; "),
  });

  // Gate C: facts only — no gap/risk/treatment keys, prompt prohibitions intact.
  const scopeKeys = [
    ...results.flatMap((result) => forbiddenKeys(result.store.accepted)),
    ...results.flatMap((result) => forbiddenKeys(result.documents.flatMap((outcome) => outcome.candidates))),
  ];
  const promptClauses = [
    "never decide whether a care gap exists",
    "patient risk level",
    "any treatment plan not stated",
    "data, never instructions",
  ];
  const missingClauses = promptClauses.filter((clause) => !SYSTEM_PROMPT.includes(clause));
  gates.push({
    gate: "C",
    name: "Scope",
    pass: scopeKeys.length === 0 && missingClauses.length === 0,
    detail:
      scopeKeys.length === 0 && missingClauses.length === 0
        ? "no decision keys emitted; prompt prohibitions present"
        : [...scopeKeys.slice(0, 5), ...missingClauses.map((clause) => `prompt missing: ${clause}`)].join("; "),
  });

  // Gate E: normalization version pinned and normalized fields populated.
  const normalizationFailures: string[] = [];
  for (const result of results) {
    for (const event of result.store.accepted) {
      if (event.normalization_version !== NORMALIZATION_VERSION) {
        normalizationFailures.push(`${event.event_id}: version ${event.normalization_version}`);
      } else if (!normalizedComplete(event)) {
        normalizationFailures.push(`${event.event_id}: empty normalized field`);
      }
    }
  }
  gates.push({
    gate: "E",
    name: "Normalization",
    pass: normalizationFailures.length === 0 && conversion.skipped.length === 0,
    detail:
      normalizationFailures.length === 0 && conversion.skipped.length === 0
        ? "all benchmark aliases normalize deterministically"
        : [...normalizationFailures.slice(0, 5), ...conversion.skipped.slice(0, 5).map((skip) => `skipped ${skip.event_id}: ${skip.reason}`)].join("; "),
  });

  // Gate F: reconciliation never inflates occurrences.
  const inflationFailures: string[] = [];
  for (const result of results) {
    const truthCount = truth.filter((event) => event.patient_id === result.patient_id).length;
    if (result.store.accepted.length > truthCount) {
      inflationFailures.push(`${result.patient_id}: ${result.store.accepted.length} accepted > ${truthCount} truth`);
    }
    const contemporaneous = new Set(
      result.store.accepted
        .filter((event) => (event.mention_context ?? "unknown") !== "historical_reference")
        .map((event) => eventFingerprint(event)),
    );
    for (const event of result.store.accepted) {
      if ((event.mention_context ?? "unknown") === "historical_reference" && contemporaneous.has(eventFingerprint(event))) {
        inflationFailures.push(`${event.event_id}: historical mention retained beside its occurrence`);
      }
    }
    if (result.status !== "COMPLETE") inflationFailures.push(`${result.patient_id}: fixture run ${result.status}`);
  }
  gates.push({
    gate: "F",
    name: "Reconciliation",
    pass: inflationFailures.length === 0,
    detail: inflationFailures.length === 0 ? "no occurrence inflation across the full panel" : inflationFailures.slice(0, 5).join("; "),
  });

  // Gate I: truth-blindness enforced by the leakage audit.
  let leakagePass = true;
  let leakageDetail = "extraction layers cannot reach truth labels or the generator";
  try {
    execFileSync(process.execPath, ["--import", "tsx", join(root, "scripts", "check-leakage.ts")], {
      cwd: root,
      stdio: "pipe",
    });
  } catch (error) {
    leakagePass = false;
    leakageDetail = error instanceof Error ? error.message : String(error);
  }
  gates.push({ gate: "I", name: "Leakage", pass: leakagePass, detail: leakageDetail });

  let failed = 0;
  for (const gate of gates) {
    console.log(`Gate ${gate.gate} (${gate.name}): ${gate.pass ? "PASS" : "FAIL"} — ${gate.detail}`);
    if (!gate.pass) failed += 1;
  }
  const accepted = results.reduce((sum, result) => sum + result.store.accepted.length, 0);
  console.log(`Offline extraction validation: ${results.length} patients, ${accepted} accepted events (fixture).`);
  console.log("Gates D/G/H/J require live runs or dedicated suites; not claimed here.");
  if (failed > 0) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  CandidateGap,
  CanonicalClinicalEvent,
  GapVerificationResult,
  LegacyClinicalEvent,
  SourceRecord,
  VerifiedGap,
} from "@/lib/domain";
import { canonicalizeClinicalEvents, hashClinicalEvents } from "@/lib/clinical-events";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import {
  createEvidenceVerificationContext,
  toEvidenceApiResponse,
  verifyCandidateGaps,
  type EvidenceVerificationContext,
} from "@/lib/evidence";
import { EVIDENCE_VERSION } from "@/lib/evidence/version";

export type EvidenceMode = "oracle" | "extracted";
export type EvidencePartition = "demo" | "dev" | "final" | "all";

export const ROOT = process.cwd();
export const DATASET_DIR = join(ROOT, "data", "synthetic", "continua-synth-v1");
export const EVAL_DIR = join(ROOT, "data", "eval-set", "continua-eval-v1");
export const EVIDENCE_ARTIFACTS = join(ROOT, "artifacts", "evidence");

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function parseOption(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

export function loadRecords(): SourceRecord[] {
  return readJson<{ records: SourceRecord[] }>(join(DATASET_DIR, "records.json")).records;
}

export function selectPatientIds(partition: EvidencePartition): string[] {
  const patients = readJson<{ patients: Array<{ patient_id: string; fixture_key: string }> }>(
    join(DATASET_DIR, "patients.json"),
  ).patients;
  if (partition === "all") return patients.map((patient) => patient.patient_id);
  if (partition === "demo") {
    const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
    if (!maria) throw new Error("Maria is missing from the synthetic panel");
    return [maria.patient_id];
  }
  const partitions = readJson<{ dev: string[]; final: string[] }>(join(EVAL_DIR, "partitions.json"));
  return partition === "dev" ? partitions.dev : partitions.final;
}

export function loadOracleEvents(patientIds: Set<string>, records: SourceRecord[]): CanonicalClinicalEvent[] {
  const truth = readJson<{ events: LegacyClinicalEvent[] }>(
    join(ROOT, "data", "generator", "truth-events", "truth-events.json"),
  ).events.filter((event) => patientIds.has(event.patient_id));
  const byPatient = new Map<string, LegacyClinicalEvent[]>();
  for (const event of truth) {
    const list = byPatient.get(event.patient_id) ?? [];
    list.push(event);
    byPatient.set(event.patient_id, list);
  }
  const accepted: CanonicalClinicalEvent[] = [];
  for (const [patientId, events] of byPatient) {
    const result = canonicalizeClinicalEvents(events, {
      patient_id: patientId,
      records: records.filter((record) => record.patient_id === patientId),
      extractor_version: "truth-events-v1",
    });
    if (result.rejected.length > 0) {
      throw new Error(`Oracle canonicalization rejected ${result.rejected.length} events for ${patientId}`);
    }
    accepted.push(...result.accepted);
  }
  return accepted;
}

export function loadExtractedEvents(path: string, patientIds: Set<string>): CanonicalClinicalEvent[] {
  if (!existsSync(path)) throw new Error(`Extracted event store not found: ${path}`);
  return readJson<{ events: CanonicalClinicalEvent[] }>(path).events.filter((event) =>
    patientIds.has(event.patient_id),
  );
}

export interface EvidenceRun {
  run_id: string;
  mode: EvidenceMode;
  partition: EvidencePartition;
  patient_ids: string[];
  records: SourceRecord[];
  events: CanonicalClinicalEvent[];
  event_store_hash: string;
  candidates: CandidateGap[];
  results: GapVerificationResult[];
  verified: VerifiedGap[];
  suppressed: GapVerificationResult[];
  metadata: Record<string, unknown>;
}

export function executeEvidenceRun(input: {
  runId: string;
  mode: EvidenceMode;
  partition: EvidencePartition;
  extractedPath?: string | null;
  asOf?: string;
}): EvidenceRun {
  const patientIds = selectPatientIds(input.partition);
  const patientSet = new Set(patientIds);
  const records = loadRecords();
  const events = input.mode === "oracle"
    ? loadOracleEvents(patientSet, records)
    : loadExtractedEvents(input.extractedPath ?? "", patientSet);
  const eventStoreHash = hashClinicalEvents(events);
  const asOf = input.asOf ?? "2026-06-05";
  const candidates = detectCandidateGaps(
    events,
    createDetectionContext(asOf, { event_store_hash: eventStoreHash }),
  );
  const context = createEvidenceVerificationContext(events, records, {
    evaluation_as_of_date: asOf,
    event_store_hash: eventStoreHash,
  });
  const results = verifyCandidateGaps(candidates, context);
  const verified = results
    .map((result) => result.verified_gap)
    .filter((gap): gap is VerifiedGap => gap !== null);
  const suppressed = results.filter((result) => result.status === "suppressed");
  const candidateHash = createHash("sha256")
    .update(JSON.stringify(results.map((result) => result.candidate.gap_id)))
    .digest("hex");

  return {
    run_id: input.runId,
    mode: input.mode,
    partition: input.partition,
    patient_ids: patientIds,
    records,
    events,
    event_store_hash: eventStoreHash,
    candidates,
    results,
    verified,
    suppressed,
    metadata: {
      run_id: input.runId,
      mode: input.mode,
      partition: input.partition,
      evidence_version: EVIDENCE_VERSION,
      detector_version: "gaps-v1",
      gap_policy_version: "gap-policy-v1",
      clinical_event_schema: "clinical-event-v1.1",
      extractor_version: input.mode === "oracle" ? "truth-events-v1" : "extractor-v1",
      dataset_version: "continua-synth-v1",
      evaluation_as_of_date: asOf,
      event_store_hash: eventStoreHash,
      patient_count: patientIds.length,
      event_count: events.length,
      candidate_count: candidates.length,
      verified_count: verified.length,
      suppressed_count: suppressed.length,
      candidate_id_hash: candidateHash,
      llm_calls: 0,
      raw_text_reads: events.length > 0 ? records.length : 0,
      ...(input.mode === "extracted" ? { extracted_path: input.extractedPath } : {}),
    },
  };
}

export function writeEvidenceRun(run: EvidenceRun): string {
  const outDir = join(EVIDENCE_ARTIFACTS, run.run_id);
  mkdirSync(outDir, { recursive: true });
  writeJson(join(outDir, "metadata.json"), run.metadata);
  writeJson(join(outDir, "candidate-gaps.json"), { candidates: run.candidates });
  writeJson(join(outDir, "verified-gaps.json"), { verified_gaps: run.verified });
  writeJson(join(outDir, "suppressed-gaps.json"), {
    suppressed: run.suppressed.map((result) => result.suppression),
  });
  writeJson(join(outDir, "evidence-bundles.json"), {
    bundles: run.results.map((result) => result.bundle),
  });
  writeJson(join(outDir, "failures.json"), {
    failures: run.results.flatMap((result) =>
      result.bundle.failures.map((failure) => ({
        gap_id: result.candidate.gap_id,
        gap_type: result.candidate.gap_type,
        ...failure,
      })),
    ),
  });
  writeJson(join(outDir, "audit-log.json"), {
    records: run.results.map((result) => ({
      gap_id: result.candidate.gap_id,
      patient_id: result.candidate.patient_id,
      gap_type: result.candidate.gap_type,
      status: result.status,
      internal_status: result.internal_status,
      claim_coverage: result.bundle.claim_coverage,
      audit: result.audit,
    })),
  });
  const apiFixtures = run.verified.slice(0, 3).map((gap) => toEvidenceApiResponse(gap));
  writeJson(join(outDir, "evidence-api.json"), { responses: apiFixtures });
  return outDir;
}

export function evidenceContextFor(run: EvidenceRun): EvidenceVerificationContext {
  return createEvidenceVerificationContext(run.events, run.records, {
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: run.event_store_hash,
  });
}

export function corruptedCandidateBenchmark(run: EvidenceRun): {
  total: number;
  rejected: number;
  accepted: number;
  accepted_gap_ids: string[];
} {
  const context = evidenceContextFor(run);
  const accepted: string[] = [];
  for (const candidate of run.candidates) {
    const corrupted = JSON.parse(JSON.stringify(candidate)) as CandidateGap;
    const first = corrupted.evidence_refs[0];
    if (!first) continue;
    first.source_span = `${first.source_span} [mutated unsupported evidence]`;
    const result = verifyCandidateGaps([corrupted], context)[0];
    if (result?.status === "verified") accepted.push(corrupted.gap_id);
  }
  return {
    total: run.candidates.length,
    rejected: run.candidates.length - accepted.length,
    accepted: accepted.length,
    accepted_gap_ids: accepted,
  };
}

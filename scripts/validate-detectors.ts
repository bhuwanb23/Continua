import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CanonicalClinicalEvent, LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { canonicalizeClinicalEvents } from "@/lib/clinical-events";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { computeDetectionMetrics, computeHardNegativePassRate } from "@/lib/evaluation/metrics";
import { matchPredictions } from "@/lib/evaluation/matching";
import type { NegativeCase, TruthGap } from "@/lib/evaluation/types";
import { candidatesToPredictions } from "./lib/detector-predictions";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const detectorDir = join(root, "lib", "detectors");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function sourceFiles(dir: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) output.push(...sourceFiles(path));
    else if (path.endsWith(".ts")) output.push(path);
  }
  return output;
}

function oracleEventsFor(patientIds: Set<string>, records: SourceRecord[]): CanonicalClinicalEvent[] {
  const truth = readJson<{ events: LegacyClinicalEvent[] }>(
    join(root, "data", "generator", "truth-events", "truth-events.json"),
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
    if (result.rejected.length > 0) throw new Error(`Oracle canonicalization rejected events for ${patientId}`);
    accepted.push(...result.accepted);
  }
  return accepted;
}

function main(): void {
  const source = sourceFiles(detectorDir).map((path) => readFileSync(path, "utf8")).join("\n");
  const forbiddenTokens = [
    "@/lib/generator",
    "ground_truth",
    "negative_manifest",
    "truth-events",
    "fixture_key",
    "P-001-maria",
    "OPENAI",
    "ANTHROPIC",
    "new Date(",
    "Date.now(",
    "Math.random",
    "fetch(",
    ".text",
  ];
  const forbidden = forbiddenTokens.filter((token) => source.includes(token));
  const safetyPattern = /diagnose|treat|prescribe|discontinue|administer|medically necessary|clinically indicated/i;
  const safetySource = safetyPattern.test(source);

  const partitions = readJson<{ final: string[] }>(join(evalDir, "partitions.json"));
  const patientSet = new Set(partitions.final);
  const records = readJson<{ records: SourceRecord[] }>(join(datasetDir, "records.json")).records;
  const contracts = readJson<{ truth_gaps: TruthGap[]; negatives: NegativeCase[] }>(
    join(evalDir, "benchmark-contracts.json"),
  );
  const truthGaps = contracts.truth_gaps.filter((gap) => patientSet.has(gap.patient_id));
  const negatives = contracts.negatives.filter((negative) => patientSet.has(negative.patient_id));
  const events = oracleEventsFor(patientSet, records);
  const context = createDetectionContext("2026-06-05");
  const candidates = detectCandidateGaps(events, context);
  const predictions = candidatesToPredictions(candidates);
  const matches = matchPredictions(truthGaps, predictions);
  const metrics = computeDetectionMetrics(truthGaps, predictions, matches);
  const hardNegatives = computeHardNegativePassRate(negatives, predictions);

  const eventById = new Map(events.map((event) => [event.event_id, event]));
  const evidenceValid = candidates.every(
    (candidate) =>
      candidate.trigger_event_ids.every((id) => eventById.has(id)) &&
      candidate.evidence_refs.every((ref) => {
        const event = eventById.get(ref.event_id);
        return Boolean(event && event.source.source_doc_id === ref.source_doc_id);
      }),
  );

  const mariaFixture = readJson<{ events: CanonicalClinicalEvent[] }>(
    join(root, "data", "fixtures", "maria-canonical-events.json"),
  );
  const mariaTypes = new Set(detectCandidateGaps(mariaFixture.events, context).map((gap) => gap.gap_type));
  const mariaPass =
    mariaTypes.size === 3 &&
    mariaTypes.has("missed_followup") &&
    mariaTypes.has("duplicate_test") &&
    mariaTypes.has("med_monitoring");

  const deterministic =
    JSON.stringify(detectCandidateGaps(events, context)) === JSON.stringify(detectCandidateGaps(events, context));
  const perTypePass = Object.values(metrics.per_type).every(
    (type) => type.precision !== null && type.precision >= 0.95 && type.recall !== null && type.recall >= 0.95,
  );

  const gates = [
    { gate: "A", name: "Determinism", pass: deterministic, detail: "same canonical events produce byte-equivalent candidates" },
    { gate: "B", name: "LLM Independence", pass: !forbidden.some((token) => token.includes("OPENAI") || token.includes("ANTHROPIC")), detail: "no model client or credential references" },
    { gate: "C", name: "Raw-Text Independence", pass: !forbidden.some((token) => token === ".text"), detail: "detectors do not inspect raw document text" },
    { gate: "D", name: "Follow-Up Engine", pass: metrics.per_type.missed_followup.f1 === 1, detail: `final recall=${metrics.per_type.missed_followup.recall}, precision=${metrics.per_type.missed_followup.precision}` },
    { gate: "E", name: "Duplicate Engine", pass: metrics.per_type.duplicate_test.f1 === 1, detail: `final recall=${metrics.per_type.duplicate_test.recall}, precision=${metrics.per_type.duplicate_test.precision}` },
    { gate: "F", name: "Monitoring Engine", pass: metrics.per_type.med_monitoring.f1 === 1, detail: `final recall=${metrics.per_type.med_monitoring.recall}, precision=${metrics.per_type.med_monitoring.precision}` },
    { gate: "G", name: "Negative Performance", pass: (hardNegatives.pass_rate ?? 0) >= 0.95, detail: `hard-negative pass=${hardNegatives.pass_rate}` },
    { gate: "H", name: "Oracle Benchmark", pass: perTypePass && (metrics.macro_f1 ?? 0) >= 0.95, detail: `macro F1=${metrics.macro_f1}` },
    { gate: "I", name: "Evidence Carry-Through", pass: evidenceValid, detail: "every trigger and evidence ref resolves to a canonical event/source" },
    { gate: "J", name: "Safety", pass: !safetySource, detail: "no diagnosis/treatment/prescribing language in detector source" },
    { gate: "K", name: "Leakage", pass: forbidden.length === 0, detail: forbidden.length === 0 ? "no label, generator, fixture, model, clock, or network references" : `found: ${forbidden.join(", ")}` },
    { gate: "L", name: "Maria", pass: mariaPass, detail: `candidate types=${[...mariaTypes].sort().join(",")}` },
  ];

  const report = {
    status: gates.every((gate) => gate.pass) ? "PASS" : "FAIL",
    detector: "gaps-v1",
    policy: "gap-policy-v1",
    evaluation: "continua-eval-v1",
    as_of: "2026-06-05",
    partition: "final",
    metrics,
    hard_negatives: hardNegatives,
    gates,
    candidates: candidates.length,
  };
  mkdirSync(join(root, "artifacts", "detectors"), { recursive: true });
  writeFileSync(join(root, "artifacts", "detectors", "validation-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Phase 6 detector validation: ${report.status}`);
  for (const gate of gates) console.log(`  Gate ${gate.gate} (${gate.name}): ${gate.pass ? "PASS" : "FAIL"} — ${gate.detail}`);
  if (report.status !== "PASS") process.exit(1);
}

main();

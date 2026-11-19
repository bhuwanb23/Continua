import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import type { CanonicalClinicalEvent, LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { canonicalizeClinicalEvents } from "@/lib/clinical-events";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function oracleEvents(patientIds: Set<string>, records: SourceRecord[]): CanonicalClinicalEvent[] {
  const truth = readJson<{ events: LegacyClinicalEvent[] }>(
    join(root, "data", "generator", "truth-events", "truth-events.json"),
  ).events.filter((event) => patientIds.has(event.patient_id));
  const byPatient = new Map<string, LegacyClinicalEvent[]>();
  for (const event of truth) {
    const list = byPatient.get(event.patient_id) ?? [];
    list.push(event);
    byPatient.set(event.patient_id, list);
  }
  const events: CanonicalClinicalEvent[] = [];
  for (const [patientId, patientEvents] of byPatient) {
    const result = canonicalizeClinicalEvents(patientEvents, {
      patient_id: patientId,
      records: records.filter((record) => record.patient_id === patientId),
      extractor_version: "truth-events-v1",
    });
    events.push(...result.accepted);
  }
  return events;
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.max(0, Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1));
  return sorted[rank] ?? 0;
}

function measure(events: CanonicalClinicalEvent[], iterations: number): { p50: number; p95: number } {
  const context = createDetectionContext();
  detectCandidateGaps(events, context);
  const durations: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const started = performance.now();
    detectCandidateGaps(events, context);
    durations.push(performance.now() - started);
  }
  return { p50: percentile(durations, 0.5), p95: percentile(durations, 0.95) };
}

function main(): void {
  const patients = readJson<{ patients: Array<{ patient_id: string; fixture_key: string }> }>(
    join(datasetDir, "patients.json"),
  ).patients;
  const records = readJson<{ records: SourceRecord[] }>(join(datasetDir, "records.json")).records;
  const partitions = readJson<{ dev: string[]; final: string[] }>(join(evalDir, "partitions.json"));
  const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
  if (!maria) throw new Error("Maria is missing");

  const allIds = new Set(patients.map((patient) => patient.patient_id));
  const panel = oracleEvents(allIds, records);
  const one = oracleEvents(new Set([maria.patient_id]), records);
  const single = measure(one, 200);
  const full = measure(panel, 30);
  const report = {
    measurement: "detector computation only; artifact I/O excluded",
    patients: patientIdsLabel(partitions.final.length, patients.length),
    single_patient_p50_ms: single.p50,
    single_patient_p95_ms: single.p95,
    panel_p50_ms: full.p50,
    panel_p95_ms: full.p95,
    panel_patients: allIds.size,
    rss_mb: process.memoryUsage().rss / 1024 / 1024,
    llm_calls: 0,
  };
  const outDir = join(root, "artifacts", "detectors");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "performance.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

function patientIdsLabel(finalCount: number, totalCount: number): { final: number; total: number } {
  return { final: finalCount, total: totalCount };
}

main();

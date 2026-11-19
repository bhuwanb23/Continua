import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { createEvidenceVerificationContext, verifyCandidateGaps } from "@/lib/evidence";
import { buildQueue, computePanelPriorities } from "@/lib/priority";
import type { CanonicalClinicalEvent, SourceRecord } from "@/lib/domain";
import type { VerifiedGap } from "@/lib/domain";
import { executeEvidenceRun } from "@/scripts/lib/evidence-run";
import type { PatientDisplayRecord } from "@/scripts/lib/priority-run";
import type { BenchmarkConfig, LatencyReport, PercentileSet } from "./types";

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return Math.round((sorted[index] ?? 0) * 10_000) / 10_000;
}

function summarize(values: number[]): PercentileSet {
  if (values.length === 0) {
    return { count: 0, p50_ms: null, p95_ms: null, mean_ms: null, min_ms: null, max_ms: null };
  }
  return {
    count: values.length,
    p50_ms: percentile(values, 0.5),
    p95_ms: percentile(values, 0.95),
    mean_ms: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10_000) / 10_000,
    min_ms: Math.round(Math.min(...values) * 10_000) / 10_000,
    max_ms: Math.round(Math.max(...values) * 10_000) / 10_000,
  };
}

function measure(action: () => void, repetitions: number): number[] {
  const values: number[] = [];
  for (let index = 0; index < repetitions; index += 1) {
    const start = performance.now();
    action();
    values.push(performance.now() - start);
  }
  return values;
}

export function runLatencyBenchmark(input: {
  config: BenchmarkConfig;
  records: SourceRecord[];
  events: CanonicalClinicalEvent[];
  gaps: VerifiedGap[];
  patientIds: string[];
  patients: PatientDisplayRecord[];
  eventStoreHash: string;
  singlePatientExtractedPath: string;
}): LatencyReport {
  const repetitions = input.config.repetitions;
  const recordsPath = join(process.cwd(), "data", "synthetic", "continua-synth-v1", "records.json");
  const documentPreparation = measure(() => {
    JSON.parse(readFileSync(recordsPath, "utf8")) as unknown;
  }, repetitions);

  const detection = measure(() => {
    detectCandidateGaps(
      input.events,
      createDetectionContext("2026-06-05", { event_store_hash: input.eventStoreHash }),
    );
  }, repetitions);

  const evidenceContext = createEvidenceVerificationContext(input.events, input.records, {
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: input.eventStoreHash,
  });
  const candidates = detectCandidateGaps(
    input.events,
    createDetectionContext("2026-06-05", { event_store_hash: input.eventStoreHash }),
  );
  const evidence = measure(() => {
    verifyCandidateGaps(candidates, evidenceContext);
  }, repetitions);

  const priority = measure(() => {
    const panel = computePanelPriorities({
      patient_ids: input.patientIds,
      gaps: input.gaps,
      evaluation_as_of_date: "2026-06-05",
      event_store_hash: input.eventStoreHash,
    });
    buildQueue(panel, input.gaps, input.patients, 5);
  }, repetitions);

  const panelRuns = Math.min(5, repetitions);
  const complete = measure(() => {
    const run = executeEvidenceRun({ runId: "latency-panel", mode: "extracted", partition: input.config.partition, extractedPath: input.config.extracted_events_path });
    const panel = computePanelPriorities({
      patient_ids: run.patient_ids,
      gaps: run.verified,
      evaluation_as_of_date: "2026-06-05",
      event_store_hash: run.event_store_hash,
    });
    buildQueue(panel, run.verified, input.patients, 5);
  }, panelRuns);
  const single = measure(() => {
    const run = executeEvidenceRun({
      runId: "latency-single",
      mode: "extracted",
      partition: "demo",
      extractedPath: input.singlePatientExtractedPath,
    });
    const panel = computePanelPriorities({
      patient_ids: run.patient_ids,
      gaps: run.verified,
      evaluation_as_of_date: "2026-06-05",
      event_store_hash: run.event_store_hash,
    });
    buildQueue(panel, run.verified, input.patients, 5);
  }, repetitions);

  const tempPath = join(tmpdir(), `continua-benchmark-queue-${process.pid}.json`);
  writeFileSync(tempPath, JSON.stringify({ queue: input.gaps, patients: input.patients }), "utf8");
  let cached: number[] = [];
  try {
    cached = measure(() => {
      JSON.parse(readFileSync(tempPath, "utf8")) as unknown;
    }, repetitions);
  } finally {
    rmSync(tempPath, { force: true });
  }

  return {
    status: "measured",
    context: "fixture_replay",
    live_model_measured: false,
    stages: {
      document_preparation: summarize(documentPreparation),
      extraction: { count: 0, p50_ms: null, p95_ms: null, mean_ms: null, min_ms: null, max_ms: null },
      schema_normalization_reconciliation: { count: 0, p50_ms: null, p95_ms: null, mean_ms: null, min_ms: null, max_ms: null },
      gap_detection: summarize(detection),
      evidence_verification: summarize(evidence),
      priority: summarize(priority),
      complete_pipeline: summarize(complete),
    },
    single_patient: summarize(single),
    panel: summarize(complete),
    complete_pipeline: summarize(complete),
    cached_queue_read_parse: summarize(cached),
    repetitions,
    limitations: [
      "Extraction and normalization are frozen fixture artifacts; their live model latency is not measured.",
      "Cached queue read/parse is not AI-processing latency and does not include UI rendering.",
      "Panel repeat count is smaller than local-stage repeat count.",
    ],
  };
}

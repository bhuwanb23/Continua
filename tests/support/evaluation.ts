import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  BenchmarkBundle,
  BenchmarkContracts,
  BenchmarkManifest,
  ExtractionGoldEvent,
  ExtractionPrediction,
  GapPrediction,
  PartitionsFile,
  SourceRecordLike,
  TruthGap,
} from "@/lib/evaluation/types";

const root = process.cwd();
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function truthGap(overrides: Partial<TruthGap> = {}): TruthGap {
  const id = overrides.truth_gap_id ?? "truth-1";
  return {
    truth_gap_id: id,
    gap_truth_id: id,
    patient_id: "patient-1",
    patient_fixture_key: "P-001-test",
    gap_type: "missed_followup",
    trigger: { event_id: "trigger-1", event_type: "referral", date: "2026-04-18" },
    trigger_event_id: "trigger-1",
    identity: { specialty: "oncology" },
    temporal: {
      window_days: 45,
      due_date: "2026-06-02",
      evaluation_as_of_date: "2026-06-05",
      overdue_days: 3,
    },
    expected_window_days: 45,
    required_evidence_doc_ids: ["doc-1"],
    acceptable_evidence_doc_ids: ["doc-1"],
    source_doc_ids: ["doc-1"],
    scenario_id: "T02",
    difficulty: "MEDIUM",
    rationale: "Test rationale.",
    dataset_version: "continua-synth-v1",
    eval_version: "continua-eval-v1",
    ...overrides,
  };
}

export function gapPrediction(overrides: Partial<GapPrediction> = {}): GapPrediction {
  const id = overrides.prediction_id ?? "prediction-1";
  return {
    prediction_id: id,
    patient_id: "patient-1",
    gap_type: "missed_followup",
    trigger_event_ids: ["trigger-1"],
    identity: { specialty: "oncology" },
    evidence: [{ doc_id: "doc-1", quoted_span: "Referral to Medical Oncology", verification_method: "exact", verification_score: 1 }],
    detector_version: "gaps-v1",
    ...overrides,
  };
}

export function sourceRecord(overrides: Partial<SourceRecordLike> = {}): SourceRecordLike {
  return {
    source_doc_id: "doc-1",
    patient_id: "patient-1",
    text: "Referral to Medical Oncology for adjuvant therapy evaluation. Please schedule within 45 days.",
    ...overrides,
  };
}

export function goldEvent(overrides: Partial<ExtractionGoldEvent> = {}): ExtractionGoldEvent {
  const id = overrides.gold_event_id ?? "gold-1";
  return {
    gold_event_id: id,
    event_id: id,
    patient_id: "patient-1",
    source_doc_id: "doc-1",
    event_type: "referral",
    date: "2026-04-18",
    date_precision: "day",
    normalized: { specialty: "oncology", status: "placed", expected_window_days: 45 },
    normalized_entity: "oncology",
    evidence: { source_span: "Referral to Medical Oncology", required: true },
    source_span: "Referral to Medical Oncology",
    provider: "Dr. Test",
    difficulty: "MEDIUM",
    dataset_version: "continua-synth-v1",
    eval_version: "continua-eval-v1",
    ...overrides,
  };
}

export function extractionPrediction(overrides: Partial<ExtractionPrediction> = {}): ExtractionPrediction {
  return {
    event_id: "prediction-event-1",
    patient_id: "patient-1",
    event_type: "referral",
    date: "2026-04-18",
    date_precision: "day",
    source_doc_id: "doc-1",
    source_span: "Referral to Medical Oncology",
    normalized_entity: "oncology",
    normalized: { specialty: "oncology", status: "placed", expected_window_days: 45 },
    ...overrides,
  };
}

export function loadBenchmarkBundle(): BenchmarkBundle {
  return {
    manifest: readJson<BenchmarkManifest>(join(evalDir, "benchmark-manifest.json")),
    contracts: readJson<BenchmarkContracts>(join(evalDir, "benchmark-contracts.json")),
    groundTruth: readJson(join(evalDir, "ground_truth.json")),
    negatives: readJson(join(evalDir, "negative_manifest.json")),
    extractionGold: readJson(join(evalDir, "extraction_gold.json")),
    partitions: readJson<PartitionsFile>(join(evalDir, "partitions.json")),
    patients: readJson<{ patients: BenchmarkBundle["patients"] }>(join(datasetDir, "patients.json")).patients,
    records: readJson<{ records: SourceRecordLike[] }>(join(datasetDir, "records.json")).records,
    events: readJson<{ events: BenchmarkBundle["events"] }>(
      join(root, "data", "generator", "truth-events", "truth-events.json"),
    ).events,
  };
}

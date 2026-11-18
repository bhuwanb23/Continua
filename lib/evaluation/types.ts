import type { Difficulty, GapType, PartitionName } from "./config";

export type { Difficulty, GapType, PartitionName };

export interface TruthTrigger {
  event_id: string;
  event_type: string;
  date: string;
}

/**
 * Identity is intentionally open for detector-specific keys. The matcher only
 * compares keys that are present and non-null on the truth side.
 */
export interface GapIdentity {
  specialty?: string | null;
  test?: string | null;
  test_name?: string | null;
  modality?: string | null;
  body_region?: string | null;
  drug?: string | null;
  medication?: string | null;
  monitoring_target?: string | null;
  event_ids?: string[];
  [key: string]: unknown;
}

export interface TemporalTruth {
  window_days: number;
  due_date: string;
  evaluation_as_of_date: string;
  overdue_days: number;
}

/** Canonical Phase 3 truth-gap contract. */
export interface TruthGap {
  truth_gap_id: string;
  /** Phase 2 compatibility alias. */
  gap_truth_id: string;
  patient_id: string;
  patient_fixture_key: string;
  gap_type: GapType;
  trigger: TruthTrigger;
  trigger_event_id: string;
  identity: GapIdentity;
  temporal: TemporalTruth;
  expected_window_days: number;
  required_evidence_doc_ids: string[];
  acceptable_evidence_doc_ids: string[];
  /** Phase 2 compatibility alias for the acceptable evidence set. */
  source_doc_ids: string[];
  scenario_id: string;
  difficulty: Difficulty;
  rationale: string;
  dataset_version: string;
  eval_version: string;
}

export interface NegativeCase {
  negative_id: string;
  patient_id: string;
  patient_fixture_key?: string;
  detector_target: GapType | "all";
  /** Phase 2 compatibility alias for detector_target. */
  detector?: GapType | "all";
  scenario_family: string;
  /** Phase 2 compatibility alias for scenario_family. */
  scenario_id?: string;
  relevant_event_ids: string[];
  relevant_doc_ids: string[];
  expected_result: "NO_GAP";
  /** Phase 2 compatibility alias for expected_result. */
  expected?: "no_gap";
  reason: string;
  difficulty: Difficulty;
  dataset_version: string;
  eval_version: string;
}

export interface NormalizedEventFields {
  specialty?: string | null;
  status?: string | null;
  expected_window_days?: number | null;
  test?: string | null;
  drug?: string | null;
  modality?: string | null;
  body_region?: string | null;
  procedure?: string | null;
  site?: string | null;
  series_status?: string | null;
  [key: string]: unknown;
}

export interface GoldEvidence {
  source_span: string;
  required: boolean;
}

/** Canonical Phase 3 extraction-gold event. */
export interface ExtractionGoldEvent {
  gold_event_id: string;
  event_id: string;
  patient_id: string;
  source_doc_id: string;
  event_type: string;
  date: string;
  date_precision: "day" | "month";
  normalized: NormalizedEventFields;
  normalized_entity: string | null;
  evidence: GoldEvidence;
  source_span: string;
  provider: string;
  difficulty: Difficulty;
  dataset_version: string;
  eval_version: string;
}

export interface PredictionEvidence {
  doc_id: string;
  quoted_span?: string;
  verification_method?: "exact" | "fuzzy" | "structural" | string;
  verification_score?: number;
}

/** The only prediction shape the evaluator consumes. UI details are excluded. */
export interface GapPrediction {
  prediction_id: string;
  patient_id: string;
  gap_type: GapType;
  trigger_event_ids: string[];
  identity: GapIdentity;
  evidence: PredictionEvidence[];
  detector_version: string;
  window_days?: number;
  due_date?: string;
  confidence?: number;
  priority_band?: string;
  gap_priority_score?: number;
  [key: string]: unknown;
}

export interface ExtractionPrediction {
  event_id: string;
  patient_id: string;
  event_type: string;
  date: string;
  date_precision?: "day" | "month";
  source_doc_id: string;
  source_span?: string;
  normalized_entity?: string | null;
  normalized?: NormalizedEventFields;
  provider?: string;
  [key: string]: unknown;
}

export interface SourceRecordLike {
  source_doc_id: string;
  patient_id: string;
  text: string;
  doc_type?: string;
  date?: string;
  duplicate_of?: string;
}

export interface TruthEventLike {
  event_id: string;
  patient_id: string;
  event_type: string;
  date: string;
  source_doc_id: string;
  specialty?: string | null;
  typed: Record<string, unknown>;
}

export interface PartitionContract {
  name: PartitionName;
  patient_ids: string[];
  patient_fixture_keys: string[];
  counts: {
    patients: number;
    positive_patients: number;
    negative_patients: number;
    gaps: number;
    gap_types: Record<GapType, number>;
    difficulties: Record<Difficulty, number>;
    cohorts: Record<string, number>;
  };
}

export interface PartitionsFile {
  dataset_version: string;
  eval_version: string;
  strategy: string;
  generated_at: string;
  seed: number;
  dev: string[];
  final: string[];
  assignment: Record<string, PartitionName>;
  partitions: {
    dev: PartitionContract;
    final: PartitionContract;
  };
  counts: {
    dev: number;
    final: number;
    overlap: number;
  };
}

export interface BenchmarkHashes {
  ground_truth_sha256: string;
  negative_manifest_sha256: string;
  extraction_gold_sha256: string;
  partitions_sha256: string;
  benchmark_contracts_sha256: string;
  evaluation_config_sha256: string;
}

export interface BenchmarkManifest {
  dataset_version: string;
  eval_version: string;
  evaluation_as_of_date: string;
  frozen_at: string;
  status: "frozen";
  patient_count: number;
  document_count: number;
  provider_count: number;
  positive_patients: number;
  negative_patients: number;
  total_gaps: number;
  gap_counts: Record<GapType, number>;
  hard_negative: {
    scenario_count: number;
    family_count: number;
    families: string[];
  };
  extraction_gold: {
    patient_count: number;
    event_count: number;
  };
  partitions: {
    dev: number;
    final: number;
    overlap: number;
  };
  matching_rule: {
    version: string;
    semantics: Record<string, string>;
  };
  hashes: BenchmarkHashes;
  freeze: {
    stamp: string;
    policy: string;
    frozen_at: string;
    contract_source: string;
  };
}

export interface BenchmarkContracts {
  dataset_version: string;
  eval_version: string;
  evaluation_as_of_date: string;
  generated_at: string;
  source: string;
  truth_gaps: TruthGap[];
  negatives: NegativeCase[];
  extraction_gold: ExtractionGoldEvent[];
}

export interface BenchmarkBundle {
  manifest: BenchmarkManifest;
  contracts: BenchmarkContracts;
  groundTruth: { gaps: Array<Partial<TruthGap> & { gap_truth_id: string; patient_id: string; gap_type: GapType }> };
  negatives: { negatives: Array<Partial<NegativeCase> & { patient_id: string; detector: GapType | "all"; scenario_id: string }> };
  extractionGold: { events: Array<Partial<ExtractionGoldEvent> & { event_id: string; patient_id: string }>; patient_count: number };
  partitions: PartitionsFile;
  patients: Array<{ patient_id: string; fixture_key: string; cohort: string; difficulty: Difficulty }>;
  records: SourceRecordLike[];
  events: TruthEventLike[];
}

export interface MatchAssignment {
  truth_gap_id: string;
  prediction_id: string;
  score: number;
  evidence_overlap: string[];
  identity_matched: boolean;
}

export interface MatchResult {
  assignments: MatchAssignment[];
  matchedTruthIds: Set<string>;
  matchedPredictionIds: Set<string>;
  truePositiveTruthIds: string[];
  falseNegativeTruthIds: string[];
  falsePositivePredictionIds: string[];
  duplicatePredictionIds: string[];
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface ConfusionCounts {
  tp: number;
  fp: number;
  fn: number;
}

export interface PerTypeMetrics extends ConfusionCounts {
  precision: number | null;
  recall: number | null;
  f1: number | null;
}

export interface DetectionMetrics {
  per_type: Record<GapType, PerTypeMetrics>;
  macro_f1: number | null;
  micro_f1: number | null;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  ground_truth_gaps: number;
  reported_gaps: number;
}

export interface HardNegativeResult {
  total: number;
  passed: number;
  failed: number;
  pass_rate: number | null;
  failures: Array<{ negative_id: string; patient_id: string; detector_target: string; prediction_ids: string[] }>;
}

export interface ExtractionMatch {
  gold_event_id: string;
  prediction_event_id: string;
  score: number;
  date_matched: boolean;
  normalized_matched: boolean | null;
  source_document_matched: boolean;
  span_supported: boolean;
}

export interface ExtractionMetrics {
  gold_events: number;
  predicted_events: number;
  matched_events: number;
  event_precision: number | null;
  event_recall: number | null;
  event_f1: number | null;
  date_accuracy: number | null;
  normalization_accuracy: number | null;
  source_attribution_accuracy: number | null;
  span_support_rate: number | null;
  matches: ExtractionMatch[];
  false_positive_prediction_ids: string[];
  false_negative_gold_ids: string[];
}

export interface EvidenceGroundingResult {
  doc_id: string;
  exists: boolean;
  owned_by_patient: boolean;
  span_supported: boolean;
  verification_method: "exact" | "fuzzy" | "none";
  verification_score: number;
}

export interface GapGroundingResult {
  prediction_id: string;
  patient_id: string;
  grounded: boolean;
  evidence: EvidenceGroundingResult[];
  failures: Array<"EV-01" | "EV-02" | "EV-03">;
}

export interface GroundingMetrics {
  reported_gaps: number;
  evidence_items: number;
  citation_validity: number | null;
  span_support_rate: number | null;
  grounded_gap_rate: number | null;
  unsupported_claim_rate: number | null;
  results: GapGroundingResult[];
}

export interface PriorityInvariantFailure {
  code: "PRIO-01" | "PRIO-02";
  message: string;
  gap_id: string;
}

export interface PriorityEvaluation {
  checked_gaps: number;
  deterministic: boolean;
  formula_applied: boolean;
  confidence_band_cap: boolean;
  overdue_monotonicity: boolean;
  failures: PriorityInvariantFailure[];
  precision_at_5: number | null;
  coverage_at_5: number | null;
}

export interface LatencyMetrics {
  single_patient_p50_ms: number | null;
  single_patient_p95_ms: number | null;
  panel_p50_ms: number | null;
  panel_p95_ms: number | null;
  live_or_cached: "live" | "cached" | "unknown";
}

export interface EvaluationRunMetadata {
  run_id: string;
  timestamp: string;
  git_commit: string;
  dataset_version: string;
  eval_version: string;
  extractor_version: string;
  detector_version: string;
  priority_version: string;
  partition: PartitionName | "demo";
  evaluation_as_of_date: string;
}

export interface EvaluationReport {
  status: "completed" | "not_run" | "error";
  metadata: EvaluationRunMetadata;
  truth_gaps: number;
  predictions: number;
  gap_detection: Record<GapType, PerTypeMetrics>;
  macro_f1: number | null;
  micro_f1: number | null;
  hard_negative_pass_rate: number | null;
  extraction: Omit<ExtractionMetrics, "matches">;
  grounding: Omit<GroundingMetrics, "results">;
  priority: Omit<PriorityEvaluation, "failures">;
  latency: LatencyMetrics;
  error_summary: Record<string, number>;
}

export interface EvaluationError {
  error_id: string;
  patient_id: string;
  category: string;
  predicted_gap_id: string | null;
  truth_gap_id: string | null;
  scenario_id: string | null;
  summary: string;
}

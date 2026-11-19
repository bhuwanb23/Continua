import type { PriorityPanel, QueueItem } from "@/lib/priority";
import type {
  DetectionMetrics,
  ExtractionMetrics,
  GroundingMetrics,
  HardNegativeResult,
} from "@/lib/evaluation/types";

export type BenchmarkMode = "dev" | "final";
export type BenchmarkStatus = "NOT_RUN" | "RUNNING" | "COMPLETED" | "FAILED" | "INVALID";
export type LayerStatus = "measured" | "not_run" | "partial";
export type SourceMode = "fixture_replay" | "live" | "cached" | "oracle" | "none";

export interface BenchmarkConfig {
  benchmark_version: "continua-benchmark-v1";
  mode: BenchmarkMode;
  partition: "dev" | "final";
  k: number;
  evaluation_as_of_date: string;
  extracted_events_path: string;
  run_id: string;
  extraction_source: SourceMode;
  repetitions: number;
}

export interface GitState {
  commit: string;
  short_commit: string;
  worktree_clean: boolean;
  dirty_file_count: number;
}

export interface BenchmarkMetadata {
  run_id: string;
  timestamp: string;
  mode: BenchmarkMode;
  benchmark_version: string;
  status: BenchmarkStatus;
  git: GitState;
  dataset_version: string;
  eval_version: string;
  extractor_version: string;
  fixture_extractor_version: string | null;
  prompt_version: string;
  normalization_version: string;
  detector_version: string;
  gap_policy_version: string;
  evidence_version: string;
  priority_version: string;
  clinical_event_schema: string;
  evaluation_as_of_date: string;
  partition: string;
  partition_patients: number;
  provider_configured: boolean;
  provider_model: string | null;
  extraction_source: SourceMode;
  extraction_is_live: boolean;
  benchmark_hashes: Record<string, string>;
  input_hashes: Record<string, string>;
  notes: string[];
}

export interface PreflightCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PreflightReport {
  ok: boolean;
  status: BenchmarkStatus;
  checks: PreflightCheck[];
  warnings: string[];
  hashes: Record<string, string>;
  input_hashes: Record<string, string>;
  benchmark_summary: {
    patients: number;
    documents: number;
    truth_gaps: number;
    negatives: number;
    gold_events: number;
    dev_patients: number;
    final_patients: number;
    overlap: number;
  };
  leaked_metric_publication: false;
}

export interface ExtractionScopeMetrics {
  scope: "annotated_documents" | "all_predictions";
  interpretation: string;
  metrics: ExtractionMetrics;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
}

export interface ExtractionBreakdownRow {
  key: string;
  gold_events: number;
  matched_events: number;
  recall: number | null;
}

export interface ExtractionLayerResult {
  status: LayerStatus;
  source: SourceMode;
  live_model_measured: boolean;
  claim: string;
  gold_events: number;
  gold_patients: number;
  predicted_events_in_scope: number;
  all_predictions_in_partition: number;
  annotated_scope: ExtractionScopeMetrics;
  all_predictions_scope: ExtractionScopeMetrics;
  by_difficulty: ExtractionBreakdownRow[];
  by_document_type: ExtractionBreakdownRow[];
  error_taxonomy: Record<string, number>;
  unannotated_events: number;
  limitations: string[];
}

export interface GapLayerEntry {
  status: LayerStatus;
  source: SourceMode;
  metrics: DetectionMetrics;
  per_type: DetectionMetrics["per_type"];
  matches: {
    true_positives: number;
    false_positives: number;
    false_negatives: number;
  };
  predictions: number;
  truth_gaps: number;
}

export interface ExtractionLoss {
  oracle_recall: number | null;
  extracted_recall: number | null;
  recall_loss: number | null;
  oracle_macro_f1: number | null;
  extracted_macro_f1: number | null;
  macro_f1_loss: number | null;
  interpretation: string;
}

export interface EvidenceLayerResult {
  status: LayerStatus;
  source: SourceMode;
  candidates: number;
  verified: number;
  suppressed: number;
  candidate_metrics: DetectionMetrics;
  verified_metrics: DetectionMetrics;
  precision_gain: number | null;
  recall_cost: number | null;
  candidate_grounding: Pick<
    GroundingMetrics,
    "reported_gaps" | "evidence_items" | "citation_validity" | "span_support_rate" | "grounded_gap_rate" | "unsupported_claim_rate"
  >;
  verified_grounding: Pick<
    GroundingMetrics,
    "reported_gaps" | "evidence_items" | "citation_validity" | "span_support_rate" | "grounded_gap_rate" | "unsupported_claim_rate"
  >;
  required_span_support: number | null;
  required_claim_support: number | null;
  wrong_patient_citations: number;
  ungrounded_displayed_gaps: number;
  unsupported_displayed_claims: number;
  unsupported_claim_taxonomy: Record<string, number>;
  failures_by_code: Record<string, number>;
  all_displayed_gaps_grounded: boolean;
}

export interface CorruptionCase {
  name: string;
  gap_id: string;
  expected: "suppressed";
  observed: "suppressed" | "verified" | "not_run";
  passed: boolean;
  failure_codes: string[];
  reason: string | null;
}

export interface CorruptionBenchmark {
  status: LayerStatus;
  cases: CorruptionCase[];
  total: number;
  rejected: number;
  rejection_rate: number | null;
  target: number;
  passed: boolean;
  not_run_reason: string | null;
}

export interface HardNegativeFamily {
  family: string;
  cases: number;
  passed: number;
  pass_rate: number | null;
  candidate_cases?: number;
  candidate_passed?: number;
  candidate_pass_rate?: number | null;
}

export interface NegativeLayerResult {
  status: LayerStatus;
  candidates: HardNegativeResult;
  verified: HardNegativeResult;
  by_family: HardNegativeFamily[];
  candidate_pass_rate: number | null;
  verified_pass_rate: number | null;
  target: number;
  passed: boolean;
}

export interface PriorityInvariantResult {
  checked_gaps: number;
  formula_failures: number;
  queue_failures: number;
  deterministic_repeat_differences: number;
  demographic_violations: number;
  secondary_cap_violations: number;
  tie_ordering_stable: boolean;
  passed: boolean;
}

export interface PriorityLayerResult {
  status: LayerStatus;
  source: SourceMode;
  patients: number;
  patients_with_verified_gaps: number;
  ranked_patients: number;
  verified_gaps: number;
  ranked_gaps: number;
  ineligible_gaps: number;
  queue: QueueItem[];
  top5: Array<{
    rank: number;
    patient_id: string;
    display_name: string;
    verified: boolean;
    truth_match: boolean;
    gap_id: string;
    gap_type: string;
  }>;
  top5_verified: number;
  top5_truth_matches: number;
  top5_truth_precision: number | null;
  precision_at_k: Record<string, number | null>;
  sensitivity: {
    variant_count: number;
    mean_top5_retention: number;
    min_top5_retention: number;
    top1_stability: number;
    variants: Array<{ name: string; top5_patient_ids: string[]; top5_retention: number; top1_unchanged: boolean }>;
  };
  invariants: PriorityInvariantResult;
  panel: PriorityPanel;
}

export interface PatientLevelMetrics {
  patients: number;
  truth_positive_patients: number;
  patients_with_candidate: number;
  patients_with_verified: number;
  true_positive_patients: number;
  false_alert_patients: number;
  missed_positive_patients: number;
  patient_alert_precision: number | null;
  patient_alert_recall: number | null;
}

export interface EndToEndLayerResult {
  status: LayerStatus;
  source: SourceMode;
  live_model_measured: boolean;
  metrics: DetectionMetrics;
  per_type: DetectionMetrics["per_type"];
  macro_f1: number | null;
  micro_f1: number | null;
  per_type_precision_min: number | null;
  per_type_recall_min: number | null;
  hard_negative_pass_rate: number | null;
  patient_level: PatientLevelMetrics;
  trust: {
    citation_validity: number | null;
    patient_ownership_rate: number | null;
    span_support_rate: number | null;
    grounded_gap_rate: number | null;
    unsupported_claim_rate: number | null;
    required_claim_support: number | null;
    ungrounded_queue_gaps: number;
    wrong_patient_citations: number;
  };
  targets: {
    macro_f1: number;
    per_type_precision: number;
    per_type_recall: number;
    hard_negative_pass_rate: number;
    top5_verified: number;
    top5_truth: number;
  };
  target_results: Record<string, boolean>;
  limitations: string[];
}

export interface FunnelStage {
  stage: string;
  count: number;
  denominator: number;
  rate: number | null;
  note: string;
}

export interface FailureFunnel {
  truth_gaps: number;
  stages: FunnelStage[];
  truth_gap_ids_lost: Array<{ truth_gap_id: string; stage: string; patient_id: string; gap_type: string }>;
  top_k_patients: number;
  interpretation: string;
}

export interface AttributionEntry {
  truth_gap_id: string;
  patient_id: string;
  gap_type: string;
  stage: "EXTRACTION" | "NORMALIZATION" | "RECONCILIATION" | "DETECTION" | "EVIDENCE" | "PRIORITY" | "NONE";
  queue_miss: boolean;
  root_cause: string;
  fix_candidate: string;
}

export interface ErrorAttribution {
  total_failures: number;
  by_stage: Record<string, number>;
  by_type: Record<string, number>;
  entries: AttributionEntry[];
  queue_misses: number;
  biggest_error_first: Array<{ category: string; frequency: number; impact: string }>;
}

export interface BaselineEntry {
  name: string;
  status: LayerStatus;
  source: SourceMode | "unavailable";
  metrics: DetectionMetrics | null;
  macro_f1: number | null;
  micro_f1: number | null;
  hard_negative_pass_rate: number | null;
  grounding_rate: number | null;
  note: string;
}

export interface BaselineReport {
  status: LayerStatus;
  entries: BaselineEntry[];
  measured_baselines: number;
  meaningful_comparison: boolean;
  limitations: string[];
}

export interface AblationEntry {
  name: string;
  status: LayerStatus;
  description: string;
  metrics: DetectionMetrics | null;
  macro_f1: number | null;
  delta_macro_f1: number | null;
  top5_retention: number | null;
  finding: string;
  limitation: string | null;
}

export interface AblationReport {
  status: LayerStatus;
  entries: AblationEntry[];
  unmeasured: Array<{ name: string; reason: string }>;
}

export interface PercentileSet {
  count: number;
  p50_ms: number | null;
  p95_ms: number | null;
  mean_ms: number | null;
  min_ms: number | null;
  max_ms: number | null;
}

export interface LatencyReport {
  status: LayerStatus;
  context: "fixture_replay" | "cached" | "live";
  live_model_measured: boolean;
  stages: Record<string, PercentileSet>;
  single_patient: PercentileSet;
  panel: PercentileSet;
  complete_pipeline: PercentileSet;
  cached_queue_read_parse: PercentileSet;
  repetitions: number;
  limitations: string[];
}

export interface CostReport {
  status: LayerStatus;
  llm_calls: number;
  documents: number;
  tokens: {
    input: number | null;
    output: number | null;
    total: number | null;
    cached_input: number | null;
  };
  provider_model: string | null;
  pricing_basis: string;
  pricing_date: string | null;
  cost_usd: number | null;
  cost_per_document_usd: number | null;
  cost_per_patient_usd: number | null;
  cost_per_panel_usd: number | null;
  measured: false;
  note: string;
}

export interface ReproducibilityReport {
  status: LayerStatus;
  runs: number;
  compared: string[];
  differences: Record<string, number>;
  identical: boolean;
  llm_temperature: number | null;
  note: string;
}

export interface IntegrityReport {
  status: "PASS" | "FAIL";
  immutable: boolean;
  overwrite_forbidden: boolean;
  artifact_hashes: Record<string, string>;
  artifact_count: number;
  hash_algorithm: "sha256";
  invalid_reasons: string[];
  warnings: string[];
}

export interface Scorecard {
  title: string;
  benchmark: string;
  dataset: string;
  evaluation_date: string;
  partition: string;
  extraction_f1: number | null;
  extraction_status: LayerStatus;
  oracle_macro_f1: number | null;
  extracted_macro_f1: number | null;
  e2e_macro_f1: number | null;
  e2e_micro_f1: number | null;
  per_type: Record<string, { precision: number | null; recall: number | null; f1: number | null }>;
  hard_negative_pass: number | null;
  displayed_gap_grounding: number | null;
  unsupported_displayed_claims: number;
  top5_verified: string;
  top5_truth_precision: string;
  demographic_invariance_violations: number;
  deterministic_downstream_differences: number;
  live_patient_latency: string;
  cached_demo_latency: string | null;
  claims: string[];
}

export interface GateResult {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
}

export interface BenchmarkReport {
  status: BenchmarkStatus;
  benchmark_version: string;
  run_id: string;
  metadata: BenchmarkMetadata;
  preflight: PreflightReport;
  extraction: ExtractionLayerResult;
  gaps: {
    oracle: GapLayerEntry;
    extracted: GapLayerEntry;
    extraction_loss: ExtractionLoss;
  };
  evidence: EvidenceLayerResult;
  corruption: CorruptionBenchmark;
  negatives: NegativeLayerResult;
  priority: PriorityLayerResult;
  end_to_end: EndToEndLayerResult;
  funnel: FailureFunnel;
  attribution: ErrorAttribution;
  baselines: BaselineReport;
  ablations: AblationReport;
  latency: LatencyReport;
  cost: CostReport;
  reproducibility: ReproducibilityReport;
  integrity: IntegrityReport;
  gates: GateResult[];
  scorecard: Scorecard;
  limitations: string[];
  generated_at: string;
}

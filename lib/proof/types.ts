export interface PerTypeMetric {
  precision: number | null;
  recall: number | null;
  f1: number | null;
  tp: number;
  fp: number;
  fn: number;
}

export interface FunnelStageView {
  key: string;
  label: string;
  count: number;
  denominator: number;
  note: string;
}

export interface BaselineView {
  name: string;
  label: string;
  status: string;
  macro_f1: number | null;
  micro_f1: number | null;
  hard_negative_pass_rate: number | null;
  grounding_rate: number | null;
  note?: string;
}

export interface AblationView {
  name: string;
  status: string;
  macro_f1: number | null;
  delta_macro_f1: number | null;
  finding: string;
  limitation?: string;
}

export interface NegativeFamilyView {
  family: string;
  cases: number;
  passed: number;
  pass_rate: number;
}

export interface ProofEvaluation {
  benchmark_run_id: string;
  benchmark_version: string;
  dataset: string;
  partition: string;
  status: string;
  synthetic: true;
  evaluation_date: string;
  headline: {
    macro_f1: number | null;
    hard_negative_pass_rate: number | null;
    hard_negative_cases: number;
    grounding_rate: number | null;
    grounding_gaps: number;
    top5_truth: string;
    top5_verified: string;
    truth_gaps: number;
  };
  per_type: Record<string, PerTypeMetric>;
  extraction: {
    status: string | null;
    source: string | null;
    live_model_measured: boolean;
    gold_events: number | null;
    event_f1: number | null;
    date_accuracy: number | null;
    normalization_accuracy: number | null;
    span_support_rate: number | null;
    claim: string | null;
  };
  funnel: { stages: FunnelStageView[]; excluded_note: string };
  trust: {
    citation_validity: number | null;
    patient_ownership: number | null;
    span_support: number | null;
    grounded_gap_rate: number | null;
    unsupported_displayed_claims: number;
    wrong_patient_citations: number;
    ungrounded_displayed_gaps: number;
  };
  negatives: { total: number; passed: number; families: NegativeFamilyView[] };
  baselines: BaselineView[];
  ablations: AblationView[];
  priority: {
    patients: number;
    ranked_patients: number;
    verified_gaps: number;
    ranked_gaps: number;
    top5_verified: string;
    top5_truth: string;
    demographic_invariance_violations: number;
    deterministic_differences: number;
  };
  latency: {
    cached_queue_p50_ms: number | null;
    pipeline_fixture_p50_ms: number | null;
    live_model_measured: boolean;
    limitations: string[];
  };
  failures: string[];
  failure_disclosure: string;
  limitations: string[];
  reproducibility: { runs: number; identical: boolean; differences: Record<string, number> | null };
  gates: Array<{ id: string; name: string; passed: boolean }>;
}

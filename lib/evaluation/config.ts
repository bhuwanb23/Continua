/**
 * Frozen evaluation configuration for continua-eval-v1.
 *
 * This file is part of the benchmark integrity boundary. Changing any value
 * here changes `evaluation_config_sha256` and therefore requires a new eval
 * version. It intentionally contains no patient-specific labels or ids.
 */
export const EVAL_VERSION = "continua-eval-v1" as const;
export const DATASET_VERSION = "continua-synth-v1" as const;
export const EVALUATION_AS_OF_DATE = "2026-06-05" as const;
export const BENCHMARK_FROZEN_AT = "2026-11-18" as const;
export const BENCHMARK_FREEZE_STAMP = "CONTINUA PHASE 3: continua-eval-v1 FROZEN" as const;

export const GAP_TYPES = ["missed_followup", "duplicate_test", "med_monitoring"] as const;
export type GapType = (typeof GAP_TYPES)[number];

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PARTITIONS = ["dev", "final"] as const;
export type PartitionName = (typeof PARTITIONS)[number];

/** Matching rule v2, with identity and evidence extensions frozen in Phase 3. */
export const MATCHING_RULE_VERSION = "v2" as const;
export const FUZZY_SPAN_THRESHOLD = 0.85;
export const DEFAULT_MAX_DATE_DELTA_DAYS = 0;

/** Minimum gates from the evaluation spec. These are targets, never results. */
export const PASS_CRITERIA = {
  precision_per_type_min: 0.8,
  recall_per_type_min: 0.7,
  f1_per_type_min: 0.75,
  macro_f1_min: 0.75,
  hard_negative_pass_rate_min: 0.9,
  grounding_accuracy: 1,
  extraction_accuracy_min: 0.9,
  panel_latency_sec_max: 60,
} as const;

/** The frozen Phase 2 corpus, asserted by the Phase 3 validator. */
export const BENCHMARK_COUNTS = {
  patient_count: 80,
  document_count: 485,
  provider_count: 26,
  positive_patients: 42,
  negative_patients: 38,
  total_gaps: 66,
  gap_counts: {
    missed_followup: 26,
    duplicate_test: 20,
    med_monitoring: 20,
  },
  extraction_gold_patients: 12,
  extraction_gold_events: 130,
  hard_negative_scenarios: 35,
} as const;

/** Required fields are those without which the truth cannot be explained. */
export const REQUIRED_TRUTH_FIELDS = [
  "truth_gap_id",
  "gap_truth_id",
  "patient_id",
  "gap_type",
  "trigger",
  "identity",
  "temporal",
  "required_evidence_doc_ids",
  "acceptable_evidence_doc_ids",
  "scenario_id",
  "difficulty",
  "rationale",
  "dataset_version",
  "eval_version",
] as const;

export const MATCHING_SEMANTICS = {
  patient_id: "exact",
  gap_type: "exact normalized enum",
  identity: "all fields present in truth identity must match prediction identity",
  evidence: "at least one acceptable truth doc must be cited as valid evidence",
  assignment: "one-to-one, deterministic greedy best score",
  duplicate_prediction: "counted as false positive",
} as const;

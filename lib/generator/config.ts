export const DATASET_VERSION = "continua-synth-v1";
export const GENERATOR_VERSION = "generator-v1";
export const DATASET_SEED = 20261117;
export const EVALUATION_AS_OF_DATE = "2026-06-05";
export const FROZEN_AT = "2026-11-17";

export const PATIENT_COUNT = 80;

export const COHORT_COUNTS = {
  oncology: 32,
  cardio: 16,
  metabolic: 16,
  mixed: 16,
} as const;

/** Exact planted-gap targets; the distribution must total 66. */
export const GAP_TARGETS = {
  missed_followup: 26,
  duplicate_test: 20,
  med_monitoring: 20,
} as const;

export const GAP_INSTANCE_TOTAL = 66;
export const POSITIVE_PATIENT_TARGET = 42;
export const NEGATIVE_PATIENT_TARGET = 38;

export const DUPLICATE_WINDOW_DAYS = 14;
export const DEFAULT_REFERRAL_WINDOW_DAYS = 30;
export const ONCOLOGY_REFERRAL_WINDOW_DAYS = 45;
export const METFORMIN_WINDOW_DAYS = 90;
export const WARFARIN_WINDOW_DAYS = 7;
export const TAMOXIFEN_WINDOW_DAYS = 365;

export const HARD_NEGATIVE_FAMILIES = [
  "HN-01",
  "HN-02",
  "HN-03",
  "HN-04",
  "HN-05",
  "HN-06",
  "HN-07",
  "HN-08",
  "HN-09",
  "HN-10",
  "HN-11",
  "HN-12",
  "HN-13",
  "HN-14",
  "HN-15",
] as const;

export const GOLD_PATIENT_INDICES = [0, 1, 2, 3, 4, 5, 33, 34, 49, 50, 66, 70] as const;

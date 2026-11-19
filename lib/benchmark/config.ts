import { join } from "node:path";

export const BENCHMARK_VERSION = "continua-benchmark-v1" as const;
export const BENCHMARK_ARTIFACTS = join(process.cwd(), "artifacts", "benchmark");
export const BENCHMARK_LATEST = join(BENCHMARK_ARTIFACTS, "latest.json");
export const EXTRACTED_FINAL_PATH = join(
  process.cwd(),
  "artifacts",
  "extraction",
  "phase6-extracted-final",
  "canonical-events.json",
);
export const EXTRACTED_DEV_PATH = join(
  process.cwd(),
  "artifacts",
  "extraction",
  "phase9-fixture-dev",
  "canonical-events.json",
);
export const PRIORITY_K = 5;
export const BENCHMARK_REPETITIONS = 12;
export const BENCHMARK_EVALUATION_DATE = "2026-06-05";

export const TARGETS = {
  oracle_macro_f1: 0.95,
  e2e_macro_f1: 0.75,
  e2e_per_type_precision: 0.8,
  e2e_per_type_recall: 0.7,
  hard_negative_pass_rate: 0.9,
  top5_verified: 5,
  top5_truth: 5,
  corruption_rejection: 1,
} as const;

export const SCORECARD_TITLE = "CONTINUA INTELLIGENCE BENCHMARK";

export function sanitizeRunId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "benchmark-run";
}

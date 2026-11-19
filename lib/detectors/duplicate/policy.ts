import type { CandidateSeverity } from "@/lib/domain";

/** Frozen benchmark policy, not a universal medical-necessity rule. */
export const DUPLICATE_POLICY = {
  detector: "duplicate-v1",
  window_days: 14,
  suppress_same_day: true,
  suppress_explicit_series: true,
  high_occurrence_count: 3,
  medium_day_threshold: 7,
} as const;

export function duplicateSeverity(
  diagnosticKind: "lab" | "imaging",
  daysBetween: number,
  occurrenceCount: number,
): CandidateSeverity {
  if (occurrenceCount >= DUPLICATE_POLICY.high_occurrence_count) return "high";
  if (diagnosticKind === "imaging") return "high";
  return daysBetween <= DUPLICATE_POLICY.medium_day_threshold ? "medium" : "low";
}

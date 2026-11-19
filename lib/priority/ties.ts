import type { PatientInterventionPriority } from "./types";

/** Frozen deterministic order. No locale, name, insertion order, or randomness. */
export function comparePatientPriority(
  left: PatientInterventionPriority,
  right: PatientInterventionPriority,
): number {
  if (right.patient_priority_score !== left.patient_priority_score) {
    return right.patient_priority_score - left.patient_priority_score;
  }
  if (right.breakdown.top_gap_raw !== left.breakdown.top_gap_raw) {
    return right.breakdown.top_gap_raw - left.breakdown.top_gap_raw;
  }
  const leftOverdue = left.breakdown.top_gap_overdue_days ?? 0;
  const rightOverdue = right.breakdown.top_gap_overdue_days ?? 0;
  if (rightOverdue !== leftOverdue) return rightOverdue - leftOverdue;
  if (right.breakdown.verified_gap_count !== left.breakdown.verified_gap_count) {
    return right.breakdown.verified_gap_count - left.breakdown.verified_gap_count;
  }
  if (left.patient_id < right.patient_id) return -1;
  if (left.patient_id > right.patient_id) return 1;
  return 0;
}

export function isQueueEligible(priority: PatientInterventionPriority): boolean {
  return priority.priority_band !== "NONE" && priority.breakdown.verified_gap_count > 0;
}

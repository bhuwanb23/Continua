import type { CandidateSeverity } from "@/lib/domain";

export const MONITORING_DETECTOR = {
  detector: "monitoring-v1",
  severity_medium_overdue_days: 30,
  severity_high_overdue_days: 90,
} as const;

/** Workflow severity based only on elapsed window, not clinical risk. */
export function monitoringSeverity(overdueDays: number): CandidateSeverity {
  if (overdueDays > MONITORING_DETECTOR.severity_high_overdue_days) return "high";
  if (overdueDays > MONITORING_DETECTOR.severity_medium_overdue_days) return "medium";
  return "low";
}

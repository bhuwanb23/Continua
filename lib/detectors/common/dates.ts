import { addDays, daysBetween, dueDate, isIsoDate, overdueDays } from "@/lib/evaluation/temporal";
import type { TemporalState } from "@/lib/domain";

export const DUE_SOON_WINDOW_DAYS = 7;

export { addDays, daysBetween, dueDate, isIsoDate, overdueDays };

/**
 * Calendar-only temporal classification. The caller must inject the evaluation
 * clock; this module never reads the wall clock.
 */
export function classifyTemporalState(
  due: string,
  evaluationAsOfDate: string,
  resolved = false,
): TemporalState {
  if (resolved) return "RESOLVED";
  const remainingDays = daysBetween(evaluationAsOfDate, due);
  if (remainingDays < 0) return "OVERDUE";
  if (remainingDays <= DUE_SOON_WINDOW_DAYS) return "DUE_SOON";
  return "OPEN";
}

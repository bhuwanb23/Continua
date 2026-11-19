import type { ImpactInputs, ImpactResult } from "@/lib/impact/types";

export const IMPACT_FORMULA =
  "patients * (baseline_minutes_per_patient - assisted_minutes_per_patient) * working_days_per_month / 60";

/**
 * Pure, deterministic model. System latency is deliberately NOT an input:
 * AI compute time is not coordinator review time.
 */
export function calculateRedirectedTime(inputs: ImpactInputs): ImpactResult {
  const perPatientMinutesSaved = inputs.baselineMinutesPerPatient - inputs.assistedMinutesPerPatient;
  const perDayMinutes = inputs.patients * perPatientMinutesSaved;
  const perMonthMinutes = perDayMinutes * inputs.workingDaysPerMonth;
  return {
    perPatientMinutesSaved,
    perDayMinutes,
    perDayHours: perDayMinutes / 60,
    perMonthMinutes,
    perMonthHours: perMonthMinutes / 60,
    formula: IMPACT_FORMULA,
  };
}

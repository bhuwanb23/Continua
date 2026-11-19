export interface ImpactInputs {
  patients: number;
  baselineMinutesPerPatient: number;
  assistedMinutesPerPatient: number;
  workingDaysPerMonth: number;
}

export interface ImpactResult {
  perPatientMinutesSaved: number;
  perDayMinutes: number;
  perDayHours: number;
  perMonthMinutes: number;
  perMonthHours: number;
  formula: string;
}

export interface Assumption {
  id: string;
  label: string;
  value: number;
  unit: string;
  classification: "SCENARIO_ASSUMPTION";
  editable: boolean;
  rationale: string;
}

export const IMPACT_BOUNDS = {
  patients: { min: 1, max: 1000 },
  baselineMinutesPerPatient: { min: 0, max: 120 },
  assistedMinutesPerPatient: { min: 0, max: 120 },
  workingDaysPerMonth: { min: 1, max: 31 },
} as const;

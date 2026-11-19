import type { Assumption } from "@/lib/impact/types";

export const DEFAULT_ASSUMPTIONS: Assumption[] = [
  {
    id: "patients-reviewed-per-day",
    label: "Patients reviewed per working day",
    value: 20,
    unit: "patients",
    classification: "SCENARIO_ASSUMPTION",
    editable: true,
    rationale: "Scenario assumption. The demo panel has 80 patients, reviewed across several days.",
  },
  {
    id: "baseline-review-minutes",
    label: "Baseline manual review minutes per patient",
    value: 8,
    unit: "minutes",
    classification: "SCENARIO_ASSUMPTION",
    editable: true,
    rationale: "Scenario assumption for manual information search and review. Not measured.",
  },
  {
    id: "assisted-review-minutes",
    label: "Continua-assisted review minutes per patient",
    value: 6,
    unit: "minutes",
    classification: "SCENARIO_ASSUMPTION",
    editable: true,
    rationale:
      "Scenario assumption of a conservative 2-minute reduction. Assisted review is NOT system latency.",
  },
  {
    id: "working-days-per-month",
    label: "Working days per month",
    value: 20,
    unit: "days",
    classification: "SCENARIO_ASSUMPTION",
    editable: true,
    rationale: "Model input.",
  },
];

export const ASSUMPTION_VALUES = {
  patients: 20,
  baselineMinutesPerPatient: 8,
  assistedMinutesPerPatient: 6,
  workingDaysPerMonth: 20,
} as const;

import type { ImpactInputs } from "@/lib/impact/types";
import { IMPACT_BOUNDS } from "@/lib/impact/types";

export interface ImpactValidationIssue {
  field: keyof ImpactInputs;
  message: string;
}

export function validateImpactInputs(inputs: ImpactInputs): ImpactValidationIssue[] {
  const issues: ImpactValidationIssue[] = [];
  (Object.keys(IMPACT_BOUNDS) as (keyof ImpactInputs)[]).forEach((key) => {
    const bounds = IMPACT_BOUNDS[key];
    const value = inputs[key];
    if (!Number.isFinite(value)) {
      issues.push({ field: key, message: `${key} must be a finite number` });
      return;
    }
    if (value < bounds.min || value > bounds.max) {
      issues.push({ field: key, message: `${key} must be between ${bounds.min} and ${bounds.max}` });
    }
  });
  if (inputs.assistedMinutesPerPatient > inputs.baselineMinutesPerPatient) {
    issues.push({ field: "assistedMinutesPerPatient", message: "assisted review time cannot exceed baseline" });
  }
  return issues;
}

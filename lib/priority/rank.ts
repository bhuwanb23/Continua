import { comparePatientPriority, isQueueEligible } from "./ties";
import type { PatientInterventionPriority } from "./types";

/** Assigns 1-based ranks only to patients with at least one verified gap. */
export function rankPatientPriorities(
  priorities: readonly PatientInterventionPriority[],
): PatientInterventionPriority[] {
  return priorities
    .filter(isQueueEligible)
    .sort(comparePatientPriority)
    .map((priority, index) => ({ ...priority, rank: index + 1 }));
}

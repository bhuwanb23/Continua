import type { PatientInterventionPriority } from "./types";

export const DEFAULT_QUEUE_K = 5;
export const MAX_QUEUE_K = 80;

export function selectTopK(
  rankedPatients: readonly PatientInterventionPriority[],
  k: number = DEFAULT_QUEUE_K,
): PatientInterventionPriority[] {
  if (!Number.isInteger(k) || k < 1 || k > MAX_QUEUE_K) {
    throw new Error(`k must be an integer from 1 to ${MAX_QUEUE_K}`);
  }
  return rankedPatients.filter((patient) => patient.rank !== null).slice(0, k);
}

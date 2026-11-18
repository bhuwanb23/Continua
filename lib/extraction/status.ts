export const PIPELINE_STAGES = [
  "LOADING_RECORDS",
  "EXTRACTING",
  "VALIDATING",
  "NORMALIZING",
  "RECONCILING",
  "COMPLETE",
  "PARTIAL",
  "FAILED",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type PatientExtractionStatus = "COMPLETE" | "PARTIAL" | "FAILED";

/**
 * A patient is COMPLETE only when every document extracted successfully.
 * Failed documents never produce fallback events, and a partially analyzed
 * patient must never be reported as fully analyzed.
 */
export function patientExtractionStatus(documentStatuses: Array<"ok" | "failed">): PatientExtractionStatus {
  if (documentStatuses.length === 0) return "FAILED";
  const failed = documentStatuses.filter((status) => status === "failed").length;
  if (failed === 0) return "COMPLETE";
  if (failed === documentStatuses.length) return "FAILED";
  return "PARTIAL";
}
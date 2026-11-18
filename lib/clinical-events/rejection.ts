import type { ClinicalEventRejection, ClinicalEventRejectionCode } from "@/lib/domain";

export function rejectClinicalEvent(
  code: ClinicalEventRejectionCode,
  reason: string,
  candidate: unknown,
  stage: ClinicalEventRejection["stage"] = "clinical_event_validation",
): ClinicalEventRejection {
  return {
    code,
    stage,
    reason,
    candidate_event: candidate,
  };
}

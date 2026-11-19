import type { DetectionContext } from "@/lib/domain";
import { GAP_POLICY_VERSION } from "@/lib/domain";
import { DETECTOR_VERSION, EVALUATION_AS_OF_DATE } from "@/lib/domain/versions";
import { isIsoDate } from "./common/dates";

export function createDetectionContext(
  evaluationAsOfDate: string = EVALUATION_AS_OF_DATE,
): DetectionContext {
  if (!isIsoDate(evaluationAsOfDate)) {
    throw new Error(`Invalid evaluation_as_of_date: ${evaluationAsOfDate}`);
  }
  return {
    evaluation_as_of_date: evaluationAsOfDate,
    policy_version: GAP_POLICY_VERSION,
    detector_version: DETECTOR_VERSION,
  };
}

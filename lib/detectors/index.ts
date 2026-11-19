import type { CandidateGap, CanonicalClinicalEvent, DetectionContext } from "@/lib/domain";
import { dedupeCandidateGaps } from "./common/dedupe";
import { duplicateDetector } from "./duplicate/detector";
import { followupDetector } from "./followup/detector";
import { monitoringDetector } from "./monitoring/detector";

export * from "./context";
export * from "./detector";
export * from "./common/dates";
export * from "./common/dedupe";
export * from "./common/evidence";
export * from "./common/events";
export * from "./common/ids";
export * from "./duplicate/identity";
export * from "./duplicate/grouping";
export * from "./followup/policy";
export * from "./followup/matching";
export * from "./monitoring/registry";
export * from "./monitoring/completion";

/** The only cross-detector entry point. Different gap types never merge. */
export function detectCandidateGaps(
  events: CanonicalClinicalEvent[],
  context: DetectionContext,
): CandidateGap[] {
  return dedupeCandidateGaps([
    ...followupDetector.detect(events, context),
    ...duplicateDetector.detect(events, context),
    ...monitoringDetector.detect(events, context),
  ]);
}

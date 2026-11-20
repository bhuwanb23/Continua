import type { CandidateGap, CanonicalClinicalEvent, DetectionContext } from "@/lib/domain";
import { gateAbsenceGaps } from "@/lib/reliability/completeness";
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

/**
 * The only cross-detector entry point. Different gap types never merge.
 *
 * Phase-16 completeness invariant: absence-derived detectors are gated on a
 * COMPLETE analysis. An omitted completeness means the frozen benchmark/demo
 * pathway, which is COMPLETE by construction.
 */
export function detectCandidateGaps(
  events: CanonicalClinicalEvent[],
  context: DetectionContext,
): CandidateGap[] {
  const candidates = dedupeCandidateGaps([
    ...followupDetector.detect(events, context),
    ...duplicateDetector.detect(events, context),
    ...monitoringDetector.detect(events, context),
  ]);
  return gateAbsenceGaps(candidates, context.patient_completeness ?? "COMPLETE").gaps;
}

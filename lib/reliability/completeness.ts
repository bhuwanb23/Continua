import type {
  CandidateGap,
  GapType,
  PatientAnalysisCompleteness,
} from "@/lib/domain";

/**
 * Absence-derived gaps claim that something did NOT happen. Those claims are
 * only trustworthy when every available record was processed. Positive-fact
 * gaps (a duplicated test that is present in the record) stay valid.
 */
export const ABSENCE_DERIVED_GAP_TYPES: readonly GapType[] = [
  "missed_followup",
  "med_monitoring",
] as const;

export const PARTIAL_DATA_COPY =
  "Some available records could not be processed; results may be incomplete." as const;

export const ABSENCE_SUPPRESSED_REASON =
  "Absence-derived gap suppressed because patient analysis is not COMPLETE." as const;

export function isAbsenceDerivedGap(gapType: GapType): boolean {
  return ABSENCE_DERIVED_GAP_TYPES.includes(gapType);
}

export function canUseAbsenceReasoning(completeness: PatientAnalysisCompleteness): boolean {
  return completeness === "COMPLETE";
}

export interface CompletenessGateResult {
  gaps: CandidateGap[];
  suppressed: Array<{ gap_id: string; gap_type: GapType; reason: string }>;
}

/**
 * The R0/R1 invariant from Phase 16: an incomplete patient must never produce a
 * trusted absence claim. Suppression is silent to the coordinator only because
 * the completeness state itself must be surfaced separately.
 */
export function gateAbsenceGaps(
  gaps: readonly CandidateGap[],
  completeness: PatientAnalysisCompleteness,
): CompletenessGateResult {
  if (canUseAbsenceReasoning(completeness)) {
    return { gaps: [...gaps], suppressed: [] };
  }
  const kept: CandidateGap[] = [];
  const suppressed: CompletenessGateResult["suppressed"] = [];
  for (const gap of gaps) {
    if (isAbsenceDerivedGap(gap.gap_type)) {
      suppressed.push({
        gap_id: gap.gap_id,
        gap_type: gap.gap_type,
        reason: ABSENCE_SUPPRESSED_REASON,
      });
    } else {
      kept.push(gap);
    }
  }
  return { gaps: kept, suppressed };
}

/**
 * Mirrors the extraction status function without importing the extraction layer,
 * so the reliability contract can be used by pure tests and scripts.
 */
export function completenessFromDocumentStatuses(
  statuses: ReadonlyArray<"ok" | "failed">,
): PatientAnalysisCompleteness {
  if (statuses.length === 0) return "FAILED";
  const failed = statuses.filter((status) => status === "failed").length;
  if (failed === 0) return "COMPLETE";
  if (failed === statuses.length) return "FAILED";
  return "PARTIAL";
}

export function describeCompleteness(completeness: PatientAnalysisCompleteness): string {
  if (completeness === "COMPLETE") return "All available records were processed.";
  if (completeness === "PARTIAL") return PARTIAL_DATA_COPY;
  return "Analysis failed; no verified issues are available for this patient.";
}

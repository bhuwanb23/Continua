import { ApiError } from "@/lib/api/errors";
import { gapDisplayTitle, gapSummary, priorityLabel } from "@/lib/api/display";
import type { GapsResponse } from "@/lib/api/dto";
import { notFound } from "@/lib/api/handler";
import type { VerifiedGap } from "@/lib/domain";
import { demoRepository } from "./context";

export type GapSummaryDto = GapsResponse["gaps"][number];

export function evidenceCount(gap: VerifiedGap): number {
  const bundle = gap.evidence_bundle;
  return bundle.positive.length + bundle.absence.length + bundle.policy.length;
}

/**
 * Verified gaps only. Candidates never reach this service: the repository
 * exposes the frozen VerifiedGap set from `verified-gaps.json`.
 */
export async function listVerifiedGaps(
  patientId: string,
  requestId: string,
): Promise<Omit<GapsResponse, "meta" | "disclaimer">> {
  const repository = demoRepository();
  const patient = await repository.patients.getById(patientId);
  if (!patient) throw notFound("patient_not_found", "Patient not found.", requestId);

  const gaps = await repository.verifiedGaps.listByPatient(patientId);
  const priorities = await Promise.all(gaps.map((gap) => repository.priorities.getGapPriority(gap.gap_id)));

  const items: GapSummaryDto[] = gaps.map((gap, index) => {
    const priority = priorities[index];
    if (!priority) {
      throw new ApiError("data_integrity_error", "Cached gap priority is missing.", 500, requestId);
    }
    if (gap.evidence_bundle.verification_status !== "verified") {
      throw new ApiError("data_integrity_error", "A displayed gap is not verified.", 500, requestId);
    }
    return {
      gap_id: gap.gap_id,
      gap_type: gap.gap_type,
      title: gapDisplayTitle(gap.gap_type, gap.title),
      workflow_severity: gap.severity,
      gap_priority_score: priority.gap_priority_score,
      priority_band: priority.priority_band,
      priority_label: priorityLabel(priority.priority_band),
      summary: gapSummary(gap),
      recommended_coordinator_action: gap.recommended_coordinator_action,
      evidence_status: "verified",
      evidence_count: evidenceCount(gap),
    };
  });

  items.sort((left, right) => {
    if (left.gap_priority_score !== right.gap_priority_score) {
      return right.gap_priority_score - left.gap_priority_score;
    }
    return left.gap_id.localeCompare(right.gap_id);
  });

  return { patient_id: patientId, gaps: items };
}

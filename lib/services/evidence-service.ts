import { ApiError } from "@/lib/api/errors";
import { absenceDescription, sourceExcerpt } from "@/lib/api/display";
import type { EvidenceResponse } from "@/lib/api/dto";
import { notFound } from "@/lib/api/handler";
import type { AbsenceDeepDive, EvidenceSourceDeepDive, PolicyDeepDive, VerifiedGap } from "@/lib/domain";
import { demoRepository } from "./context";

interface DeepDiveArtifact {
  sources: EvidenceSourceDeepDive[];
  absence_checks: AbsenceDeepDive[];
  policy_checks: PolicyDeepDive[];
}

/**
 * Trust deep-dive for one verified gap. Ownership is enforced here: a bundle or
 * deep dive that belongs to another patient is a data-integrity failure, never
 * a normal 404.
 */
export async function getEvidence(
  gapId: string,
  requestId: string,
): Promise<Omit<EvidenceResponse, "meta" | "disclaimer">> {
  const repository = demoRepository();
  const gap: VerifiedGap | null = await repository.verifiedGaps.getById(gapId);
  if (!gap) throw notFound("gap_not_found", "Gap not found.", requestId);

  const bundle = await repository.evidence.getByGapId(gapId);
  if (!bundle) {
    throw new ApiError("data_integrity_error", "Verified gap has no evidence bundle.", 500, requestId);
  }
  if (bundle.patient_id !== gap.patient_id || bundle.gap_id !== gap.gap_id) {
    throw new ApiError("data_integrity_error", "Evidence ownership mismatch.", 500, requestId);
  }

  const deepDive = (await repository.evidence.getDeepDive(gapId)) as DeepDiveArtifact | null;
  if (!deepDive) {
    throw new ApiError("data_integrity_error", "Verified gap has no evidence deep dive.", 500, requestId);
  }

  const methodByEvidenceId = new Map(
    bundle.positive.map((item) => [item.evidence_id, item.verification_method] as const),
  );

  return {
    gap_id: gap.gap_id,
    verification_status: "verified",
    claims: bundle.claims.map((claim) => ({
      claim: claim.claim,
      value: claim.value ?? null,
      status: claim.supported ? ("verified" as const) : ("unsupported" as const),
      evidence_ids: claim.evidence_ids,
    })),
    sources: deepDive.sources.map((source) => ({
      document_id: source.source_doc_id,
      document_type: source.document_type,
      provider: source.provider ?? null,
      date: source.document_date,
      quoted_span: source.quoted_span,
      source_excerpt: sourceExcerpt(source.source_text_excerpt),
      verification_method: methodByEvidenceId.get(source.evidence_id) ?? "exact",
    })),
    absence_checks: deepDive.absence_checks.map((check) => ({
      description: absenceDescription(check),
      window_start: check.window_start ?? null,
      window_end: check.window_end ?? null,
      matching_event_count: check.matching_event_count,
      status: check.matching_event_count === 0 ? "verified" : "contradicted",
    })),
    policy_checks: deepDive.policy_checks.map((check) => ({
      policy: check.policy_id,
      status: "verified",
      detail: check.rule,
    })),
  };
}

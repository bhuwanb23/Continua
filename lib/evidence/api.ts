import type { EvidenceApiResponse, VerifiedGap } from "@/lib/domain";
import { EVIDENCE_DISCLAIMER } from "./version";

export function toEvidenceApiResponse(gap: VerifiedGap): EvidenceApiResponse {
  return {
    gap_id: gap.gap_id,
    verification_status: "verified",
    claims: gap.evidence_bundle.claims.map((claim) => ({
      claim: claim.claim,
      ...(claim.value !== undefined ? { value: claim.value } : {}),
      evidence_ids: claim.evidence_ids,
    })),
    sources: gap.evidence_deep_dive.sources.map((source) => ({
      evidence_id: source.evidence_id,
      event_id: source.event_id,
      source_doc_id: source.source_doc_id,
      document_type: source.document_type,
      provider: source.provider,
      document_date: source.document_date,
      quoted_span: source.quoted_span,
      ...(source.span_start !== undefined ? { span_start: source.span_start } : {}),
      ...(source.span_end !== undefined ? { span_end: source.span_end } : {}),
      excerpt: source.source_text_excerpt,
    })),
    absence_checks: gap.evidence_deep_dive.absence_checks,
    policy_checks: gap.evidence_deep_dive.policy_checks,
    disclaimer: EVIDENCE_DISCLAIMER,
  };
}

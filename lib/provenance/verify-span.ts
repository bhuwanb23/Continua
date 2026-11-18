import { verifySourceSpan } from "@/lib/evidence/span-match";
import { locateSpanOffsets } from "./offsets";
import type { ProvenanceCandidate, ProvenanceContext, ProvenanceResult } from "./types";
import { verifySourceDocument } from "./verify-doc";

export { verifySourceSpan };

/**
 * Full provenance gate: document exists → patient owns → recorded offsets
 * consistent → span supported at the frozen threshold. Failure rejects the
 * whole candidate; a citation is never dropped while keeping the fact.
 */
export function verifyProvenance(
  candidate: ProvenanceCandidate,
  context: ProvenanceContext,
): ProvenanceResult {
  const document = verifySourceDocument(candidate, context);
  if (!document.ok) return document;
  const text = document.record.text;

  if (candidate.span_start !== undefined && candidate.span_end !== undefined) {
    if (candidate.span_end > text.length || candidate.span_end < candidate.span_start) {
      return { ok: false, code: "CE-006", reason: "Source span offsets exceed the source document." };
    }
    const ranged = text.slice(candidate.span_start, candidate.span_end);
    if (!verifySourceSpan(candidate.source_span, ranged).supported) {
      return { ok: false, code: "CE-006", reason: "Recorded source offsets do not match the source span." };
    }
  }

  const verification = verifySourceSpan(candidate.source_span, text);
  if (!verification.supported || verification.method === "none") {
    return {
      ok: false,
      code: "CE-006",
      reason: "Source span could not be verified at the required threshold.",
    };
  }

  const offsets = locateSpanOffsets(candidate.source_span, text);
  return {
    ok: true,
    source: {
      source_doc_id: candidate.source_doc_id,
      source_span: candidate.source_span,
      ...(offsets ?? {}),
      verification_method: verification.method,
      verification_score: verification.score,
    },
  };
}
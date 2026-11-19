import type { CandidateGap, EvidenceBundle, SuppressionRecord } from "@/lib/domain";
import { EVIDENCE_SCHEMA_VERSION } from "@/lib/domain";

export function buildSuppressionRecord(
  candidate: CandidateGap,
  bundle: EvidenceBundle,
): SuppressionRecord {
  const first = bundle.failures[0];
  return {
    gap_id: candidate.gap_id,
    patient_id: candidate.patient_id,
    gap_type: candidate.gap_type,
    status: "suppressed",
    failure_codes: [...new Set(bundle.failures.map((failure) => failure.code))].sort(),
    primary_failure_code: first?.code ?? "EV-012",
    ...(first?.event_id ? { event_id: first.event_id } : {}),
    ...(first?.source_doc_id ? { source_doc_id: first.source_doc_id } : {}),
    evidence_version: EVIDENCE_SCHEMA_VERSION,
    message: first?.message ?? "Candidate could not be verified.",
  };
}

/** Only verified gaps may cross the Phase 8 trust boundary. */
export function suppressUnverified<T extends { status: "verified" | "suppressed" }>(
  results: T[],
): T[] {
  return results.filter((result) => result.status === "verified");
}

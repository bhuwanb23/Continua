import type { EvidenceAuditStep, EvidenceBundle, GapVerificationResult } from "@/lib/domain";

export function buildAuditTrail(
  bundle: EvidenceBundle,
  status: "verified" | "suppressed",
): EvidenceAuditStep[] {
  const failures = bundle.failures;
  const failedStages = new Set(failures.map((failure) => failure.stage));
  const step = (
    id: EvidenceAuditStep["step"],
    stage: string,
    detail: string,
  ): EvidenceAuditStep => ({
    step: id,
    status: failedStages.has(stage as never) ? "fail" : "pass",
    detail,
  });

  return [
    step("candidate_received", "candidate", "Candidate identity and versions checked."),
    step("evidence_collected", "claims", `${bundle.positive.length} positive source item(s), ${bundle.absence.length} absence query/queries, ${bundle.policy.length} policy item(s).`),
    step("documents_verified", "document", "Source documents exist and are owned by the candidate patient."),
    step("spans_verified", "span", "Positive source spans checked with bounded lexical support."),
    step("fields_verified", "fields", "Critical normalized fields checked against canonical events and source spans."),
    step("absence_verified", "absence", "Absence queries re-executed over the current canonical event store."),
    step("policies_verified", "policy", "Frozen policy identity, version, rule, and provenance class checked."),
    {
      step: "decision",
      status: status === "verified" ? "pass" : "fail",
      detail: status === "verified"
        ? `All ${bundle.required_claim_count} required claims supported.`
        : `${failures.length} critical evidence failure(s); candidate suppressed.`,
    },
  ];
}

export function auditRecordFor(result: GapVerificationResult): Record<string, unknown> {
  return {
    gap_id: result.candidate.gap_id,
    patient_id: result.candidate.patient_id,
    gap_type: result.candidate.gap_type,
    status: result.status,
    internal_status: result.internal_status,
    claim_coverage: result.bundle.claim_coverage,
    failures: result.bundle.failures,
    audit: result.audit,
  };
}

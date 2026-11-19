import type {
  CandidateGap,
  GapVerificationResult,
  VerifiedGap,
} from "@/lib/domain";
import { CANDIDATE_GAP_SCHEMA_VERSION, EVIDENCE_SCHEMA_VERSION, VERIFIED_GAP_SCHEMA_VERSION } from "@/lib/domain";
import { buildAuditTrail } from "./audit";
import { collectEvidence } from "./collect";
import { buildEvidenceDeepDive, buildStructuredRationale, verifiedGapTitle } from "./rationale";
import { buildSuppressionRecord } from "./suppress";
import { internalStatusFor, verifyEvidenceBundle } from "./verify-gap";
import type { EvidenceVerificationContext } from "./version";

function verifiedGapFor(
  candidate: CandidateGap,
  bundle: GapVerificationResult["bundle"],
  context: EvidenceVerificationContext,
): VerifiedGap {
  return {
    schema_version: VERIFIED_GAP_SCHEMA_VERSION,
    gap_id: candidate.gap_id,
    patient_id: candidate.patient_id,
    gap_type: candidate.gap_type,
    severity: candidate.severity,
    title: verifiedGapTitle(candidate),
    candidate,
    evidence_bundle: bundle,
    grounded: true,
    rationale: buildStructuredRationale(candidate, bundle),
    explanation: buildStructuredRationale(candidate, bundle).text,
    recommended_coordinator_action: candidate.recommended_coordinator_action,
    evidence_deep_dive: buildEvidenceDeepDive(candidate, bundle, context),
    verification: {
      evidence_version: EVIDENCE_SCHEMA_VERSION,
      clinical_event_schema: context.clinical_event_schema,
      extractor_version: context.extractor_version,
      detector_version: candidate.detector_version,
      gap_policy_version: candidate.policy_version,
      dataset_version: context.dataset_version,
      event_store_hash: context.event_store_hash,
      evaluation_as_of_date: context.evaluation_as_of_date,
      verified_at: `${context.evaluation_as_of_date}T00:00:00.000Z`,
    },
  };
}

export function verifyCandidateGap(
  candidate: CandidateGap,
  context: EvidenceVerificationContext,
): GapVerificationResult {
  const malformed =
    candidate.schema_version !== CANDIDATE_GAP_SCHEMA_VERSION ||
    !candidate.gap_id ||
    !candidate.patient_id ||
    !Array.isArray(candidate.evidence_refs);
  const collected = collectEvidence(candidate, context);
  if (malformed) {
    collected.bundle.failures.push({
      code: "EV-012",
      stage: "candidate",
      message: "Candidate is malformed or has an unsupported schema version.",
    });
    collected.bundle.verification_status = "failed";
  }
  const verified = verifyEvidenceBundle(candidate, collected.bundle, context);
  const status = verified.failures.length === 0 ? "verified" : "suppressed";
  const audit = buildAuditTrail(collected.bundle, status);
  return {
    candidate,
    status,
    internal_status: internalStatusFor(verified.failures),
    verified_gap: status === "verified" ? verifiedGapFor(candidate, collected.bundle, context) : null,
    bundle: collected.bundle,
    suppression: status === "suppressed" ? buildSuppressionRecord(candidate, collected.bundle) : null,
    audit,
  };
}

export function verifyCandidateGaps(
  candidates: CandidateGap[],
  context: EvidenceVerificationContext,
): GapVerificationResult[] {
  return candidates.map((candidate) => verifyCandidateGap(candidate, context));
}

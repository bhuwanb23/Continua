import type {
  CandidateGap,
  EvidenceBundle,
  EvidenceFailureCode,
  InternalVerificationStatus,
  VerificationFailure as EvidenceFailure,
} from "@/lib/domain";
import { EVIDENCE_SCHEMA_VERSION, GAP_POLICY_VERSION } from "@/lib/domain";
import { DETECTOR_VERSION } from "@/lib/domain/versions";
import { normalizeSpan } from "@/lib/evidence/span-match";
import { expectedAbsenceDefinitions } from "./collect";
import { sameAbsenceDefinition, verifyAbsenceDefinition } from "./verify-absence";
import { verifyDocument } from "./verify-document";
import { verifyCriticalFields } from "./verify-fields";
import { verifyEventOwnership } from "./verify-patient";
import { verifyPolicyEvidence } from "./verify-policy";
import { offsetsMatchQuote, verifyEvidenceSpan } from "./verify-span";
import type { EvidenceVerificationContext } from "./version";

export interface BundleVerification {
  failures: EvidenceFailure[];
  claims_supported: Set<string>;
}

function failureCodeStatus(code: EvidenceFailureCode): InternalVerificationStatus {
  if (code === "EV-001") return "SOURCE_MISSING";
  if (code === "EV-002") return "PATIENT_MISMATCH";
  if (code === "EV-004") return "SPAN_FAILED";
  if (code === "EV-005" || code === "EV-003") return "EVENT_MISMATCH";
  if (code === "EV-006" || code === "EV-007") return "POLICY_MISSING";
  if (code === "EV-008" || code === "EV-009") return "ABSENCE_QUERY_INVALID";
  return "INSUFFICIENT_SUPPORT";
}

export function internalStatusFor(failures: EvidenceFailure[]): InternalVerificationStatus {
  if (failures.length === 0) return "VERIFIED";
  return failureCodeStatus(failures[0]?.code ?? "EV-012");
}

function expectedRefKey(eventId: string, sourceDocId: string): string {
  return `${eventId}|${sourceDocId}`;
}

export function verifyEvidenceBundle(
  candidate: CandidateGap,
  bundle: EvidenceBundle,
  context: EvidenceVerificationContext,
): BundleVerification {
  const failures: EvidenceFailure[] = [...bundle.failures];
  const claimsSupported = new Set<string>();

  if (bundle.schema_version !== EVIDENCE_SCHEMA_VERSION || bundle.gap_id !== candidate.gap_id || bundle.patient_id !== candidate.patient_id) {
    failures.push({
      code: "EV-012",
      stage: "candidate",
      message: "Evidence bundle identity or schema does not match the candidate.",
    });
  }

  if (!candidate.event_store_hash || candidate.event_store_hash !== context.event_store_hash) {
    failures.push({
      code: "EV-011",
      stage: "candidate",
      message: "Candidate was produced from a different event-store snapshot; recompute is required.",
    });
  }
  if (candidate.policy_version !== GAP_POLICY_VERSION || candidate.detector_version !== DETECTOR_VERSION) {
    failures.push({
      code: "EV-011",
      stage: "candidate",
      message: "Candidate detector or policy version is not the frozen verification target.",
    });
  }

  const expectedRefs = new Set<string>();
  for (const ref of candidate.evidence_refs) expectedRefs.add(expectedRefKey(ref.event_id, ref.source_doc_id));
  for (const id of candidate.trigger_event_ids) {
    const ref = candidate.evidence_refs.find((item) => item.event_id === id);
    if (ref) expectedRefs.add(expectedRefKey(ref.event_id, ref.source_doc_id));
  }

  const positiveEvidence = new Set(bundle.positive.map((item) => expectedRefKey(item.event_id, item.source_doc_id)));
  for (const expected of expectedRefs) {
    if (!positiveEvidence.has(expected)) {
      const [eventId] = expected.split("|");
      failures.push({
        code: "EV-010",
        stage: "claims",
        message: "A required candidate evidence reference has no positive source evidence.",
        ...(eventId ? { event_id: eventId } : {}),
      });
    }
  }

  for (const positive of bundle.positive) {
    const owned = verifyEventOwnership(positive.event_id, candidate.patient_id, context);
    if (!owned.ok) {
      failures.push({ ...owned.failure, evidence_id: positive.evidence_id });
      continue;
    }
    const document = verifyDocument(positive.source_doc_id, candidate.patient_id, context);
    if (!document.ok) {
      failures.push({ ...document.failure, evidence_id: positive.evidence_id, event_id: positive.event_id });
      continue;
    }
    if (owned.event.source.source_doc_id !== positive.source_doc_id) {
      failures.push({
        code: "EV-003",
        stage: "ownership",
        message: "Positive evidence document does not match the canonical event source.",
        evidence_id: positive.evidence_id,
        event_id: positive.event_id,
        source_doc_id: positive.source_doc_id,
      });
      continue;
    }

    const span = verifyEvidenceSpan(positive.quoted_span, document.record.text);
    if (!span.supported) {
      failures.push({ ...(span.failure ?? {
        code: "EV-004",
        stage: "span",
        message: "Quoted span could not be verified.",
      }), evidence_id: positive.evidence_id, event_id: positive.event_id, source_doc_id: positive.source_doc_id });
      continue;
    }
    if (
      (positive.span_start !== undefined || positive.span_end !== undefined) &&
      !offsetsMatchQuote(document.record.text, positive.span_start, positive.span_end, positive.quoted_span)
    ) {
      failures.push({
        code: "EV-004",
        stage: "span",
        message: "Stored span offsets do not resolve to the quoted evidence.",
        evidence_id: positive.evidence_id,
        event_id: positive.event_id,
        source_doc_id: positive.source_doc_id,
      });
      continue;
    }
    if (
      owned.event.source.span_start !== undefined &&
      owned.event.source.span_end !== undefined &&
      !offsetsMatchQuote(
        document.record.text,
        owned.event.source.span_start,
        owned.event.source.span_end,
        owned.event.source.source_span,
      )
    ) {
      failures.push({
        code: "EV-003",
        stage: "span",
        message: "Canonical event offsets no longer match the source document.",
        evidence_id: positive.evidence_id,
        event_id: positive.event_id,
        source_doc_id: positive.source_doc_id,
      });
      continue;
    }

    positive.verification_method = span.method === "fuzzy" ? "fuzzy" : "exact";
    positive.verification_score = span.score;
    if (span.span_start !== undefined && span.span_end !== undefined) {
      positive.span_start = span.span_start;
      positive.span_end = span.span_end;
    }
    positive.verified = true;
  }

  const fields = verifyCriticalFields(candidate, bundle.positive, context.events);
  failures.push(...fields.failures);
  for (const claim of fields.supported_claims) claimsSupported.add(claim);

  const expectedAbsence = expectedAbsenceDefinitions(candidate);
  for (const expected of expectedAbsence) {
    const evidence = bundle.absence.find((item) => sameAbsenceDefinition(item.search_definition, expected));
    if (!evidence) {
      failures.push({
        code: "EV-008",
        stage: "absence",
        message: "Required absence query is missing from the evidence bundle.",
      });
      continue;
    }
    const result = verifyAbsenceDefinition(
      evidence.search_definition,
      candidate.patient_id,
      context.events,
      context.evaluation_as_of_date,
      true,
    );
    evidence.matching_event_count = result.matching_event_ids.length;
    evidence.matching_event_ids = result.matching_event_ids;
    if (!result.ok) {
      failures.push({ ...(result.failure ?? {
        code: "EV-009",
        stage: "absence",
        message: "Absence query failed.",
      }), evidence_id: evidence.evidence_id });
    } else {
      evidence.verified = true;
      if (candidate.gap_type === "missed_followup") claimsSupported.add("qualifying_completion_count");
      if (candidate.gap_type === "duplicate_test") claimsSupported.add("no_explicit_series");
      if (candidate.gap_type === "med_monitoring") {
        claimsSupported.add(
          expected.normalized_identity.startsWith("drug:")
            ? "no_medication_stop"
            : "no_qualifying_monitoring",
        );
      }
    }
  }
  for (const evidence of bundle.absence) {
    if (!expectedAbsence.some((expected) => sameAbsenceDefinition(evidence.search_definition, expected))) {
      failures.push({
        code: "EV-008",
        stage: "absence",
        message: "Evidence bundle contains an absence query that does not correspond to the candidate rule.",
        evidence_id: evidence.evidence_id,
      });
    }
  }

  const policy = verifyPolicyEvidence(candidate, bundle.policy, context.events);
  failures.push(...policy.failures);
  if (policy.ok) {
    if (candidate.gap_type === "missed_followup") claimsSupported.add("expected_window");
    if (candidate.gap_type === "med_monitoring") claimsSupported.add("monitoring_policy");
  }

  for (const claim of bundle.claims) {
    claim.supported = claimsSupported.has(claim.claim_id);
  }
  const unsupportedClaims = bundle.claims.filter((claim) => claim.required && !claim.supported);
  if (unsupportedClaims.length > 0) {
    failures.push({
      code: "EV-010",
      stage: "claims",
      message: `Required claims are unsupported: ${unsupportedClaims.map((claim) => claim.claim_id).join(", ")}.`,
    });
  }

  bundle.supported_claim_count = bundle.claims.filter((claim) => claim.supported).length;
  bundle.required_claim_count = bundle.claims.filter((claim) => claim.required).length;
  bundle.claim_coverage = bundle.required_claim_count === 0
    ? 0
    : bundle.supported_claim_count / bundle.required_claim_count;
  bundle.failures = failures;
  bundle.verification_status = failures.length === 0 ? "verified" : "failed";
  return { failures, claims_supported: claimsSupported };
}

export function bundleSemanticFingerprint(bundle: EvidenceBundle): string {
  return normalizeSpan(
    JSON.stringify({
      positive: [...bundle.positive]
        .map((item) => [item.evidence_id, item.event_id, item.source_doc_id, item.quoted_span, item.verified])
        .sort(),
      absence: [...bundle.absence]
        .map((item) => [item.evidence_id, item.search_definition, item.matching_event_count, item.verified])
        .sort(),
      policy: [...bundle.policy]
        .map((item) => [item.evidence_id, item.policy_id, item.policy_version, item.rule, item.source, item.verified])
        .sort(),
    }),
  );
}

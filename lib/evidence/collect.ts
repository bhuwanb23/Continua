import type {
  AbsenceEvidence,
  AbsenceSearchDefinition,
  CandidateGap,
  EvidenceBundle,
  EvidenceClaim,
  PositiveSourceEvidence,
  PolicyEvidence,
  VerificationFailure as EvidenceFailure,
} from "@/lib/domain";
import { monitoringRegistryFor } from "@/lib/detectors/monitoring/registry";
import { absenceEvidenceId, positiveEvidenceId, policyEvidenceId } from "./ids";
import { expectedPolicyFor } from "./verify-policy";
import type { EvidenceVerificationContext } from "./version";
import { EVIDENCE_SCHEMA_VERSION } from "@/lib/domain";

export function expectedAbsenceDefinitions(candidate: CandidateGap): AbsenceSearchDefinition[] {
  if (candidate.gap_type === "missed_followup") {
    return [
      {
        event_types: ["consult", "followup"],
        normalized_identity: `specialty:${candidate.metadata.specialty}`,
        start_date: candidate.metadata.referral_date,
        end_date: candidate.metadata.due_date,
      },
    ];
  }

  if (candidate.gap_type === "duplicate_test") {
    return [
      {
        event_types: ["lab_result", "imaging"],
        normalized_identity: `series:${candidate.metadata.normalized_identity}`,
        start_date: candidate.metadata.first_date,
        end_date: candidate.metadata.second_date,
      },
    ];
  }

  const entry = monitoringRegistryFor(candidate.metadata.medication);
  const monitoring: AbsenceSearchDefinition = entry?.completion === "oncology_consult"
    ? {
        event_types: ["consult", "followup"],
        normalized_identity: "specialty:oncology",
        start_date: candidate.metadata.medication_start_date,
        end_date: candidate.metadata.due_date,
      }
    : {
        event_types: ["lab_result"],
        normalized_identity: `lab_code:${(entry?.lab_codes ?? []).join("|")}`,
        start_date: candidate.metadata.medication_start_date,
        end_date: candidate.metadata.due_date,
      };
  return [
    monitoring,
    {
      event_types: ["medication_stop"],
      normalized_identity: `drug:${candidate.metadata.medication}`,
      start_date: candidate.metadata.medication_start_date,
      end_date: candidate.metadata.due_date,
    },
  ];
}

function positiveEvidence(
  candidate: CandidateGap,
  context: EvidenceVerificationContext,
  failures: EvidenceFailure[],
): PositiveSourceEvidence[] {
  const seen = new Set<string>();
  const items: PositiveSourceEvidence[] = [];
  for (const ref of candidate.evidence_refs) {
    const key = `${ref.event_id}|${ref.source_doc_id}|${ref.source_span}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const event = context.events_by_id.get(ref.event_id);
    if (!event) {
      failures.push({
        code: "EV-003",
        stage: "ownership",
        message: "Cited canonical event does not exist in the supplied event store.",
        event_id: ref.event_id,
        source_doc_id: ref.source_doc_id,
      });
    }
    items.push({
      evidence_id: positiveEvidenceId(candidate.gap_id, ref.event_id, ref.source_doc_id),
      kind: "source_span",
      patient_id: candidate.patient_id,
      event_id: ref.event_id,
      event_type: event?.event_type ?? "unknown",
      source_doc_id: ref.source_doc_id,
      quoted_span: ref.source_span,
      verification_method: "exact",
      verification_score: 1,
      verified: false,
    });
  }
  return items;
}

function claimsFor(
  candidate: CandidateGap,
  positive: PositiveSourceEvidence[],
  absence: AbsenceEvidence[],
  policy: PolicyEvidence[],
): EvidenceClaim[] {
  const positiveId = (eventId: string): string[] =>
    positive.filter((item) => item.event_id === eventId).map((item) => item.evidence_id);
  const claim = (
    claim_id: string,
    text: string,
    evidenceIds: string[],
    value?: string | number | boolean,
  ): EvidenceClaim => ({
    claim_id,
    claim: text,
    ...(value !== undefined ? { value } : {}),
    required: true,
    supported: false,
    evidence_ids: evidenceIds.filter(Boolean),
  });

  if (candidate.gap_type === "missed_followup") {
    const referralEvidence = positiveId(candidate.metadata.referral_event_id);
    return [
      claim("referral_exists", "referral_exists", referralEvidence),
      claim("specialty", "specialty", referralEvidence, candidate.metadata.specialty),
      claim("referral_date", "referral_date", referralEvidence, candidate.metadata.referral_date),
      claim(
        "expected_window",
        "expected_window_days",
        [...referralEvidence, ...policy.map((item) => item.evidence_id)],
        candidate.window_days ?? 0,
      ),
      claim(
        "qualifying_completion_count",
        "qualifying_completion_count",
        absence.map((item) => item.evidence_id),
        0,
      ),
    ];
  }

  if (candidate.gap_type === "duplicate_test") {
    const first = positiveId(candidate.metadata.first_event_id);
    const second = positiveId(candidate.metadata.second_event_id);
    return [
      claim("first_occurrence", "first_occurrence", first),
      claim("first_identity", "first_identity", first, candidate.metadata.normalized_identity),
      claim("first_date", "first_date", first, candidate.metadata.first_date),
      claim("second_occurrence", "second_occurrence", second),
      claim("second_identity", "second_identity", second, candidate.metadata.normalized_identity),
      claim("second_date", "second_date", second, candidate.metadata.second_date),
      claim("interval_within_window", "interval_within_window", [...first, ...second], candidate.metadata.days_between),
      claim(
        "no_explicit_series",
        "no_explicit_series",
        absence.map((item) => item.evidence_id),
        0,
      ),
    ];
  }

  const medication = positiveId(candidate.metadata.medication_start_event_id);
  return [
    claim("medication_start", "medication_start", medication),
    claim("medication_identity", "medication_identity", medication, candidate.metadata.medication),
    claim("medication_start_date", "medication_start_date", medication, candidate.metadata.medication_start_date),
    claim(
      "monitoring_policy",
      "monitoring_policy",
      policy.map((item) => item.evidence_id),
      candidate.metadata.monitoring_target,
    ),
    claim(
      "no_qualifying_monitoring",
      "no_qualifying_monitoring",
      absence.map((item) => item.evidence_id),
      0,
    ),
    claim(
      "no_medication_stop",
      "no_medication_stop",
      absence.map((item) => item.evidence_id),
      0,
    ),
  ];
}

export interface CollectedEvidence {
  bundle: EvidenceBundle;
}

export function collectEvidence(
  candidate: CandidateGap,
  context: EvidenceVerificationContext,
): CollectedEvidence {
  const failures: EvidenceFailure[] = [];
  const positive = positiveEvidence(candidate, context, failures);
  const expected = expectedPolicyFor(candidate, context.events);
  const policy: PolicyEvidence[] = [
    {
      evidence_id: policyEvidenceId(candidate.gap_id, expected.policy_id),
      kind: "policy",
      patient_id: candidate.patient_id,
      policy_id: expected.policy_id,
      policy_version: expected.policy_version,
      rule: expected.rule,
      source: expected.source,
      verified: false,
    },
  ];
  const absence: AbsenceEvidence[] = expectedAbsenceDefinitions(candidate).map((definition) => ({
    evidence_id: absenceEvidenceId(candidate.gap_id, definition),
    kind: "absence",
    patient_id: candidate.patient_id,
    search_definition: definition,
    matching_event_count: 0,
    matching_event_ids: [],
    event_store_version: context.event_store_hash,
    evaluation_as_of_date: context.evaluation_as_of_date,
    verified: false,
  }));
  const claims = claimsFor(candidate, positive, absence, policy);
  return {
    bundle: {
      schema_version: EVIDENCE_SCHEMA_VERSION,
      gap_id: candidate.gap_id,
      patient_id: candidate.patient_id,
      positive,
      absence,
      policy,
      claims,
      required_claim_count: claims.length,
      supported_claim_count: 0,
      claim_coverage: 0,
      verification_status: "failed",
      failures,
    },
  };
}

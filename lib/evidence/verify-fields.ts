import type {
  CandidateGap,
  CanonicalClinicalEvent,
  ConsultEvent,
  FollowupEvent,
  MedicationStartEvent,
  PositiveSourceEvidence,
  ReferralEvent,
  VerificationFailure as EvidenceFailure,
} from "@/lib/domain";
import { daysBetween, addDays } from "@/lib/evaluation/temporal";
import { normalizeSpan } from "@/lib/evidence/span-match";
import { normalizeBodyRegion, normalizeImagingModality, normalizeLab, normalizeMedication, normalizeSpecialty } from "@/lib/normalization";
import { eventFingerprint } from "@/lib/clinical-events";

export interface FieldVerification {
  ok: boolean;
  failures: EvidenceFailure[];
  supported_claims: Set<string>;
}

function includesAny(text: string, values: Array<string | null | undefined>): boolean {
  const normalized = normalizeSpan(text);
  return values.some((value) => {
    if (!value) return false;
    const candidate = normalizeSpan(value);
    return candidate.length > 0 && normalized.includes(candidate);
  });
}

function normalizedSpecialty(event: ConsultEvent | FollowupEvent | ReferralEvent): string | null {
  const typed = event.typed as unknown as Record<string, unknown>;
  const direct = typed["specialty_normalized"] ?? typed["specialty_raw"];
  return typeof direct === "string" ? normalizeSpecialty(direct) ?? direct.trim().toLowerCase() : null;
}

function positiveFor(positive: PositiveSourceEvidence[], eventId: string): PositiveSourceEvidence | undefined {
  return positive.find((item) => item.event_id === eventId);
}

function eventFor(events: CanonicalClinicalEvent[], eventId: string): CanonicalClinicalEvent | undefined {
  return events.find((event) => event.event_id === eventId);
}

function spanMatchesEvent(positive: PositiveSourceEvidence, event: CanonicalClinicalEvent): boolean {
  return normalizeSpan(positive.quoted_span) === normalizeSpan(event.source.source_span);
}

function eventLinkFailure(
  positive: PositiveSourceEvidence,
  event: CanonicalClinicalEvent,
): EvidenceFailure | null {
  if (event.patient_id !== positive.patient_id) {
    return {
      code: "EV-002",
      stage: "ownership",
      message: "Evidence event belongs to a different patient.",
      event_id: event.event_id,
      evidence_id: positive.evidence_id,
    };
  }
  if (event.source.source_doc_id !== positive.source_doc_id) {
    return {
      code: "EV-003",
      stage: "fields",
      message: "Evidence source document does not match the canonical event source.",
      event_id: event.event_id,
      evidence_id: positive.evidence_id,
      source_doc_id: positive.source_doc_id,
    };
  }
  if (!spanMatchesEvent(positive, event)) {
    return {
      code: "EV-003",
      stage: "fields",
      message: "Evidence quoted span does not match the canonical event provenance.",
      event_id: event.event_id,
      evidence_id: positive.evidence_id,
    };
  }
  return null;
}

function verifyFollowup(
  candidate: Extract<CandidateGap, { gap_type: "missed_followup" }>,
  positive: PositiveSourceEvidence[],
  events: CanonicalClinicalEvent[],
): FieldVerification {
  const failures: EvidenceFailure[] = [];
  const supported = new Set<string>();
  const positiveEvidence = positiveFor(positive, candidate.metadata.referral_event_id);
  const event = eventFor(events, candidate.metadata.referral_event_id) as ReferralEvent | undefined;
  if (!positiveEvidence || !event || event.event_type !== "referral") {
    failures.push({
      code: "EV-010",
      stage: "fields",
      message: "Required referral evidence is missing or points to a non-referral event.",
      event_id: candidate.metadata.referral_event_id,
    });
    return { ok: false, failures, supported_claims: supported };
  }
  const link = eventLinkFailure(positiveEvidence, event);
  if (link) failures.push(link);
  supported.add("referral_exists");

  const eventSpecialty = normalizedSpecialty(event);
  if (eventSpecialty !== candidate.metadata.specialty || candidate.identity.specialty !== candidate.metadata.specialty) {
    failures.push({
      code: "EV-005",
      stage: "fields",
      message: "Referral specialty is not consistent across candidate, event, and source.",
      evidence_id: positiveEvidence.evidence_id,
    });
  } else if (!includesAny(positiveEvidence.quoted_span, [event.typed.specialty_raw, event.typed.specialty_normalized])) {
    failures.push({
      code: "EV-005",
      stage: "fields",
      message: "Referral source span does not lexically support the normalized specialty.",
      evidence_id: positiveEvidence.evidence_id,
    });
  } else {
    supported.add("specialty");
  }

  if (event.date !== candidate.metadata.referral_date) {
    failures.push({
      code: "EV-005",
      stage: "fields",
      message: "Referral date does not match the canonical event date.",
      evidence_id: positiveEvidence.evidence_id,
    });
  } else {
    supported.add("referral_date");
  }

  if (!["placed", "unknown"].includes(event.typed.status) || candidate.metadata.referral_status !== event.typed.status) {
    failures.push({
      code: "EV-010",
      stage: "fields",
      message: "Referral is no longer unresolved in the canonical event store.",
      evidence_id: positiveEvidence.evidence_id,
    });
  }

  const expectedDue = addDays(event.date, candidate.window_days ?? 0);
  if (candidate.due_date !== expectedDue || candidate.metadata.due_date !== expectedDue) {
    failures.push({
      code: "EV-007",
      stage: "policy",
      message: "Follow-up due date does not match the verified window.",
      evidence_id: positiveEvidence.evidence_id,
    });
  }

  if (event.typed.window_source === "document") {
    if (
      event.typed.expected_window_days !== candidate.window_days ||
      !includesAny(positiveEvidence.quoted_span, [
        `${candidate.window_days} days`,
        `${candidate.window_days}-day`,
      ])
    ) {
      failures.push({
        code: "EV-005",
        stage: "fields",
        message: "Document-defined follow-up window is not supported by the referral source span.",
        evidence_id: positiveEvidence.evidence_id,
      });
    } else {
      supported.add("expected_window");
    }
  } else {
    supported.add("expected_window");
  }

  return { ok: failures.length === 0, failures, supported_claims: supported };
}

function verifyDuplicate(
  candidate: Extract<CandidateGap, { gap_type: "duplicate_test" }>,
  positive: PositiveSourceEvidence[],
  events: CanonicalClinicalEvent[],
): FieldVerification {
  const failures: EvidenceFailure[] = [];
  const supported = new Set<string>();
  const pairs = [
    { id: candidate.metadata.first_event_id, date: candidate.metadata.first_date, claimPrefix: "first" },
    { id: candidate.metadata.second_event_id, date: candidate.metadata.second_date, claimPrefix: "second" },
  ] as const;

  const resolved: CanonicalClinicalEvent[] = [];
  for (const pair of pairs) {
    const evidence = positiveFor(positive, pair.id);
    const event = eventFor(events, pair.id);
    if (!evidence || !event || (event.event_type !== "lab_result" && event.event_type !== "imaging")) {
      failures.push({
        code: "EV-010",
        stage: "fields",
        message: `Required ${pair.claimPrefix} diagnostic occurrence is missing.`,
        event_id: pair.id,
      });
      continue;
    }
    const link = eventLinkFailure(evidence, event);
    if (link) failures.push(link);
    resolved.push(event);
    supported.add(`${pair.claimPrefix}_occurrence`);
    if (event.date !== pair.date || candidate.evidence_refs.every((ref) => ref.event_id !== event.event_id)) {
      failures.push({
        code: "EV-005",
        stage: "fields",
        message: `Diagnostic occurrence ${pair.claimPrefix} date or citation does not match the candidate.`,
        evidence_id: evidence.evidence_id,
      });
    } else {
      supported.add(`${pair.claimPrefix}_date`);
    }

    if (event.event_type === "lab_result") {
      const code = normalizeLab(event.typed.test_name_raw) ?? normalizeLab(event.typed.test_code_normalized);
      if (
        candidate.metadata.diagnostic_kind !== "lab" ||
        candidate.metadata.normalized_identity !== `lab:${code}` ||
        !includesAny(evidence.quoted_span, [event.typed.test_name_raw, event.typed.test_code_normalized, code])
      ) {
        failures.push({
          code: "EV-005",
          stage: "fields",
          message: `Diagnostic identity for ${pair.claimPrefix} occurrence is not supported by its source.`,
          evidence_id: evidence.evidence_id,
        });
      } else {
        supported.add(`${pair.claimPrefix}_identity`);
      }
    } else {
      const modality = normalizeImagingModality(event.typed.modality_raw) ?? event.typed.modality_normalized;
      const region = normalizeBodyRegion(event.typed.body_region_raw) ?? event.typed.body_region_normalized;
      if (
        candidate.metadata.diagnostic_kind !== "imaging" ||
        candidate.metadata.normalized_identity !== `imaging:${modality}:${region}` ||
        !includesAny(evidence.quoted_span, [event.typed.modality_raw, modality, event.typed.body_region_raw, region])
      ) {
        failures.push({
          code: "EV-005",
          stage: "fields",
          message: `Diagnostic identity for ${pair.claimPrefix} occurrence is not supported by its source.`,
          evidence_id: evidence.evidence_id,
        });
      } else {
        supported.add(`${pair.claimPrefix}_identity`);
      }
    }
  }

  const first = resolved[0];
  const second = resolved[1];
  if (first && second) {
    const interval = Math.abs(daysBetween(first.date, second.date));
    if (
      candidate.metadata.days_between !== interval ||
      interval === 0 ||
      interval > (candidate.window_days ?? 0)
    ) {
      failures.push({
        code: "EV-010",
        stage: "claims",
        message: "Diagnostic interval is zero, outside the frozen window, or inconsistent with the candidate.",
      });
    } else {
      supported.add("interval_within_window");
    }
    if (eventFingerprint(first) === eventFingerprint(second)) {
      failures.push({
        code: "EV-010",
        stage: "claims",
        message: "Two cited diagnostic records resolve to the same underlying occurrence.",
      });
    }
  }

  return { ok: failures.length === 0, failures, supported_claims: supported };
}

function verifyMonitoring(
  candidate: Extract<CandidateGap, { gap_type: "med_monitoring" }>,
  positive: PositiveSourceEvidence[],
  events: CanonicalClinicalEvent[],
): FieldVerification {
  const failures: EvidenceFailure[] = [];
  const supported = new Set<string>();
  const evidence = positiveFor(positive, candidate.metadata.medication_start_event_id);
  const event = eventFor(events, candidate.metadata.medication_start_event_id) as MedicationStartEvent | undefined;
  if (!evidence || !event || event.event_type !== "medication_start") {
    failures.push({
      code: "EV-010",
      stage: "fields",
      message: "Required medication-start evidence is missing.",
      event_id: candidate.metadata.medication_start_event_id,
    });
    return { ok: false, failures, supported_claims: supported };
  }
  const link = eventLinkFailure(evidence, event);
  if (link) failures.push(link);
  supported.add("medication_start");

  const drug = normalizeMedication(event.typed.drug_raw) ?? event.typed.drug_normalized;
  if (drug !== candidate.metadata.medication || !includesAny(evidence.quoted_span, [event.typed.drug_raw, drug])) {
    failures.push({
      code: "EV-005",
      stage: "fields",
      message: "Medication identity is not supported by the medication-start source.",
      evidence_id: evidence.evidence_id,
    });
  } else {
    supported.add("medication_identity");
  }

  if (event.date !== candidate.metadata.medication_start_date) {
    failures.push({
      code: "EV-005",
      stage: "fields",
      message: "Medication start date does not match the canonical event date.",
      evidence_id: evidence.evidence_id,
    });
  } else {
    supported.add("medication_start_date");
  }

  const expectedDue = addDays(event.date, candidate.metadata.monitoring_window_days);
  if (candidate.due_date !== expectedDue || candidate.metadata.due_date !== expectedDue) {
    failures.push({
      code: "EV-007",
      stage: "policy",
      message: "Monitoring due date does not match the frozen registry window.",
      evidence_id: evidence.evidence_id,
    });
  }

  return { ok: failures.length === 0, failures, supported_claims: supported };
}

export function verifyCriticalFields(
  candidate: CandidateGap,
  positive: PositiveSourceEvidence[],
  events: CanonicalClinicalEvent[],
): FieldVerification {
  if (candidate.gap_type === "missed_followup") return verifyFollowup(candidate, positive, events);
  if (candidate.gap_type === "duplicate_test") return verifyDuplicate(candidate, positive, events);
  return verifyMonitoring(candidate, positive, events);
}

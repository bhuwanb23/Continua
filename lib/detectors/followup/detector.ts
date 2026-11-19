import type {
  CandidateGap,
  CanonicalClinicalEvent,
  DetectionContext,
  GapDetector,
  MissedFollowupCandidate,
  ReferralEvent,
} from "@/lib/domain";
import { classifyTemporalState, dueDate, isIsoDate, overdueDays } from "../common/dates";
import { dedupeCandidateGaps } from "../common/dedupe";
import { evidenceRefFor } from "../common/evidence";
import { groupEventsByPatient, normalizedSpecialty, referralEvents } from "../common/events";
import { missedFollowupGapId } from "../common/ids";
import { consolidateFollowupCandidates } from "./consolidation";
import { qualifyingCompletions } from "./matching";
import { FOLLOWUP_POLICY, followupSeverity, referralWindowDays } from "./policy";

function candidateFor(referral: ReferralEvent, context: DetectionContext): MissedFollowupCandidate | null {
  const status = referral.typed.status;
  if (!(FOLLOWUP_POLICY.unresolved_statuses as readonly string[]).includes(status)) return null;

  const specialty = normalizedSpecialty(referral);
  if (!specialty) return null;

  const windowDays = referralWindowDays({
    specialty_normalized: specialty,
    expected_window_days: referral.typed.expected_window_days,
    window_source: referral.typed.window_source,
  });
  const due = dueDate(referral.date, windowDays);
  const asOf = context.evaluation_as_of_date;
  if (asOf <= due) return null;

  return {
    schema_version: "candidate-gap-v1",
    gap_id: missedFollowupGapId(referral.patient_id, referral.event_id, specialty),
    patient_id: referral.patient_id,
    gap_type: "missed_followup",
    detector_version: "gaps-v1",
    severity: followupSeverity(specialty),
    identity: { specialty, event_ids: [referral.event_id] },
    trigger_event_ids: [referral.event_id],
    evidence_refs: [evidenceRefFor(referral)],
    window_days: windowDays,
    due_date: due,
    temporal_state: classifyTemporalState(due, asOf),
    metadata: {
      kind: "missed_followup",
      specialty,
      referral_event_id: referral.event_id,
      referral_date: referral.date,
      expected_window_days: windowDays,
      due_date: due,
      evaluation_as_of_date: asOf,
      overdue_days: overdueDays(due, asOf),
      referral_status: status,
      supporting_referral_event_ids: [referral.event_id],
    },
    rationale: {
      rule: "referral_without_matching_completion",
      facts: {
        specialty,
        referral_date: referral.date,
        due_date: due,
        evaluation_as_of_date: asOf,
        qualifying_completion_count: 0,
      },
    },
    recommended_coordinator_action: "Verify referral status and coordinate follow-up.",
  };
}

export class FollowupDetector implements GapDetector {
  readonly name = "missed-followup";
  readonly version = FOLLOWUP_POLICY.detector;

  detect(events: CanonicalClinicalEvent[], context: DetectionContext): CandidateGap[] {
    if (!isIsoDate(context.evaluation_as_of_date)) {
      throw new Error(`Invalid evaluation_as_of_date: ${context.evaluation_as_of_date}`);
    }

    const candidates: MissedFollowupCandidate[] = [];
    for (const patientEvents of groupEventsByPatient(events).values()) {
      for (const referral of referralEvents(patientEvents)) {
        const specialty = normalizedSpecialty(referral);
        if (!specialty) continue;
        const windowDays = referralWindowDays({
          specialty_normalized: specialty,
          expected_window_days: referral.typed.expected_window_days,
          window_source: referral.typed.window_source,
        });
        const due = dueDate(referral.date, windowDays);
        if (qualifyingCompletions(referral, due, patientEvents).length > 0) continue;
        const candidate = candidateFor(referral, context);
        if (candidate) candidates.push(candidate);
      }
    }

    return dedupeCandidateGaps(consolidateFollowupCandidates(candidates));
  }
}

export const followupDetector = new FollowupDetector();

import type {
  CandidateGap,
  CanonicalClinicalEvent,
  CandidateGapIdentity,
  DetectionContext,
  DuplicateTestCandidate,
  GapDetector,
} from "@/lib/domain";
import { classifyTemporalState, daysBetween, dueDate, isIsoDate } from "../common/dates";
import { dedupeCandidateGaps } from "../common/dedupe";
import { evidenceRefFor } from "../common/evidence";
import { groupEventsByPatient } from "../common/events";
import { duplicateTestGapId } from "../common/ids";
import { isDuplicateEpisodeEligible } from "./exclusions";
import { groupDuplicateEpisodes } from "./grouping";
import { diagnosticOccurrencesForPatient } from "./identity";
import { DUPLICATE_POLICY, duplicateSeverity } from "./policy";

function identityFor(normalizedIdentity: string): CandidateGapIdentity {
  const parts = normalizedIdentity.split(":");
  if (parts[0] === "lab") return { test: parts[1] ?? normalizedIdentity };
  return { modality: parts[1] ?? "", body_region: parts[2] ?? "" };
}

function candidateFor(
  patientId: string,
  episode: ReturnType<typeof groupDuplicateEpisodes>[number],
  context: DetectionContext,
): DuplicateTestCandidate | null {
  if (!isDuplicateEpisodeEligible(episode)) return null;
  const first = episode.occurrences[0];
  const second = episode.occurrences[1];
  if (!first || !second) return null;

  const due = dueDate(first.date, DUPLICATE_POLICY.window_days);
  const asOf = context.evaluation_as_of_date;
  const eventIds = episode.occurrences.flatMap((occurrence) => occurrence.event_ids).sort();
  const dayGap = Math.abs(daysBetween(first.date, second.date));

  return {
    schema_version: "candidate-gap-v1",
    gap_id: duplicateTestGapId(patientId, episode.normalized_identity, first.event.event_id),
    patient_id: patientId,
    gap_type: "duplicate_test",
    detector_version: "gaps-v1",
    severity: duplicateSeverity(episode.diagnostic_kind, dayGap, episode.occurrences.length),
    identity: { ...identityFor(episode.normalized_identity), event_ids: eventIds },
    trigger_event_ids: eventIds,
    evidence_refs: episode.occurrences.map((occurrence) => evidenceRefFor(occurrence.event)),
    window_days: DUPLICATE_POLICY.window_days,
    due_date: due,
    temporal_state: classifyTemporalState(due, asOf),
    metadata: {
      kind: "duplicate_test",
      diagnostic_kind: episode.diagnostic_kind,
      normalized_identity: episode.normalized_identity,
      first_event_id: first.event.event_id,
      second_event_id: second.event.event_id,
      first_date: first.date,
      second_date: second.date,
      days_between: dayGap,
      occurrence_count: episode.occurrences.length,
      event_ids: eventIds,
    },
    rationale: {
      rule: "repeated_diagnostic_without_series_context",
      facts: {
        normalized_identity: episode.normalized_identity,
        first_date: first.date,
        second_date: second.date,
        days_between: dayGap,
        occurrence_count: episode.occurrences.length,
        window_days: DUPLICATE_POLICY.window_days,
      },
    },
    recommended_coordinator_action:
      "Review repeat test history and confirm whether the repeat was intended.",
  };
}

export class DuplicateDetector implements GapDetector {
  readonly name = "duplicate-testing";
  readonly version = DUPLICATE_POLICY.detector;

  detect(events: CanonicalClinicalEvent[], context: DetectionContext): CandidateGap[] {
    if (!isIsoDate(context.evaluation_as_of_date)) {
      throw new Error(`Invalid evaluation_as_of_date: ${context.evaluation_as_of_date}`);
    }

    const candidates: DuplicateTestCandidate[] = [];
    for (const [patientId, patientEvents] of groupEventsByPatient(events)) {
      const occurrences = diagnosticOccurrencesForPatient(patientEvents);
      const episodes = groupDuplicateEpisodes(occurrences);
      for (const episode of episodes) {
        const candidate = candidateFor(patientId, episode, context);
        if (candidate) candidates.push(candidate);
      }
    }
    return dedupeCandidateGaps(candidates);
  }
}

export const duplicateDetector = new DuplicateDetector();

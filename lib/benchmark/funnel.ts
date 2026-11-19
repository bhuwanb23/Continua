import type { CandidateGap, CanonicalClinicalEvent, VerifiedGap } from "@/lib/domain";
import type { TruthGap } from "@/lib/evaluation/types";
import { matchPredictions } from "@/lib/evaluation/matching";
import { safeRatio } from "@/lib/evaluation/metrics";
import type { PriorityLayerResult } from "./types";
import type { AttributionEntry, ErrorAttribution, FailureFunnel, FunnelStage } from "./types";
import { candidatePrediction, verifiedPrediction } from "./gaps";

function stage(stageName: string, count: number, denominator: number, note: string): FunnelStage {
  return { stage: stageName, count, denominator, rate: safeRatio(count, denominator), note };
}

export function buildFailureFunnel(input: {
  truthGaps: TruthGap[];
  events: CanonicalClinicalEvent[];
  candidates: CandidateGap[];
  verified: VerifiedGap[];
  priority: PriorityLayerResult;
}): FailureFunnel {
  const eventIds = new Set(input.events.map((event) => event.event_id));
  const support = input.truthGaps.filter((gap) => {
    const ids = gap.identity.event_ids ?? [];
    return eventIds.has(gap.trigger.event_id) || ids.some((id) => eventIds.has(id));
  });
  const candidateMatches = matchPredictions(input.truthGaps, input.candidates.map(candidatePrediction));
  const verifiedMatches = matchPredictions(input.truthGaps, input.verified.map(verifiedPrediction));
  const verifiedGapIds = new Set(input.verified.map((gap) => gap.gap_id));
  const rankedGapIds = new Set(input.priority.panel.gap_priorities.map((gap) => gap.gap_id));
  const verifiedTruthIds = new Set(verifiedMatches.matchedTruthIds);
  const ranked = input.truthGaps.filter((gap) => {
    const predictionId = [...verifiedMatches.assignments]
      .find((assignment) => assignment.truth_gap_id === gap.truth_gap_id)
      ?.prediction_id;
    return predictionId !== undefined && verifiedGapIds.has(predictionId) && rankedGapIds.has(predictionId);
  });
  const topKPatients = new Set(input.priority.queue.map((item) => item.patient_id));
  const topKTruth = input.priority.top5.filter((item) => item.truth_match).length;

  const lost: FailureFunnel["truth_gap_ids_lost"] = [];
  for (const gap of input.truthGaps) {
    if (!support.some((entry) => entry.truth_gap_id === gap.truth_gap_id)) {
      lost.push({ truth_gap_id: gap.truth_gap_id, stage: "EXTRACTION", patient_id: gap.patient_id, gap_type: gap.gap_type });
    } else if (!candidateMatches.matchedTruthIds.has(gap.truth_gap_id)) {
      lost.push({ truth_gap_id: gap.truth_gap_id, stage: "DETECTION", patient_id: gap.patient_id, gap_type: gap.gap_type });
    } else if (!verifiedTruthIds.has(gap.truth_gap_id)) {
      lost.push({ truth_gap_id: gap.truth_gap_id, stage: "EVIDENCE", patient_id: gap.patient_id, gap_type: gap.gap_type });
    } else if (!ranked.some((entry) => entry.truth_gap_id === gap.truth_gap_id)) {
      lost.push({ truth_gap_id: gap.truth_gap_id, stage: "PRIORITY", patient_id: gap.patient_id, gap_type: gap.gap_type });
    }
  }

  const stages: FunnelStage[] = [
    stage("truth_gaps", input.truthGaps.length, input.truthGaps.length, "Frozen benchmark truth gaps."),
    stage("support_events_extracted", support.length, input.truthGaps.length, "Trigger or identity support event exists in the event store."),
    stage("correct_candidates", candidateMatches.truePositives, input.truthGaps.length, "Candidate gap matches truth by frozen matching rules."),
    stage("verified_gaps", verifiedMatches.truePositives, input.truthGaps.length, "Candidate survives the evidence gate."),
    stage("ranked_gaps", ranked.length, input.truthGaps.length, "Verified gap is eligible and present in the priority panel."),
    stage("top_k_truth_patients", topKTruth, Math.min(input.priority.queue.length, 5), "Top-5 patients whose surfaced top gap matches truth."),
  ];

  return {
    truth_gaps: input.truthGaps.length,
    stages,
    truth_gap_ids_lost: lost,
    top_k_patients: topKPatients.size,
    interpretation:
      lost.length === 0
        ? "No truth gaps were lost in this fixture-replay run; this validates the funnel plumbing, not live extraction reliability."
        : `${lost.length} truth gaps were lost; the first failing stage is attributed in error-attribution.json.`,
  };
}

export function buildErrorAttribution(input: {
  truthGaps: TruthGap[];
  funnel: FailureFunnel;
  priority: PriorityLayerResult;
}): ErrorAttribution {
  const queuePatients = new Set(input.priority.queue.map((item) => item.patient_id));
  const entries: AttributionEntry[] = input.truthGaps.map((gap) => {
    const lost = input.funnel.truth_gap_ids_lost.find((entry) => entry.truth_gap_id === gap.truth_gap_id);
    const stage = (lost?.stage ?? "NONE") as AttributionEntry["stage"];
    return {
      truth_gap_id: gap.truth_gap_id,
      patient_id: gap.patient_id,
      gap_type: gap.gap_type,
      stage,
      queue_miss: !queuePatients.has(gap.patient_id),
      root_cause:
        lost === undefined
          ? "End-to-end path retained this truth gap."
          : `First failing stage: ${lost.stage}.`,
      fix_candidate:
        lost === undefined
          ? "None."
          : lost.stage === "EVIDENCE"
            ? "Inspect evidence/absence policy for this gap type."
            : lost.stage === "EXTRACTION"
              ? "Improve extraction or cached event coverage."
              : lost.stage === "DETECTION"
                ? "Inspect detector policy and identity normalization."
                : "Inspect priority eligibility.",
    };
  });

  const byStage: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const entry of entries.filter((item) => item.stage !== "NONE")) {
    byStage[entry.stage] = (byStage[entry.stage] ?? 0) + 1;
    byType[entry.gap_type] = (byType[entry.gap_type] ?? 0) + 1;
  }

  return {
    total_failures: entries.filter((entry) => entry.stage !== "NONE").length,
    by_stage: byStage,
    by_type: byType,
    entries,
    queue_misses: entries.filter((entry) => entry.queue_miss).length,
    biggest_error_first: Object.entries(byStage)
      .sort((left, right) => right[1] - left[1])
      .map(([category, frequency]) => ({
        category,
        frequency,
        impact: `${frequency} truth gap(s) first failed at ${category}.`,
      })),
  };
}

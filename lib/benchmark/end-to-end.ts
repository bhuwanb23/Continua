import type { CandidateGap, VerifiedGap } from "@/lib/domain";
import type { GapPrediction, NegativeCase, TruthGap } from "@/lib/evaluation/types";
import { computeDetectionMetrics, safeRatio } from "@/lib/evaluation/metrics";
import { matchPredictions } from "@/lib/evaluation/matching";
import { GAP_TYPES } from "@/lib/evaluation/config";
import { TARGETS } from "./config";
import type { BenchmarkConfig, EndToEndLayerResult, PatientLevelMetrics, PriorityLayerResult } from "./types";
import { candidatePrediction, verifiedPrediction } from "./gaps";

function patientMetrics(input: {
  patientIds: string[];
  truthGaps: TruthGap[];
  candidates: CandidateGap[];
  verified: VerifiedGap[];
}): PatientLevelMetrics {
  const truthPatients = new Set(input.truthGaps.map((gap) => gap.patient_id));
  const candidatePatients = new Set(input.candidates.map((candidate) => candidate.patient_id));
  const verifiedPatients = new Set(input.verified.map((gap) => gap.patient_id));
  const matchedTruth = matchPredictions(input.truthGaps, input.verified.map(verifiedPrediction));
  const matchedGapIds = new Set(matchedTruth.matchedPredictionIds);
  const verifiedTruePatients = new Set(
    input.verified.filter((gap) => matchedGapIds.has(gap.gap_id)).map((gap) => gap.patient_id),
  );
  const truePositivePatients = [...verifiedPatients].filter((patientId) => truthPatients.has(patientId)).length;
  const falseAlertPatients = [...verifiedPatients].filter((patientId) => !truthPatients.has(patientId)).length;
  const missedPositivePatients = [...truthPatients].filter((patientId) => !verifiedTruePatients.has(patientId)).length;

  return {
    patients: input.patientIds.length,
    truth_positive_patients: truthPatients.size,
    patients_with_candidate: candidatePatients.size,
    patients_with_verified: verifiedPatients.size,
    true_positive_patients: truePositivePatients,
    false_alert_patients: falseAlertPatients,
    missed_positive_patients: missedPositivePatients,
    patient_alert_precision: safeRatio(truePositivePatients, verifiedPatients.size),
    patient_alert_recall: safeRatio([...truthPatients].filter((id) => verifiedTruePatients.has(id)).length, truthPatients.size),
  };
}

function minDefined(values: Array<number | null>): number | null {
  const defined = values.filter((value): value is number => value !== null);
  return defined.length === 0 ? null : Math.min(...defined);
}

export function evaluateEndToEnd(input: {
  config: BenchmarkConfig;
  patientIds: string[];
  truthGaps: TruthGap[];
  negatives: NegativeCase[];
  candidates: CandidateGap[];
  verified: VerifiedGap[];
  hardNegativePassRate: number | null;
  trust: EndToEndLayerResult["trust"];
  priority: PriorityLayerResult;
}): EndToEndLayerResult {
  const predictions: GapPrediction[] = input.verified.map(verifiedPrediction);
  const metrics = computeDetectionMetrics(input.truthGaps, predictions);
  const perTypePrecisions = GAP_TYPES.map((type) => metrics.per_type[type].precision);
  const perTypeRecalls = GAP_TYPES.map((type) => metrics.per_type[type].recall);
  const perTypePrecisionMin = minDefined(perTypePrecisions);
  const perTypeRecallMin = minDefined(perTypeRecalls);
  const patientLevel = patientMetrics({
    patientIds: input.patientIds,
    truthGaps: input.truthGaps,
    candidates: input.candidates,
    verified: input.verified,
  });

  const targetResults = {
    macro_f1: metrics.macro_f1 !== null && metrics.macro_f1 >= TARGETS.e2e_macro_f1,
    per_type_precision: perTypePrecisionMin !== null && perTypePrecisionMin >= TARGETS.e2e_per_type_precision,
    per_type_recall: perTypeRecallMin !== null && perTypeRecallMin >= TARGETS.e2e_per_type_recall,
    hard_negative_pass_rate:
      input.hardNegativePassRate !== null && input.hardNegativePassRate >= TARGETS.hard_negative_pass_rate,
    top5_verified: input.priority.top5_verified >= TARGETS.top5_verified,
    top5_truth: input.priority.top5_truth_matches >= TARGETS.top5_truth,
  };

  return {
    status: "measured",
    source: input.config.extraction_source,
    live_model_measured: false,
    metrics,
    per_type: metrics.per_type,
    macro_f1: metrics.macro_f1,
    micro_f1: metrics.micro_f1,
    per_type_precision_min: perTypePrecisionMin,
    per_type_recall_min: perTypeRecallMin,
    hard_negative_pass_rate: input.hardNegativePassRate,
    patient_level: patientLevel,
    trust: input.trust,
    targets: {
      macro_f1: TARGETS.e2e_macro_f1,
      per_type_precision: TARGETS.e2e_per_type_precision,
      per_type_recall: TARGETS.e2e_per_type_recall,
      hard_negative_pass_rate: TARGETS.hard_negative_pass_rate,
      top5_verified: TARGETS.top5_verified,
      top5_truth: TARGETS.top5_truth,
    },
    target_results: targetResults,
    limitations: [
      "The end-to-end path starts from frozen fixture-extracted events, not live LLM extraction.",
      "Synthetic records and benchmark monitoring policies do not establish clinical validity.",
    ],
  };
}

export function candidateMetricsSummary(truthGaps: TruthGap[], candidates: CandidateGap[]) {
  return computeDetectionMetrics(truthGaps, candidates.map(candidatePrediction));
}

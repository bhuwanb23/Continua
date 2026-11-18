import { GAP_TYPES } from "./config";
import type { GapType } from "./config";
import { matchPredictions } from "./matching";
import type {
  ConfusionCounts,
  DetectionMetrics,
  GapPrediction,
  HardNegativeResult,
  MatchResult,
  NegativeCase,
  PerTypeMetrics,
  TruthGap,
} from "./types";

export function safeRatio(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator === 0) return null;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

export function f1From(precision: number | null, recall: number | null): number | null {
  if (precision === null && recall === null) return null;
  if (precision === null) return recall === 0 ? 0 : null;
  if (recall === null) return precision === 0 ? 0 : null;
  if (precision + recall === 0) return 0;
  const value = (2 * precision * recall) / (precision + recall);
  return Number.isFinite(value) ? value : null;
}

export function perTypeMetrics(counts: ConfusionCounts): PerTypeMetrics {
  const precision = safeRatio(counts.tp, counts.tp + counts.fp);
  const recall = safeRatio(counts.tp, counts.tp + counts.fn);
  return {
    ...counts,
    precision,
    recall,
    f1: f1From(precision, recall),
  };
}

export function emptyCounts(): ConfusionCounts {
  return { tp: 0, fp: 0, fn: 0 };
}

function countsForType(
  type: GapType,
  truthGaps: TruthGap[],
  predictions: GapPrediction[],
  matches: MatchResult,
): ConfusionCounts {
  const truthIds = new Set(truthGaps.filter((truth) => truth.gap_type === type).map((truth) => truth.truth_gap_id));
  const tp = matches.assignments.filter((assignment) => truthIds.has(assignment.truth_gap_id)).length;
  const fn = matches.falseNegativeTruthIds.filter((id) => truthIds.has(id)).length;
  const predictionIds = new Set(predictions.filter((prediction) => prediction.gap_type === type).map((prediction) => prediction.prediction_id));
  const fp = matches.falsePositivePredictionIds.filter((id) => predictionIds.has(id)).length;
  return { tp, fp, fn };
}

export function computeMacroF1(perType: Record<GapType, PerTypeMetrics>): number | null {
  // Equal weight across detector types that actually have a defined F1. A
  // type with no truth and no predictions contributes no evidence either way.
  const values = GAP_TYPES.map((type) => perType[type].f1).filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Number.isFinite(mean) ? mean : null;
}

export function computeMicroF1(perType: Record<GapType, PerTypeMetrics>): number | null {
  const tp = GAP_TYPES.reduce((sum, type) => sum + perType[type].tp, 0);
  const fp = GAP_TYPES.reduce((sum, type) => sum + perType[type].fp, 0);
  const fn = GAP_TYPES.reduce((sum, type) => sum + perType[type].fn, 0);
  return perTypeMetrics({ tp, fp, fn }).f1;
}

export function computeDetectionMetrics(
  truthGaps: TruthGap[],
  predictions: GapPrediction[],
  matches: MatchResult = matchPredictions(truthGaps, predictions),
): DetectionMetrics {
  const perType = {} as Record<GapType, PerTypeMetrics>;
  for (const type of GAP_TYPES) {
    perType[type] = perTypeMetrics(countsForType(type, truthGaps, predictions, matches));
  }
  return {
    per_type: perType,
    macro_f1: computeMacroF1(perType),
    micro_f1: computeMicroF1(perType),
    true_positives: matches.truePositives,
    false_positives: matches.falsePositives,
    false_negatives: matches.falseNegatives,
    ground_truth_gaps: truthGaps.length,
    reported_gaps: predictions.length,
  };
}

export function computeHardNegativePassRate(
  negatives: NegativeCase[],
  predictions: GapPrediction[],
): HardNegativeResult {
  const failures: HardNegativeResult["failures"] = [];
  let passed = 0;

  for (const negative of negatives) {
    const target = negative.detector_target ?? negative.detector ?? "all";
    const relevant = predictions.filter((prediction) => {
      if (prediction.patient_id !== negative.patient_id) return false;
      if (target === "all") return true;
      return prediction.gap_type === target;
    });
    if (relevant.length === 0) {
      passed += 1;
    } else {
      failures.push({
        negative_id: negative.negative_id,
        patient_id: negative.patient_id,
        detector_target: target,
        prediction_ids: relevant.map((prediction) => prediction.prediction_id),
      });
    }
  }

  return {
    total: negatives.length,
    passed,
    failed: failures.length,
    pass_rate: safeRatio(passed, negatives.length),
    failures,
  };
}

export function partitionTruthGaps(truthGaps: TruthGap[], patientIds: Set<string>): TruthGap[] {
  return truthGaps.filter((truth) => patientIds.has(truth.patient_id));
}

export function assertFiniteMetrics(value: unknown, path = "metrics"): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Non-finite metric at ${path}: ${value}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFiniteMetrics(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      assertFiniteMetrics(nested, `${path}.${key}`);
    }
  }
}

export function countByType(truthGaps: TruthGap[]): Record<GapType, number> {
  const counts = { missed_followup: 0, duplicate_test: 0, med_monitoring: 0 } as Record<GapType, number>;
  for (const gap of truthGaps) counts[gap.gap_type] += 1;
  return counts;
}

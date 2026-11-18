import { deterministicId } from "@/lib/ids";
import type { GapType } from "./config";
import type {
  EvaluationError,
  ExtractionMetrics,
  GapGroundingResult,
  GapPrediction,
  MatchResult,
  TruthGap,
} from "./types";

export const FAILURE_TAXONOMY = {
  "EX-01": { category: "extraction", description: "Event missed." },
  "EX-02": { category: "extraction", description: "Wrong event type." },
  "EX-03": { category: "extraction", description: "Wrong date." },
  "EX-04": { category: "extraction", description: "Normalization failure." },
  "EX-05": { category: "extraction", description: "Wrong source attribution." },
  "GAP-01": { category: "detection", description: "False-positive missed follow-up." },
  "GAP-02": { category: "detection", description: "False-negative missed follow-up." },
  "GAP-03": { category: "detection", description: "False-positive duplicate test." },
  "GAP-04": { category: "detection", description: "False-negative duplicate test." },
  "GAP-05": { category: "detection", description: "False-positive medication monitoring." },
  "GAP-06": { category: "detection", description: "False-negative medication monitoring." },
  "EV-01": { category: "grounding", description: "Missing citation." },
  "EV-02": { category: "grounding", description: "Incorrect source document." },
  "EV-03": { category: "grounding", description: "Unsupported span." },
  "TIME-01": { category: "temporal", description: "Window calculation error." },
  "TIME-02": { category: "temporal", description: "Evaluation clock error." },
  "PRIO-01": { category: "priority", description: "Formula application error." },
  "PRIO-02": { category: "priority", description: "Unexpected ordering." },
} as const;

export type FailureCode = keyof typeof FAILURE_TAXONOMY;

const FALSE_POSITIVE_CODES: Record<GapType, FailureCode> = {
  missed_followup: "GAP-01",
  duplicate_test: "GAP-03",
  med_monitoring: "GAP-05",
};

const FALSE_NEGATIVE_CODES: Record<GapType, FailureCode> = {
  missed_followup: "GAP-02",
  duplicate_test: "GAP-04",
  med_monitoring: "GAP-06",
};

export function isFailureCode(value: string): value is FailureCode {
  return Object.prototype.hasOwnProperty.call(FAILURE_TAXONOMY, value);
}

export function falsePositiveCode(type: GapType): FailureCode {
  return FALSE_POSITIVE_CODES[type];
}

export function falseNegativeCode(type: GapType): FailureCode {
  return FALSE_NEGATIVE_CODES[type];
}

function errorId(parts: string[]): string {
  return deterministicId("evaluation-error", ...parts);
}

export function classifyGapDetectionErrors(
  truthGaps: TruthGap[],
  predictions: GapPrediction[],
  matches: MatchResult,
  grounding: GapGroundingResult[] = [],
): EvaluationError[] {
  const truthById = new Map(truthGaps.map((truth) => [truth.truth_gap_id, truth]));
  const predictionById = new Map(predictions.map((prediction) => [prediction.prediction_id, prediction]));
  const errors: EvaluationError[] = [];

  for (const predictionId of matches.falsePositivePredictionIds) {
    const prediction = predictionById.get(predictionId);
    if (!prediction) continue;
    const duplicate = matches.duplicatePredictionIds.includes(predictionId);
    errors.push({
      error_id: errorId(["fp", predictionId]),
      patient_id: prediction.patient_id,
      category: falsePositiveCode(prediction.gap_type),
      predicted_gap_id: predictionId,
      truth_gap_id: null,
      scenario_id: null,
      summary: duplicate
        ? "Duplicate prediction for an already-matched planted gap."
        : `Predicted ${prediction.gap_type} has no matching planted gap.`,
    });
  }

  for (const truthId of matches.falseNegativeTruthIds) {
    const truth = truthById.get(truthId);
    if (!truth) continue;
    errors.push({
      error_id: errorId(["fn", truthId]),
      patient_id: truth.patient_id,
      category: falseNegativeCode(truth.gap_type),
      predicted_gap_id: null,
      truth_gap_id: truthId,
      scenario_id: truth.scenario_id,
      summary: `Planted ${truth.gap_type} was not detected.`,
    });
  }

  for (const result of grounding) {
    for (const failure of result.failures) {
      errors.push({
        error_id: errorId(["grounding", result.prediction_id, failure]),
        patient_id: result.patient_id,
        category: failure,
        predicted_gap_id: result.prediction_id,
        truth_gap_id: null,
        scenario_id: null,
        summary: FAILURE_TAXONOMY[failure].description,
      });
    }
  }

  return errors;
}

export function classifyExtractionErrors(
  metrics: ExtractionMetrics,
  goldEvents: Array<{ gold_event_id: string; patient_id: string }>,
  predictions: Array<{ event_id: string; patient_id: string }>,
): EvaluationError[] {
  const goldById = new Map(goldEvents.map((event) => [event.gold_event_id, event]));
  const predictionById = new Map(predictions.map((event) => [event.event_id, event]));
  const errors: EvaluationError[] = [];

  for (const goldId of metrics.false_negative_gold_ids) {
    const gold = goldById.get(goldId);
    if (!gold) continue;
    errors.push({
      error_id: errorId(["extraction-missed", goldId]),
      patient_id: gold.patient_id,
      category: "EX-01",
      predicted_gap_id: null,
      truth_gap_id: null,
      scenario_id: null,
      summary: "Gold event was not extracted.",
    });
  }

  for (const predictionId of metrics.false_positive_prediction_ids) {
    const prediction = predictionById.get(predictionId);
    if (!prediction) continue;
    errors.push({
      error_id: errorId(["extraction-extra", predictionId]),
      patient_id: prediction.patient_id,
      category: "EX-02",
      predicted_gap_id: null,
      truth_gap_id: null,
      scenario_id: null,
      summary: "Extracted event has no gold counterpart.",
    });
  }

  for (const match of metrics.matches) {
    if (!match.date_matched) {
      errors.push({
        error_id: errorId(["extraction-date", match.prediction_event_id]),
        patient_id: predictionById.get(match.prediction_event_id)?.patient_id ?? "unknown",
        category: "EX-03",
        predicted_gap_id: null,
        truth_gap_id: null,
        scenario_id: null,
        summary: "Extracted event date does not match gold.",
      });
    }
    if (match.normalized_matched === false) {
      errors.push({
        error_id: errorId(["extraction-normalization", match.prediction_event_id]),
        patient_id: predictionById.get(match.prediction_event_id)?.patient_id ?? "unknown",
        category: "EX-04",
        predicted_gap_id: null,
        truth_gap_id: null,
        scenario_id: null,
        summary: "Extracted event normalization does not match gold.",
      });
    }
    if (!match.source_document_matched) {
      errors.push({
        error_id: errorId(["extraction-source", match.prediction_event_id]),
        patient_id: predictionById.get(match.prediction_event_id)?.patient_id ?? "unknown",
        category: "EX-05",
        predicted_gap_id: null,
        truth_gap_id: null,
        scenario_id: null,
        summary: "Extracted event cites the wrong source document.",
      });
    }
  }

  return errors;
}

export function summarizeErrors(errors: EvaluationError[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const error of errors) summary[error.category] = (summary[error.category] ?? 0) + 1;
  return summary;
}

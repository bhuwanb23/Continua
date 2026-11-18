import { DEFAULT_MAX_DATE_DELTA_DAYS } from "./config";
import { spanSupportScore } from "./grounding";
import { dateCompatible, daysBetween } from "./temporal";
import type {
  ExtractionGoldEvent,
  ExtractionMatch,
  ExtractionMetrics,
  ExtractionPrediction,
  SourceRecordLike,
} from "./types";

export interface ExtractionMatchOptions {
  maxDateDeltaDays?: number;
  fuzzySpanThreshold?: number;
  records?: SourceRecordLike[];
}

const NORMALIZED_KEYS = [
  "specialty",
  "status",
  "expected_window_days",
  "test",
  "drug",
  "modality",
  "body_region",
  "procedure",
  "site",
  "series_status",
] as const;

function normalizedRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function comparable(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized.length > 0 ? normalized : null;
}

function goldNormalized(event: ExtractionGoldEvent): Record<string, unknown> {
  const record = normalizedRecord(event.normalized);
  if (Object.keys(record).length > 0) return record;
  return { normalized_entity: event.normalized_entity };
}

function predictionNormalized(event: ExtractionPrediction): Record<string, unknown> {
  const record = normalizedRecord(event.normalized);
  const output: Record<string, unknown> = { ...record };
  if (event.normalized_entity !== undefined) output["normalized_entity"] = event.normalized_entity;
  return output;
}

/** Compares only truth-declared normalized fields. */
export function normalizedFieldsMatch(gold: ExtractionGoldEvent, prediction: ExtractionPrediction): boolean | null {
  const goldFields = goldNormalized(gold);
  const predictionFields = predictionNormalized(prediction);
  let scored = 0;

  const entity = comparable(goldFields["normalized_entity"]);
  if (entity) {
    scored += 1;
    const predictionEntity =
      comparable(predictionFields["normalized_entity"]) ??
      comparable(predictionFields["test"]) ??
      comparable(predictionFields["drug"]) ??
      comparable(predictionFields["specialty"]) ??
      comparable(predictionFields["modality"]);
    if (predictionEntity !== entity) return false;
  }

  for (const key of NORMALIZED_KEYS) {
    const truthValue = comparable(goldFields[key]);
    if (!truthValue) continue;
    scored += 1;
    if (comparable(predictionFields[key]) !== truthValue) return false;
  }

  return scored === 0 ? null : true;
}

function provisionalSpanScore(
  prediction: ExtractionPrediction,
  gold: ExtractionGoldEvent,
  records: SourceRecordLike[] | undefined,
  threshold: number,
): boolean {
  if (!prediction.source_span || prediction.source_span.trim().length === 0) return false;
  const record = records?.find((candidate) => candidate.source_doc_id === prediction.source_doc_id);
  if (record) return spanSupportScore(prediction.source_span, record.text) >= threshold;
  return spanSupportScore(prediction.source_span, gold.source_span) >= threshold;
}

export function matchExtractionEvents(
  goldEvents: ExtractionGoldEvent[],
  predictions: ExtractionPrediction[],
  options: ExtractionMatchOptions = {},
): ExtractionMetrics {
  const maxDateDeltaDays = options.maxDateDeltaDays ?? DEFAULT_MAX_DATE_DELTA_DAYS;
  const fuzzySpanThreshold = options.fuzzySpanThreshold ?? 0.85;

  interface Candidate {
    gold: ExtractionGoldEvent;
    prediction: ExtractionPrediction;
    dateMatched: boolean;
    normalizedMatched: boolean | null;
    sourceDocumentMatched: boolean;
    spanSupported: boolean;
    score: number;
  }

  const candidates: Candidate[] = [];
  for (const gold of goldEvents) {
    for (const prediction of predictions) {
      if (prediction.patient_id !== gold.patient_id) continue;
      if (prediction.event_type !== gold.event_type) continue;

      const compatible = dateCompatible(
        gold.date,
        prediction.date,
        gold.date_precision ?? "day",
        prediction.date_precision ?? "day",
      );
      const delta = Math.abs(daysBetween(gold.date, prediction.date));
      if (!compatible && delta > maxDateDeltaDays) continue;

      const normalizedMatched = normalizedFieldsMatch(gold, prediction);
      const sourceDocumentMatched = prediction.source_doc_id === gold.source_doc_id;
      const spanSupported = provisionalSpanScore(prediction, gold, options.records, fuzzySpanThreshold);
      const score =
        (compatible ? 20 : 10 - delta) +
        (normalizedMatched === true ? 10 : normalizedMatched === null ? 2 : 0) +
        (sourceDocumentMatched ? 8 : 0) +
        (spanSupported ? 4 : 0);

      candidates.push({
        gold,
        prediction,
        dateMatched: compatible,
        normalizedMatched,
        sourceDocumentMatched,
        spanSupported,
        score,
      });
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const goldOrder = a.gold.gold_event_id.localeCompare(b.gold.gold_event_id);
    if (goldOrder !== 0) return goldOrder;
    return a.prediction.event_id.localeCompare(b.prediction.event_id);
  });

  const usedGold = new Set<string>();
  const usedPredictions = new Set<string>();
  const matches: ExtractionMatch[] = [];

  for (const candidate of candidates) {
    if (usedGold.has(candidate.gold.gold_event_id)) continue;
    if (usedPredictions.has(candidate.prediction.event_id)) continue;
    usedGold.add(candidate.gold.gold_event_id);
    usedPredictions.add(candidate.prediction.event_id);
    matches.push({
      gold_event_id: candidate.gold.gold_event_id,
      prediction_event_id: candidate.prediction.event_id,
      score: candidate.score,
      date_matched: candidate.dateMatched,
      normalized_matched: candidate.normalizedMatched,
      source_document_matched: candidate.sourceDocumentMatched,
      span_supported: candidate.spanSupported,
    });
  }

  const truePositives = matches.length;
  const precision = predictions.length === 0 ? null : truePositives / predictions.length;
  const recall = goldEvents.length === 0 ? null : truePositives / goldEvents.length;
  const f1 =
    precision === null || recall === null
      ? null
      : precision + recall === 0
        ? 0
        : (2 * precision * recall) / (precision + recall);

  const normalizationScored = matches.filter((match) => match.normalized_matched !== null);
  const normalizationCorrect = normalizationScored.filter((match) => match.normalized_matched === true).length;

  return {
    gold_events: goldEvents.length,
    predicted_events: predictions.length,
    matched_events: truePositives,
    event_precision: precision,
    event_recall: recall,
    event_f1: f1,
    date_accuracy: truePositives === 0 ? null : matches.filter((match) => match.date_matched).length / truePositives,
    normalization_accuracy:
      normalizationScored.length === 0 ? null : normalizationCorrect / normalizationScored.length,
    source_attribution_accuracy:
      truePositives === 0 ? null : matches.filter((match) => match.source_document_matched).length / truePositives,
    span_support_rate: truePositives === 0 ? null : matches.filter((match) => match.span_supported).length / truePositives,
    matches,
    false_positive_prediction_ids: predictions
      .filter((prediction) => !usedPredictions.has(prediction.event_id))
      .map((prediction) => prediction.event_id),
    false_negative_gold_ids: goldEvents
      .filter((gold) => !usedGold.has(gold.gold_event_id))
      .map((gold) => gold.gold_event_id),
  };
}

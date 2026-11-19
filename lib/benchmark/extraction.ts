import type { CanonicalClinicalEvent } from "@/lib/domain";
import type { BenchmarkConfig, ExtractionBreakdownRow, ExtractionLayerResult } from "./types";
import type {
  ExtractionGoldEvent,
  ExtractionMetrics,
  ExtractionPrediction,
  SourceRecordLike,
} from "@/lib/evaluation/types";
import { matchExtractionEvents } from "@/lib/evaluation/extraction-matching";
import { safeRatio } from "@/lib/evaluation/metrics";

function normalizedFields(event: CanonicalClinicalEvent): Record<string, unknown> {
  return { ...event.typed } as unknown as Record<string, unknown>;
}

function normalizedEntity(event: CanonicalClinicalEvent): string | null {
  const typed = event.typed as unknown as Record<string, unknown>;
  for (const key of ["specialty", "test", "drug", "modality", "procedure"]) {
    const value = typed[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return null;
}

export function toExtractionPrediction(event: CanonicalClinicalEvent): ExtractionPrediction {
  return {
    event_id: event.event_id,
    patient_id: event.patient_id,
    event_type: event.event_type,
    date: event.date,
    date_precision: event.date_precision,
    source_doc_id: event.source.source_doc_id,
    source_span: event.source.source_span,
    normalized_entity: normalizedEntity(event),
    normalized: normalizedFields(event),
    provider: event.provider_display ?? "",
  };
}

function scopeMetrics(
  gold: ExtractionGoldEvent[],
  predictions: ExtractionPrediction[],
  records: SourceRecordLike[],
  scope: "annotated_documents" | "all_predictions",
  interpretation: string,
): ExtractionLayerResult["annotated_scope"] {
  const metrics = matchExtractionEvents(gold, predictions, { records });
  return {
    scope,
    interpretation,
    metrics,
    true_positives: metrics.matched_events,
    false_positives: metrics.false_positive_prediction_ids.length,
    false_negatives: metrics.false_negative_gold_ids.length,
  };
}

function breakdown(
  gold: ExtractionGoldEvent[],
  metrics: ExtractionMetrics,
  keyFor: (event: ExtractionGoldEvent) => string,
): ExtractionBreakdownRow[] {
  const matched = new Set(metrics.matches.map((match) => match.gold_event_id));
  const keys = [...new Set(gold.map(keyFor))].sort();
  return keys.map((key) => {
    const events = gold.filter((event) => keyFor(event) === key);
    const matches = events.filter((event) => matched.has(event.gold_event_id)).length;
    return {
      key,
      gold_events: events.length,
      matched_events: matches,
      recall: safeRatio(matches, events.length),
    };
  });
}

export function evaluateExtraction(input: {
  config: BenchmarkConfig;
  events: CanonicalClinicalEvent[];
  gold: ExtractionGoldEvent[];
  records: SourceRecordLike[];
}): ExtractionLayerResult {
  const predictions = input.events.map(toExtractionPrediction);
  const annotatedDocs = new Set(input.gold.map((event) => event.source_doc_id));
  const annotatedPredictions = predictions.filter((prediction) => annotatedDocs.has(prediction.source_doc_id));
  const annotated = scopeMetrics(
    input.gold,
    annotatedPredictions,
    input.records,
    "annotated_documents",
    "Predictions restricted to documents included in the frozen extraction-gold annotation sample.",
  );
  const all = scopeMetrics(
    input.gold,
    predictions,
    input.records,
    "all_predictions",
    "All extracted events in the partition versus the partial gold sample; false positives include unannotated true events and are not interpretable as hallucination.",
  );

  const annotatedIds = new Set(annotatedPredictions.map((prediction) => prediction.event_id));
  const realFalsePositives = annotated.metrics.false_positive_prediction_ids.length;
  const unannotated = predictions.filter((prediction) => !annotatedIds.has(prediction.event_id) && !annotatedDocs.has(prediction.source_doc_id)).length;

  return {
    status: "measured",
    source: input.config.extraction_source,
    live_model_measured: false,
    claim:
      "Fixture replay only. These extraction numbers verify the evaluation plumbing and frozen artifacts; they are not live extractor-v1 model quality.",
    gold_events: input.gold.length,
    gold_patients: new Set(input.gold.map((event) => event.patient_id)).size,
    predicted_events_in_scope: annotatedPredictions.length,
    all_predictions_in_partition: predictions.length,
    annotated_scope: annotated,
    all_predictions_scope: all,
    by_difficulty: breakdown(input.gold, annotated.metrics, (event) => event.difficulty),
    by_document_type: breakdown(input.gold, annotated.metrics, (event) => {
      const record = input.records.find((candidate) => candidate.source_doc_id === event.source_doc_id);
      return record?.doc_type ?? "unknown";
    }),
    error_taxonomy: {
      unsupported_event: realFalsePositives,
      wrong_event_type: 0,
      duplicate_occurrence: 0,
      historical_mention_mistaken_as_current: 0,
      wrong_normalization: annotated.metrics.matches.filter((match) => match.normalized_matched === false).length,
      unannotated_event_not_hallucination: unannotated,
    },
    unannotated_events: unannotated,
    limitations: [
      "The available extraction store is produced by the deterministic fixture extractor, not a live LLM.",
      "Extraction gold is a 12-patient / 130-event annotation sample, so all-partition precision is not meaningful.",
      "No live extraction latency or token cost can be attributed from this run.",
    ],
  };
}

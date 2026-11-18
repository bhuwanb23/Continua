import type { CanonicalClinicalEvent } from "@/lib/domain";
import type { ExtractionPrediction, NormalizedEventFields } from "@/lib/evaluation/types";

function normalizedEntityOf(event: CanonicalClinicalEvent): string | null {
  switch (event.event_type) {
    case "referral":
    case "consult":
      return event.typed.specialty_normalized;
    case "followup":
      return null;
    case "lab_result":
      return event.typed.test_code_normalized;
    case "imaging":
      return `${event.typed.modality_normalized}:${event.typed.body_region_normalized ?? ""}`;
    case "medication_start":
    case "medication_stop":
      return event.typed.drug_normalized;
    case "surgery":
      return event.typed.procedure_normalized ?? null;
  }
}

function normalizedFieldsOf(event: CanonicalClinicalEvent): NormalizedEventFields {
  switch (event.event_type) {
    case "referral":
      return {
        specialty: event.typed.specialty_normalized,
        status: event.typed.status,
        expected_window_days: event.typed.expected_window_days,
      };
    case "consult":
      return {
        specialty: event.typed.specialty_normalized,
        status: event.typed.completion_status,
      };
    case "followup":
      return {
        ...(event.typed.specialty_normalized !== undefined
          ? { specialty: event.typed.specialty_normalized }
          : {}),
        status: event.typed.status,
      };
    case "lab_result":
      return {
        test: event.typed.test_code_normalized,
        series_status: event.typed.series_status,
      };
    case "imaging":
      return {
        modality: event.typed.modality_normalized,
        ...(event.typed.body_region_normalized !== undefined
          ? { body_region: event.typed.body_region_normalized }
          : {}),
        series_status: event.typed.series_status,
      };
    case "medication_start":
    case "medication_stop":
      return { drug: event.typed.drug_normalized };
    case "surgery":
      return {
        ...(event.typed.procedure_normalized !== undefined
          ? { procedure: event.typed.procedure_normalized }
          : {}),
        ...(event.typed.site !== undefined ? { site: event.typed.site } : {}),
      };
  }
}

/**
 * Projects a canonical event into the frozen Phase 3 matcher shape. Only the
 * matcher's declared keys carry semantics; verification and mention fields
 * ride along for Phase 5 reporting.
 */
export function canonicalToExtractionPrediction(event: CanonicalClinicalEvent): ExtractionPrediction {
  return {
    event_id: event.event_id,
    patient_id: event.patient_id,
    event_type: event.event_type,
    date: event.date,
    date_precision: event.date_precision,
    source_doc_id: event.source.source_doc_id,
    source_span: event.source.source_span,
    normalized_entity: normalizedEntityOf(event),
    normalized: normalizedFieldsOf(event),
    ...(event.provider_display !== undefined ? { provider: event.provider_display } : {}),
    verification_method: event.source.verification_method,
    verification_score: event.source.verification_score,
    mention_context: event.mention_context ?? "unknown",
  };
}

export function flattenCanonicalEvents(events: CanonicalClinicalEvent[]): ExtractionPrediction[] {
  return events.map(canonicalToExtractionPrediction);
}
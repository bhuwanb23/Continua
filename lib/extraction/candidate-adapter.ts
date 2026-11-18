import type { EventSource, SourceRecord } from "@/lib/domain";
import { CLINICAL_EVENT_SCHEMA_VERSION } from "@/lib/domain/versions";
import { NORMALIZATION_VERSION, normalizeSpecialty } from "@/lib/normalization";
import { referralWindowFor } from "@/lib/policies/referral-windows";
import type { CandidateClinicalEvent } from "@/lib/schemas/candidate-event.schema";

export interface CandidateAdaptationContext {
  patient_id: string;
  record: SourceRecord;
  /** Server-verified provenance; never model-reported. */
  source: EventSource;
}

function typedPayload(candidate: CandidateClinicalEvent): Record<string, unknown> {
  switch (candidate.event_type) {
    case "referral": {
      const windowFromDocument = candidate.expected_window_days !== undefined;
      return {
        specialty_raw: candidate.specialty_raw,
        specialty_normalized: candidate.specialty_raw,
        reason: candidate.reason,
        expected_window_days: windowFromDocument
          ? candidate.expected_window_days
          : referralWindowFor(normalizeSpecialty(candidate.specialty_raw) ?? ""),
        window_source: windowFromDocument ? "document" : "benchmark_policy",
        status: candidate.status,
      };
    }
    case "consult":
      return {
        specialty_raw: candidate.specialty_raw,
        specialty_normalized: candidate.specialty_raw,
        clinician: candidate.clinician,
        mode: candidate.mode,
        completion_status: candidate.completion_status,
      };
    case "followup":
      return {
        topic: candidate.topic,
        specialty_normalized: candidate.specialty_raw,
        mode: candidate.mode,
        status: candidate.status,
      };
    case "lab_result":
      return {
        test_name_raw: candidate.test_name_raw,
        test_code_normalized: candidate.test_name_raw,
        value: candidate.value,
        unit: candidate.unit,
        abnormal: candidate.abnormal,
        series_status: candidate.series_status,
      };
    case "imaging":
      return {
        modality_raw: candidate.modality_raw,
        modality_normalized: "other",
        body_region_raw: candidate.body_region_raw,
        result_summary: candidate.result_summary,
        series_status: candidate.series_status,
      };
    case "medication_start":
      return {
        drug_raw: candidate.drug_raw,
        drug_normalized: candidate.drug_raw,
        dose: candidate.dose,
        route: candidate.route,
        reason: candidate.reason,
      };
    case "medication_stop":
      return {
        drug_raw: candidate.drug_raw,
        drug_normalized: candidate.drug_raw,
        stop_reason: candidate.stop_reason,
      };
    case "surgery":
      return {
        procedure_raw: candidate.procedure_raw,
        site: candidate.site,
        outcome_summary: candidate.outcome_summary,
      };
  }
}

/**
 * Candidate → ClinicalEvent v1.1 envelope. Normalized codes are placeholders
 * here; the deterministic normalization layer inside canonicalization owns
 * them. Identity is left empty so identifyClinicalEvent assigns it.
 */
export function adaptCandidateEvent(
  candidate: CandidateClinicalEvent,
  context: CandidateAdaptationContext,
): Record<string, unknown> {
  return {
    schema_version: CLINICAL_EVENT_SCHEMA_VERSION,
    event_id: "",
    patient_id: context.patient_id,
    event_type: candidate.event_type,
    date: candidate.date,
    date_precision: candidate.date_precision ?? "day",
    provider_display: candidate.provider_display ?? context.record.provider,
    provider_type: candidate.provider_type ?? context.record.provider_type,
    description: candidate.description,
    source: context.source,
    extraction_confidence: candidate.confidence,
    normalization_version: NORMALIZATION_VERSION,
    mention_context: candidate.mention_context,
    typed: typedPayload(candidate),
  };
}
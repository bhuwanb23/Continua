import type { CanonicalClinicalEvent, LegacyClinicalEvent } from "@/lib/domain";
import { NORMALIZATION_VERSION } from "@/lib/normalization";
import type { EventPayload } from "@/lib/domain/event-types";

function record(event: LegacyClinicalEvent): Record<string, unknown> {
  return event.typed ?? {};
}

function stringValue(values: unknown[], fallback = "unknown"): string {
  const value = values.find((item) => typeof item === "string" && item.trim().length > 0);
  return typeof value === "string" ? value : fallback;
}

export function legacyEventToCanonical(event: LegacyClinicalEvent): CanonicalClinicalEvent {
  const typed = record(event);
  const base = {
    schema_version: "clinical-event-v1" as const,
    event_id: event.event_id,
    patient_id: event.patient_id,
    event_type: event.event_type,
    date: event.date,
    date_precision: event.date_precision ?? "day",
    provider_id: event.provider_id,
    provider_display: event.provider,
    provider_type: event.provider_type,
    description: event.description.slice(0, 200),
    source: {
      source_doc_id: event.source_doc_id,
      source_span: event.source_span,
      verification_method: "exact" as const,
      verification_score: 1,
    },
    extraction_confidence: event.confidence,
    normalization_version: NORMALIZATION_VERSION,
  };

  let payload: EventPayload;
  switch (event.event_type) {
    case "referral":
      payload = {
        specialty_raw: stringValue([typed["specialty"], event.specialty]),
        specialty_normalized: stringValue([typed["specialty_normalized"], typed["specialty"], event.specialty]),
        reason: typeof typed["reason"] === "string" ? typed["reason"] : undefined,
        expected_window_days:
          typeof typed["expected_window_days"] === "number"
            ? typed["expected_window_days"]
            : typeof event.window_days === "number"
              ? event.window_days
              : 30,
        window_source: typeof typed["expected_window_days"] === "number" ? "document" : "benchmark_policy",
        status: stringValue([typed["status"]], "unknown") as "placed" | "completed" | "cancelled" | "unknown",
      } as EventPayload;
      break;
    case "consult":
      payload = {
        specialty_raw: stringValue([typed["specialty"], event.specialty]),
        specialty_normalized: stringValue([typed["specialty_normalized"], typed["specialty"], event.specialty]),
        clinician: typeof typed["clinician"] === "string" ? typed["clinician"] : undefined,
        mode: stringValue([typed["mode"]], "unknown") as "in_person" | "telehealth" | "phone" | "unknown",
        completion_status:
          typed["completed"] === true
            ? "completed"
            : (stringValue([typed["completion_status"]], "unknown") as "completed" | "cancelled" | "unknown"),
      } as EventPayload;
      break;
    case "followup":
      payload = {
        topic: typeof typed["topic"] === "string" ? typed["topic"] : undefined,
        specialty_normalized: typeof typed["specialty"] === "string" ? typed["specialty"] : undefined,
        mode: stringValue([typed["mode"]], "unknown") as "in_person" | "telehealth" | "phone" | "message" | "unknown",
        status: stringValue([typed["status"]], "unknown") as
          | "scheduled"
          | "completed"
          | "missed"
          | "cancelled"
          | "unknown",
      } as EventPayload;
      break;
    case "lab_result":
      payload = {
        test_name_raw: stringValue([typed["test_name_raw"], typed["test_name_normalized"]]),
        test_code_normalized: stringValue([typed["test_code_normalized"], typed["test_name_normalized"]]),
        value: typed["value"] as number | string | null | undefined,
        unit: typed["unit"] as string | null | undefined,
        abnormal: typed["abnormal"] as boolean | null | undefined,
        series_status: event.series_status,
      } as EventPayload;
      break;
    case "imaging":
      payload = {
        modality_raw: stringValue([typed["modality"]]),
        modality_normalized: stringValue([typed["modality_normalized"], typed["modality"], "other"]) as
          | "ct"
          | "mri"
          | "xray"
          | "pet"
          | "mammogram"
          | "ultrasound"
          | "other",
        body_region_raw: stringValue([typed["body_region"]]),
        body_region_normalized: typeof typed["body_region_normalized"] === "string" ? typed["body_region_normalized"] : undefined,
        result_summary: typeof typed["result_summary"] === "string" ? typed["result_summary"] : undefined,
        series_status: event.series_status,
      } as EventPayload;
      break;
    case "medication_start":
      payload = {
        drug_raw: stringValue([typed["drug_raw"], typed["drug_normalized"]]),
        drug_normalized: stringValue([typed["drug_normalized"], typed["drug_raw"]]),
        dose: typed["dose"] as string | null | undefined,
        route: typed["route"] as string | null | undefined,
        reason: typed["reason"] as string | null | undefined,
      } as EventPayload;
      break;
    case "medication_stop":
      payload = {
        drug_raw: stringValue([typed["drug_raw"], typed["drug_normalized"]]),
        drug_normalized: stringValue([typed["drug_normalized"], typed["drug_raw"]]),
        stop_reason: typed["stop_reason"] as string | null | undefined,
      } as EventPayload;
      break;
    case "surgery":
      payload = {
        procedure_raw: stringValue([typed["procedure"]]),
        procedure_normalized: typeof typed["procedure_normalized"] === "string" ? typed["procedure_normalized"] : undefined,
        site: typeof typed["site"] === "string" ? typed["site"] : undefined,
        outcome_summary:
          typeof typed["outcome"] === "string"
            ? typed["outcome"]
            : typeof typed["outcome_summary"] === "string"
              ? typed["outcome_summary"]
              : undefined,
      } as EventPayload;
      break;
  }

  return { ...base, typed: payload } as CanonicalClinicalEvent;
}

export function canonicalEventToLegacy(event: CanonicalClinicalEvent): LegacyClinicalEvent {
  const typed = event.typed as unknown as Record<string, string | number | boolean | null>;
  return {
    event_id: event.event_id,
    patient_id: event.patient_id,
    event_type: event.event_type,
    date: event.date,
    description: event.description,
    provider: event.provider_display ?? "Unknown provider",
    provider_type: event.provider_type,
    source_doc_id: event.source.source_doc_id,
    source_span: event.source.source_span,
    confidence: event.extraction_confidence,
    series_status: "series_status" in typed && typeof typed["series_status"] === "string"
      ? (typed["series_status"] as LegacyClinicalEvent["series_status"])
      : "unknown",
    typed,
  };
}

import type { CanonicalClinicalEvent, EventPayload } from "@/lib/domain";
import {
  NORMALIZATION_VERSION,
  normalizeBodyRegion,
  normalizeImagingModality,
  normalizeLab,
  normalizeMedication,
  normalizeSpecialty,
} from "@/lib/normalization";

function asRecord(payload: EventPayload): Record<string, unknown> {
  return payload as unknown as Record<string, unknown>;
}

export function normalizeClinicalEvent(event: CanonicalClinicalEvent): CanonicalClinicalEvent {
  const payload = asRecord(event.typed);
  let normalized: Record<string, unknown> = { ...payload };

  if ("specialty_raw" in payload) {
    normalized = {
      ...normalized,
      specialty_normalized: normalizeSpecialty(String(payload["specialty_raw"])) ?? "unknown",
    };
  }
  if ("test_name_raw" in payload) {
    normalized = {
      ...normalized,
      test_code_normalized: normalizeLab(String(payload["test_name_raw"])) ?? "unknown",
    };
  }
  if ("drug_raw" in payload) {
    normalized = {
      ...normalized,
      drug_normalized: normalizeMedication(String(payload["drug_raw"])) ?? "unknown",
    };
  }
  if ("modality_raw" in payload) {
    normalized = {
      ...normalized,
      modality_normalized: normalizeImagingModality(String(payload["modality_raw"])) ?? "other",
      body_region_normalized:
        normalizeBodyRegion(String(payload["body_region_raw"])) ?? String(payload["body_region_raw"]).trim().toLowerCase(),
    };
  }
  if (event.event_type === "surgery") {
    normalized = {
      ...normalized,
      procedure_normalized: String(payload["procedure_raw"]).trim().toLowerCase(),
    };
  }

  return {
    ...event,
    normalization_version: NORMALIZATION_VERSION,
    typed: normalized as unknown as CanonicalClinicalEvent["typed"],
  } as unknown as CanonicalClinicalEvent;
}

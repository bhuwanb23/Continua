import type { CanonicalClinicalEvent, EventPayload } from "@/lib/domain";
import { CLINICAL_EVENT_SCHEMA_VERSION } from "@/lib/domain/versions";
import {
  normalizeBodyRegion,
  normalizeImagingModality,
  normalizeLab,
  normalizeMedication,
  normalizeSpecialty,
} from "@/lib/normalization";

export class NormalizationFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NormalizationFailure";
  }
}

function asRecord(payload: EventPayload | unknown): Record<string, unknown> {
  return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
}

export function normalizeClinicalEvent(event: CanonicalClinicalEvent): CanonicalClinicalEvent {
  const payload = asRecord(event.typed);
  let normalized: Record<string, unknown> = { ...payload };

  if ("specialty_raw" in payload) {
    const specialty = normalizeSpecialty(String(payload["specialty_raw"]));
    if (!specialty) throw new NormalizationFailure("Specialty alias is not mapped.");
    normalized = {
      ...normalized,
      specialty_normalized: specialty,
    };
  }
  if (event.event_type === "followup" && typeof payload["specialty_normalized"] === "string") {
    const specialty = normalizeSpecialty(payload["specialty_normalized"]);
    if (!specialty) throw new NormalizationFailure("Follow-up specialty alias is not mapped.");
    normalized = { ...normalized, specialty_normalized: specialty };
  }
  if ("test_name_raw" in payload) {
    const testCode = normalizeLab(String(payload["test_name_raw"]));
    if (!testCode) throw new NormalizationFailure("Laboratory alias is not mapped.");
    normalized = {
      ...normalized,
      test_code_normalized: testCode,
    };
  }
  if ("drug_raw" in payload) {
    const medication = normalizeMedication(String(payload["drug_raw"]));
    if (!medication) throw new NormalizationFailure("Medication alias is not mapped.");
    normalized = {
      ...normalized,
      drug_normalized: medication,
    };
  }
  if ("modality_raw" in payload) {
    const modality = normalizeImagingModality(String(payload["modality_raw"]));
    if (!modality) throw new NormalizationFailure("Imaging modality alias is not mapped.");
    normalized = {
      ...normalized,
      modality_normalized: modality,
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
    schema_version: CLINICAL_EVENT_SCHEMA_VERSION,
    mention_context: event.mention_context ?? "unknown",
    typed: normalized as unknown as CanonicalClinicalEvent["typed"],
  } as unknown as CanonicalClinicalEvent;
}

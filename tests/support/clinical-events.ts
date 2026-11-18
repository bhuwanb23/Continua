import type { CanonicalClinicalEvent } from "@/lib/domain";

export function canonicalEvent(overrides: Partial<CanonicalClinicalEvent> = {}): CanonicalClinicalEvent {
  return {
    schema_version: "clinical-event-v1",
    event_id: "event-1",
    patient_id: "patient-1",
    event_type: "referral",
    date: "2026-04-18",
    date_precision: "day",
    provider_display: "Dr. Test",
    provider_type: "specialist",
    description: "Oncology referral placed",
    source: {
      source_doc_id: "doc-1",
      source_span: "Referral to Medical Oncology.",
      verification_method: "exact",
      verification_score: 1,
    },
    extraction_confidence: 0.95,
    normalization_version: "normalization-v1",
    typed: {
      specialty_raw: "Medical Oncology",
      specialty_normalized: "oncology",
      expected_window_days: 45,
      window_source: "document",
      status: "placed",
    },
    ...overrides,
  } as CanonicalClinicalEvent;
}

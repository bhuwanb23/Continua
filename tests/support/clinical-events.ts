import type { CanonicalClinicalEvent } from "@/lib/domain";

export const TEST_PATIENT_ID = "00000000-0000-5000-8000-000000000001";
export const TEST_SOURCE_DOC_ID = "00000000-0000-5000-8000-000000000002";
export const TEST_EVENT_ID = "00000000-0000-5000-8000-000000000003";

export function canonicalEvent(overrides: Partial<CanonicalClinicalEvent> = {}): CanonicalClinicalEvent {
  return {
    schema_version: "clinical-event-v1.1",
    event_id: TEST_EVENT_ID,
    patient_id: TEST_PATIENT_ID,
    event_type: "referral",
    date: "2026-04-18",
    date_precision: "day",
    provider_display: "Dr. Test",
    provider_type: "specialist",
    description: "Oncology referral placed",
    source: {
      source_doc_id: TEST_SOURCE_DOC_ID,
      source_span: "Referral to Medical Oncology.",
      verification_method: "exact",
      verification_score: 1,
    },
    extraction_confidence: 0.95,
    normalization_version: "normalization-v1",
    mention_context: "unknown",
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

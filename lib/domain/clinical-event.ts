export const EVENT_TYPES = [
  "surgery",
  "imaging",
  "consult",
  "lab_result",
  "medication_start",
  "medication_stop",
  "referral",
  "followup",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const SERIES_STATUSES = [
  "explicit_series",
  "explicit_one_off",
  "unknown",
] as const;

export type SeriesStatus = (typeof SERIES_STATUSES)[number];

export const PROVIDER_TYPES = [
  "pcp",
  "specialist",
  "lab",
  "imaging",
  "pharmacy",
  "other",
] as const;

export type ProviderType = (typeof PROVIDER_TYPES)[number];

export interface ClinicalEvent {
  event_id: string;
  patient_id: string;
  event_type: EventType;
  date: string;
  description: string;
  provider: string;
  provider_type: ProviderType;
  source_doc_id: string;
  source_span: string;
  /** Per-event extraction confidence, 0–1. */
  confidence: number;
  series_status: SeriesStatus;
  typed?: Record<string, string | number | boolean> | undefined;
}

export interface ExtractionResult {
  events: ClinicalEvent[];
  /** Top-level extraction confidence, 0–1. */
  extraction_confidence: number;
  extractor_version: string;
}

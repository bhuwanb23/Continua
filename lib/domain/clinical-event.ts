import type { EventSource } from "./event-source";
import type {
  ConsultPayload,
  DatePrecision,
  EventPayload,
  EventType,
  FollowupPayload,
  ImagingPayload,
  LabResultPayload,
  MedicationStartPayload,
  MedicationStopPayload,
  ProviderType,
  ReferralPayload,
  SeriesStatus,
  SurgeryPayload,
} from "./event-types";

export {
  DATE_PRECISIONS,
  EVENT_TYPES,
  PROVIDER_TYPES,
  SERIES_STATUSES,
  type DatePrecision,
  type EventType,
  type ProviderType,
  type SeriesStatus,
} from "./event-types";

export interface LegacyClinicalEvent {
  event_id: string;
  patient_id: string;
  event_type: EventType;
  date: string;
  description: string;
  provider: string;
  provider_type: ProviderType;
  provider_id?: string;
  specialty?: string | null;
  window_days?: number | null;
  scenario_id?: string;
  source_doc_id: string;
  source_span: string;
  /** Per-event extraction confidence, 0–1. */
  confidence: number;
  series_status: SeriesStatus;
  date_precision?: DatePrecision;
  typed?: Record<string, string | number | boolean | null> | undefined;
}

export interface ClinicalEventV1Base {
  schema_version: "clinical-event-v1";
  event_id: string;
  patient_id: string;
  event_type: EventType;
  date: string;
  date_precision: DatePrecision;
  provider_id?: string;
  provider_display?: string;
  provider_type: ProviderType;
  description: string;
  source: EventSource;
  extraction_confidence: number;
  normalization_version: string;
  typed: EventPayload;
}

export type ReferralEvent = ClinicalEventV1Base & { event_type: "referral"; typed: ReferralPayload };
export type ConsultEvent = ClinicalEventV1Base & { event_type: "consult"; typed: ConsultPayload };
export type FollowupEvent = ClinicalEventV1Base & { event_type: "followup"; typed: FollowupPayload };
export type LabResultEvent = ClinicalEventV1Base & { event_type: "lab_result"; typed: LabResultPayload };
export type ImagingEvent = ClinicalEventV1Base & { event_type: "imaging"; typed: ImagingPayload };
export type MedicationStartEvent = ClinicalEventV1Base & {
  event_type: "medication_start";
  typed: MedicationStartPayload;
};
export type MedicationStopEvent = ClinicalEventV1Base & {
  event_type: "medication_stop";
  typed: MedicationStopPayload;
};
export type SurgeryEvent = ClinicalEventV1Base & { event_type: "surgery"; typed: SurgeryPayload };

export type CanonicalClinicalEvent =
  | ReferralEvent
  | ConsultEvent
  | FollowupEvent
  | LabResultEvent
  | ImagingEvent
  | MedicationStartEvent
  | MedicationStopEvent
  | SurgeryEvent;

/** Transitional union accepted by the Phase 1 fixture extractor. */
export type ClinicalEvent = LegacyClinicalEvent | CanonicalClinicalEvent;

export interface ExtractionResult {
  events: ClinicalEvent[];
  /** Top-level extraction confidence, 0–1. */
  extraction_confidence: number;
  extractor_version: string;
}

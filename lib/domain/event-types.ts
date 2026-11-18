export const EVENT_TYPES = [
  "referral",
  "consult",
  "followup",
  "lab_result",
  "imaging",
  "medication_start",
  "medication_stop",
  "surgery",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const SERIES_STATUSES = ["explicit_series", "explicit_one_off", "unknown"] as const;
export type SeriesStatus = (typeof SERIES_STATUSES)[number];

export const MENTION_CONTEXTS = ["contemporaneous", "historical_reference", "unknown"] as const;
export type MentionContext = (typeof MENTION_CONTEXTS)[number];

export const PROVIDER_TYPES = ["pcp", "specialist", "lab", "imaging", "pharmacy", "other", "unknown"] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const DATE_PRECISIONS = ["day", "month"] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

export type ReferralStatus = "placed" | "completed" | "cancelled" | "unknown";
export type WindowSource = "document" | "benchmark_policy";
export type ConsultMode = "in_person" | "telehealth" | "phone" | "unknown";
export type CompletionStatus = "completed" | "cancelled" | "unknown";
export type FollowupMode = "in_person" | "telehealth" | "phone" | "message" | "unknown";
export type FollowupStatus = "scheduled" | "completed" | "missed" | "cancelled" | "unknown";
export type ImagingModality = "ct" | "mri" | "xray" | "pet" | "mammogram" | "ultrasound" | "other";

export interface ReferralPayload {
  specialty_raw: string;
  specialty_normalized: string;
  reason?: string;
  expected_window_days: number;
  window_source: WindowSource;
  status: ReferralStatus;
}

export interface ConsultPayload {
  specialty_raw: string;
  specialty_normalized: string;
  clinician?: string;
  mode: ConsultMode;
  completion_status: CompletionStatus;
}

export interface FollowupPayload {
  topic?: string;
  specialty_normalized?: string;
  mode: FollowupMode;
  status: FollowupStatus;
}

export interface LabResultPayload {
  test_name_raw: string;
  test_code_normalized: string;
  value?: number | string | null;
  unit?: string | null;
  abnormal?: boolean | null;
  series_status: SeriesStatus;
}

export interface ImagingPayload {
  modality_raw: string;
  modality_normalized: ImagingModality;
  body_region_raw: string;
  body_region_normalized?: string;
  result_summary?: string;
  series_status: SeriesStatus;
}

export interface MedicationStartPayload {
  drug_raw: string;
  drug_normalized: string;
  dose?: string | null;
  route?: string | null;
  reason?: string | null;
}

export interface MedicationStopPayload {
  drug_raw: string;
  drug_normalized: string;
  stop_reason?: string | null;
}

export interface SurgeryPayload {
  procedure_raw: string;
  procedure_normalized?: string;
  site?: string;
  outcome_summary?: string;
}

export type EventPayload =
  | ReferralPayload
  | ConsultPayload
  | FollowupPayload
  | LabResultPayload
  | ImagingPayload
  | MedicationStartPayload
  | MedicationStopPayload
  | SurgeryPayload;

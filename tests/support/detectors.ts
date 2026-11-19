import type {
  CanonicalClinicalEvent,
  ConsultEvent,
  FollowupEvent,
  ImagingEvent,
  LabResultEvent,
  MedicationStartEvent,
  MedicationStopEvent,
  ReferralEvent,
} from "@/lib/domain";
import { CLINICAL_EVENT_SCHEMA_VERSION, NORMALIZATION_VERSION } from "@/lib/domain/versions";
import { deterministicId } from "@/lib/ids";

export const TEST_PATIENT = "11111111-1111-5111-8111-111111111111";
export const TEST_PATIENT_2 = "22222222-2222-5222-8222-222222222222";

export function testId(label: string): string {
  return deterministicId("detector-test", label);
}

interface BaseOptions {
  id: string;
  patient_id?: string;
  date: string;
  doc?: string;
  span?: string;
  series_status?: "explicit_series" | "explicit_one_off" | "unknown";
}

function base(options: BaseOptions) {
  return {
    schema_version: CLINICAL_EVENT_SCHEMA_VERSION,
    event_id: testId(options.id),
    patient_id: options.patient_id ?? TEST_PATIENT,
    date: options.date,
    date_precision: "day" as const,
    provider_type: "other" as const,
    description: options.id,
    source: {
      source_doc_id: testId(options.doc ?? `${options.id}-doc`),
      source_span: options.span ?? `${options.id} span`,
      verification_method: "exact" as const,
      verification_score: 1,
    },
    extraction_confidence: 1,
    normalization_version: NORMALIZATION_VERSION,
    mention_context: "contemporaneous" as const,
  };
}

export function referral(options: BaseOptions & {
  specialty?: string;
  status?: "placed" | "completed" | "cancelled" | "unknown";
  window?: number;
  window_source?: "document" | "benchmark_policy";
}): ReferralEvent {
  const specialty = options.specialty ?? "oncology";
  return {
    ...base(options),
    event_type: "referral",
    typed: {
      specialty_raw: specialty,
      specialty_normalized: specialty,
      expected_window_days: options.window ?? 45,
      window_source: options.window_source ?? "document",
      status: options.status ?? "placed",
    },
  } as ReferralEvent;
}

export function consult(options: BaseOptions & {
  specialty?: string;
  completion?: "completed" | "cancelled" | "unknown";
  mode?: "in_person" | "telehealth" | "phone" | "unknown";
}): ConsultEvent {
  const specialty = options.specialty ?? "oncology";
  return {
    ...base(options),
    event_type: "consult",
    typed: {
      specialty_raw: specialty,
      specialty_normalized: specialty,
      mode: options.mode ?? "in_person",
      completion_status: options.completion ?? "completed",
    },
  } as ConsultEvent;
}

export function followup(options: BaseOptions & {
  specialty?: string;
  status?: "scheduled" | "completed" | "missed" | "cancelled" | "unknown";
  mode?: "in_person" | "telehealth" | "phone" | "message" | "unknown";
}): FollowupEvent {
  return {
    ...base(options),
    event_type: "followup",
    typed: {
      ...(options.specialty ? { specialty_normalized: options.specialty } : {}),
      mode: options.mode ?? "phone",
      status: options.status ?? "completed",
    },
  } as FollowupEvent;
}

export function lab(options: BaseOptions & {
  test?: string;
  value?: string | number;
}): LabResultEvent {
  const test = options.test ?? "cbc";
  return {
    ...base(options),
    event_type: "lab_result",
    typed: {
      test_name_raw: test,
      test_code_normalized: test,
      value: options.value ?? options.id,
      unit: null,
      abnormal: null,
      series_status: options.series_status ?? "unknown",
    },
  } as LabResultEvent;
}

export function imaging(options: BaseOptions & {
  modality?: "ct" | "mri" | "xray" | "pet" | "mammogram" | "ultrasound" | "other";
  body_region?: string;
}): ImagingEvent {
  const modality = options.modality ?? "mri";
  const region = options.body_region ?? "knee";
  return {
    ...base(options),
    event_type: "imaging",
    typed: {
      modality_raw: modality,
      modality_normalized: modality,
      body_region_raw: region,
      body_region_normalized: region,
      series_status: options.series_status ?? "unknown",
    },
  } as ImagingEvent;
}

export function medicationStart(options: BaseOptions & { drug?: string }): MedicationStartEvent {
  const drug = options.drug ?? "metformin";
  return {
    ...base(options),
    event_type: "medication_start",
    typed: { drug_raw: drug, drug_normalized: drug, dose: null, route: null, reason: null },
  } as MedicationStartEvent;
}

export function medicationStop(options: BaseOptions & { drug?: string }): MedicationStopEvent {
  const drug = options.drug ?? "metformin";
  return {
    ...base(options),
    event_type: "medication_stop",
    typed: { drug_raw: drug, drug_normalized: drug, stop_reason: null },
  } as MedicationStopEvent;
}

export function allEvents(...events: CanonicalClinicalEvent[]): CanonicalClinicalEvent[] {
  return events;
}

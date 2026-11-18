import { z } from "zod";
import { EventTypeSchema, ProviderTypeSchema, isoDate } from "./index";

const nonEmptyString = z.string().min(1);
const datePrecisionSchema = z.enum(["day", "month"]);
const mentionContextSchema = z.enum(["contemporaneous", "historical_reference", "unknown"]);
const seriesStatusSchema = z.enum(["explicit_series", "explicit_one_off", "unknown"]);

const candidateBase = {
  date: isoDate,
  date_precision: datePrecisionSchema.optional(),
  description: nonEmptyString.max(200),
  provider_display: nonEmptyString.optional(),
  provider_type: ProviderTypeSchema.optional(),
  source_doc_id: z.string().uuid(),
  source_span: nonEmptyString.max(300),
  confidence: z.number().min(0).max(1).default(0.5),
  mention_context: mentionContextSchema.default("unknown"),
};

export const CandidateReferralSchema = z
  .object({
    ...candidateBase,
    event_type: z.literal("referral"),
    specialty_raw: nonEmptyString,
    reason: z.string().max(500).optional(),
    expected_window_days: z.number().int().positive().optional(),
    status: z.enum(["placed", "completed", "cancelled", "unknown"]).default("unknown"),
  })
  .strict();

export const CandidateConsultSchema = z
  .object({
    ...candidateBase,
    event_type: z.literal("consult"),
    specialty_raw: nonEmptyString,
    clinician: nonEmptyString.optional(),
    mode: z.enum(["in_person", "telehealth", "phone", "unknown"]).default("unknown"),
    completion_status: z.enum(["completed", "cancelled", "unknown"]).default("unknown"),
  })
  .strict();

export const CandidateFollowupSchema = z
  .object({
    ...candidateBase,
    event_type: z.literal("followup"),
    topic: nonEmptyString.optional(),
    specialty_raw: nonEmptyString.optional(),
    mode: z.enum(["in_person", "telehealth", "phone", "message", "unknown"]).default("unknown"),
    status: z.enum(["scheduled", "completed", "missed", "cancelled", "unknown"]).default("unknown"),
  })
  .strict();

export const CandidateLabResultSchema = z
  .object({
    ...candidateBase,
    event_type: z.literal("lab_result"),
    test_name_raw: nonEmptyString,
    value: z.union([z.number(), z.string(), z.null()]).optional(),
    unit: z.string().min(1).nullable().optional(),
    abnormal: z.boolean().nullable().optional(),
    series_status: seriesStatusSchema.default("unknown"),
  })
  .strict();

export const CandidateImagingSchema = z
  .object({
    ...candidateBase,
    event_type: z.literal("imaging"),
    modality_raw: nonEmptyString,
    body_region_raw: nonEmptyString,
    result_summary: z.string().max(1000).optional(),
    series_status: seriesStatusSchema.default("unknown"),
  })
  .strict();

export const CandidateMedicationStartSchema = z
  .object({
    ...candidateBase,
    event_type: z.literal("medication_start"),
    drug_raw: nonEmptyString,
    dose: z.string().min(1).nullable().optional(),
    route: z.string().min(1).nullable().optional(),
    reason: z.string().min(1).nullable().optional(),
  })
  .strict();

export const CandidateMedicationStopSchema = z
  .object({
    ...candidateBase,
    event_type: z.literal("medication_stop"),
    drug_raw: nonEmptyString,
    stop_reason: z.string().min(1).nullable().optional(),
  })
  .strict();

export const CandidateSurgerySchema = z
  .object({
    ...candidateBase,
    event_type: z.literal("surgery"),
    procedure_raw: nonEmptyString,
    site: nonEmptyString.optional(),
    outcome_summary: z.string().max(1000).optional(),
  })
  .strict();

export const CandidateClinicalEventSchema = z.discriminatedUnion("event_type", [
  CandidateReferralSchema,
  CandidateConsultSchema,
  CandidateFollowupSchema,
  CandidateLabResultSchema,
  CandidateImagingSchema,
  CandidateMedicationStartSchema,
  CandidateMedicationStopSchema,
  CandidateSurgerySchema,
]);

export const ExtractionMetadataSchema = z
  .object({
    model: nonEmptyString,
    prompt_version: nonEmptyString,
    request_id: nonEmptyString,
  })
  .strict();

export const CandidateExtractionResponseSchema = z
  .object({
    patient_id: z.string().uuid(),
    events: z.array(CandidateClinicalEventSchema),
    extraction_metadata: ExtractionMetadataSchema,
  })
  .strict();

export type CandidateClinicalEvent = z.infer<typeof CandidateClinicalEventSchema>;
export type CandidateExtractionResponse = z.infer<typeof CandidateExtractionResponseSchema>;

export const CANDIDATE_EVENT_TYPES = EventTypeSchema.options;

/** Allowed top-level keys per candidate event type, derived from the strict schemas. */
export const CANDIDATE_KEYS_BY_TYPE: Record<string, readonly string[]> = Object.fromEntries(
  CandidateClinicalEventSchema.options.map((option) => [
    option.shape.event_type.value,
    Object.keys(option.shape),
  ]),
);

export const CANDIDATE_RESPONSE_KEYS = Object.keys(CandidateExtractionResponseSchema.shape);
export const CANDIDATE_METADATA_KEYS = Object.keys(ExtractionMetadataSchema.shape);
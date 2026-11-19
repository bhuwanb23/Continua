import { z } from "zod";

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day ?? 0));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === (month ?? 0) - 1 &&
      parsed.getUTCDate() === day
    );
  }, "Expected a real calendar date");

const isoDateTime = z.string().datetime();

export const VersionMetadataSchema = z.object({
  spec_version: z.string().min(1),
  dataset_version: z.string().min(1),
  eval_version: z.string().min(1),
  extractor_version: z.string().min(1),
  detector_version: z.string().min(1),
  priority_version: z.string().min(1),
  api_version: z.string().min(1),
  clinical_event_schema: z.enum(["clinical-event-v1", "clinical-event-v1.1"]),
  normalization_version: z.literal("normalization-v1"),
});

export const GapTypeSchema = z.enum([
  "missed_followup",
  "duplicate_test",
  "med_monitoring",
]);

export const PriorityBandSchema = z.enum(["P1", "P2", "P3", "P4", "NONE"]);

export const EventTypeSchema = z.enum([
  "referral",
  "consult",
  "followup",
  "lab_result",
  "imaging",
  "medication_start",
  "medication_stop",
  "surgery",
]);

export const SeriesStatusSchema = z.enum([
  "explicit_series",
  "explicit_one_off",
  "unknown",
]);

export const ProviderTypeSchema = z.enum([
  "pcp",
  "specialist",
  "lab",
  "imaging",
  "pharmacy",
  "other",
  "unknown",
]);

export const ClaimClassSchema = z.enum([
  "MEASURED",
  "MODELED",
  "SCENARIO_ASSUMPTION",
  "EXTERNAL_RESEARCH",
]);

export const PatientSchema = z.object({
  patient_id: z.string().uuid(),
  fixture_key: z.string().min(1),
  name: z.string().min(1),
  age: z.number().int().min(0).max(120),
  sex: z.enum(["F", "M", "X"]),
  primary_diagnosis: z.string().min(1),
  last_contact_date: isoDate,
});

export const SourceRecordSchema = z.object({
  source_doc_id: z.string().uuid(),
  fixture_key: z.string().min(1),
  patient_id: z.string().uuid(),
  doc_type: z.enum([
    "referral",
    "consult_note",
    "lab_report",
    "imaging_report",
    "medication_list",
    "discharge_summary",
    "followup",
    "other",
  ]),
  provider: z.string().min(1),
  provider_type: ProviderTypeSchema,
  date: isoDate,
  text: z.string().min(1),
  dataset_version: z.string().min(1),
  generator_version: z.string().min(1),
  synthetic: z.literal(true),
});

export const LegacyClinicalEventSchema = z.object({
  event_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  event_type: EventTypeSchema,
  date: isoDate,
  description: z.string().min(1),
  provider: z.string().min(1),
  provider_type: ProviderTypeSchema,
  source_doc_id: z.string().uuid(),
  source_span: z.string().min(1).max(300),
  confidence: z.number().min(0).max(1),
  series_status: SeriesStatusSchema,
  typed: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});

const datePrecisionSchema = z.enum(["day", "month"]);
const seriesStatusSchema = z.enum(["explicit_series", "explicit_one_off", "unknown"]);
const verificationMethodSchema = z.enum(["exact", "fuzzy"]);
const specialtyCodeSchema = z.enum([
  "oncology",
  "cardiology",
  "endocrinology",
  "primary_care",
  "surgery",
  "imaging",
  "laboratory",
  "pharmacy",
]);
const nonEmptyString = z.string().min(1);
const optionalNullableString = z.string().min(1).nullable().optional();

const eventSourceSchema = z
  .object({
    source_doc_id: z.string().uuid(),
    source_span: nonEmptyString.max(300),
    span_start: z.number().int().nonnegative().optional(),
    span_end: z.number().int().nonnegative().optional(),
    verification_method: verificationMethodSchema,
    verification_score: z.number().min(0.85).max(1),
  })
  .strict()
  .superRefine((source, ctx) => {
    if ((source.span_start === undefined) !== (source.span_end === undefined)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "span_start and span_end must be supplied together" });
    }
    if (source.span_start !== undefined && source.span_end !== undefined && source.span_end < source.span_start) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "span_end must be >= span_start", path: ["span_end"] });
    }
    if (source.verification_method === "exact" && source.verification_score !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "exact provenance must have score 1", path: ["verification_score"] });
    }
  });

export const ReferralPayloadSchema = z
  .object({
    specialty_raw: nonEmptyString,
    specialty_normalized: nonEmptyString,
    reason: z.string().max(500).optional(),
    expected_window_days: z.number().int().nonnegative(),
    window_source: z.enum(["document", "benchmark_policy"]),
    status: z.enum(["placed", "completed", "cancelled", "unknown"]),
  })
  .strict();

export const ConsultPayloadSchema = z
  .object({
    specialty_raw: nonEmptyString,
    specialty_normalized: nonEmptyString,
    clinician: nonEmptyString.optional(),
    mode: z.enum(["in_person", "telehealth", "phone", "unknown"]),
    completion_status: z.enum(["completed", "cancelled", "unknown"]),
  })
  .strict();

export const FollowupPayloadSchema = z
  .object({
    topic: nonEmptyString.optional(),
    specialty_normalized: specialtyCodeSchema.optional(),
    mode: z.enum(["in_person", "telehealth", "phone", "message", "unknown"]),
    status: z.enum(["scheduled", "completed", "missed", "cancelled", "unknown"]),
  })
  .strict();

export const LabResultPayloadSchema = z
  .object({
    test_name_raw: nonEmptyString,
    test_code_normalized: nonEmptyString,
    value: z.union([z.number(), z.string(), z.null()]).optional(),
    unit: optionalNullableString,
    abnormal: z.boolean().nullable().optional(),
    series_status: seriesStatusSchema,
  })
  .strict();

export const ImagingPayloadSchema = z
  .object({
    modality_raw: nonEmptyString,
    modality_normalized: z.enum(["ct", "mri", "xray", "pet", "mammogram", "ultrasound", "other"]),
    body_region_raw: nonEmptyString,
    body_region_normalized: nonEmptyString.optional(),
    result_summary: z.string().max(1000).optional(),
    series_status: seriesStatusSchema,
  })
  .strict();

export const MedicationStartPayloadSchema = z
  .object({
    drug_raw: nonEmptyString,
    drug_normalized: nonEmptyString,
    dose: optionalNullableString,
    route: optionalNullableString,
    reason: optionalNullableString,
  })
  .strict();

export const MedicationStopPayloadSchema = z
  .object({
    drug_raw: nonEmptyString,
    drug_normalized: nonEmptyString,
    stop_reason: optionalNullableString,
  })
  .strict();

export const SurgeryPayloadSchema = z
  .object({
    procedure_raw: nonEmptyString,
    procedure_normalized: nonEmptyString.optional(),
    site: nonEmptyString.optional(),
    outcome_summary: z.string().max(1000).optional(),
  })
  .strict();

const canonicalEventBase = {
  schema_version: z.enum(["clinical-event-v1", "clinical-event-v1.1"]),
  event_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  date: isoDate,
  date_precision: datePrecisionSchema,
  provider_id: z.string().uuid().optional(),
  provider_display: nonEmptyString.optional(),
  provider_type: ProviderTypeSchema,
  description: nonEmptyString.max(200),
  source: eventSourceSchema,
  extraction_confidence: z.number().finite().min(0).max(1),
  normalization_version: z.literal("normalization-v1"),
  mention_context: z.enum(["contemporaneous", "historical_reference", "unknown"]).optional(),
};

export const ClinicalEventSchema = z.discriminatedUnion("event_type", [
  z.object({ ...canonicalEventBase, event_type: z.literal("referral"), typed: ReferralPayloadSchema }).strict(),
  z.object({ ...canonicalEventBase, event_type: z.literal("consult"), typed: ConsultPayloadSchema }).strict(),
  z.object({ ...canonicalEventBase, event_type: z.literal("followup"), typed: FollowupPayloadSchema }).strict(),
  z.object({ ...canonicalEventBase, event_type: z.literal("lab_result"), typed: LabResultPayloadSchema }).strict(),
  z.object({ ...canonicalEventBase, event_type: z.literal("imaging"), typed: ImagingPayloadSchema }).strict(),
  z
    .object({ ...canonicalEventBase, event_type: z.literal("medication_start"), typed: MedicationStartPayloadSchema })
    .strict(),
  z
    .object({ ...canonicalEventBase, event_type: z.literal("medication_stop"), typed: MedicationStopPayloadSchema })
    .strict(),
  z.object({ ...canonicalEventBase, event_type: z.literal("surgery"), typed: SurgeryPayloadSchema }).strict(),
]);

export const ClinicalEventV1Schema = ClinicalEventSchema;

export const GapEvidenceRefSchema = z.object({
  doc_id: z.string().uuid(),
  quoted_span: z.string().min(1).max(300),
  event_id: z.string().uuid(),
});

export const GapSchema = z.object({
  gap_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  gap_type: GapTypeSchema,
  severity: z.enum(["high", "med", "low"]),
  title: z.string().min(1),
  trigger_event_ids: z.array(z.string().uuid()),
  window_days: z.number().int().nonnegative(),
  overdue_days: z.number().int().nonnegative(),
  due_date: isoDate.optional(),
  evidence: z.array(GapEvidenceRefSchema),
  recommended_coordinator_action: z.string().min(1),
  estimated_impact: z.string().min(1),
  priority_band: PriorityBandSchema,
  gap_priority_score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  detector_version: z.string().min(1),
  grounded: z.boolean(),
});

export const EvidenceSchema = z.object({
  doc_id: z.string().uuid(),
  provider: z.string().min(1),
  provider_type: ProviderTypeSchema,
  date: isoDate,
  quoted_span: z.string().min(1).max(300),
  span_verified: z.boolean(),
  verification_score: z.union([z.literal(1), z.literal(0.6)]),
  source_text_excerpt: z.string().optional(),
  event_id: z.string().uuid(),
});

export const PerTypeMetricsSchema = z.object({
  precision: z.number().min(0).max(1).nullable(),
  recall: z.number().min(0).max(1).nullable(),
  f1: z.number().min(0).max(1).nullable(),
  tp: z.number().int().nonnegative(),
  fp: z.number().int().nonnegative(),
  fn: z.number().int().nonnegative(),
});

export const EvalResultSchema = z.object({
  run_at: isoDateTime.nullable(),
  panel_id: z.string().min(1),
  ground_truth_gaps: z.number().int().nonnegative(),
  reported_gaps: z.number().int().nonnegative(),
  per_type: z.object({
    missed_followup: PerTypeMetricsSchema,
    duplicate_test: PerTypeMetricsSchema,
    med_monitoring: PerTypeMetricsSchema,
  }),
  macro_f1: z.number().min(0).max(1).nullable(),
  micro_f1: z.number().min(0).max(1).nullable(),
  grounding_accuracy: z.number().min(0).max(1).nullable(),
  unsupported_claim_rate: z.number().min(0).max(1).nullable(),
  extraction_accuracy: z.number().min(0).max(1).nullable(),
  latency: z.object({
    panel_p50_sec: z.number().nonnegative().nullable(),
    panel_p95_sec: z.number().nonnegative().nullable(),
    single_patient_sec: z.number().nonnegative().nullable(),
  }),
  status: z.enum(["not_run", "complete", "error"]),
});

export const FixtureSchema = z.object({
  dataset_version: z.literal("continua-synth-v1"),
  synthetic: z.literal(true),
  patient: PatientSchema,
  records: z.array(SourceRecordSchema).min(1),
  events: z.array(LegacyClinicalEventSchema).min(1),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      "panel_not_found",
      "patient_not_found",
      "gap_not_found",
      "gap_not_grounded",
      "invalid_payload",
      "pipeline_error",
      "internal_error",
    ]),
    message: z.string().min(1),
  }),
});

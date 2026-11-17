import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const isoDateTime = z.string().datetime();

export const VersionMetadataSchema = z.object({
  spec_version: z.string().min(1),
  dataset_version: z.string().min(1),
  eval_version: z.string().min(1),
  extractor_version: z.string().min(1),
  detector_version: z.string().min(1),
  priority_version: z.string().min(1),
  api_version: z.string().min(1),
});

export const GapTypeSchema = z.enum([
  "missed_followup",
  "duplicate_test",
  "med_monitoring",
]);

export const PriorityBandSchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

export const EventTypeSchema = z.enum([
  "surgery",
  "imaging",
  "consult",
  "lab_result",
  "medication_start",
  "medication_stop",
  "referral",
  "followup",
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

export const ClinicalEventSchema = z.object({
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
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

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

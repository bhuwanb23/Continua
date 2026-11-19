import { z } from "zod";
import { DISCLAIMER } from "@/lib/domain/api";

export const API_VERSION = "v1" as const;

export const ResponseMetaSchema = z.object({
  api_version: z.literal("v1"),
  synthetic: z.literal(true),
  evaluation_as_of_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  request_id: z.string().min(1),
});

export const DisclaimerSchema = z.literal(DISCLAIMER);

export const GapTypeSchema = z.enum(["missed_followup", "duplicate_test", "med_monitoring"]);
export const PriorityBandSchema = z.enum(["P1", "P2", "P3", "P4", "NONE"]);
export const WorkflowSeveritySchema = z.enum(["low", "medium", "high"]);
export const PriorityLabelSchema = z.enum(["Act first", "Act soon", "Routine", "Monitor", "No verified gap"]);

export const PRIORITY_LABELS = {
  P1: "Act first",
  P2: "Act soon",
  P3: "Routine",
  P4: "Monitor",
  NONE: "No verified gap",
} as const;

export const PanelResponseSchema = z.object({
  panel: z.object({
    panel_id: z.string().min(1),
    name: z.string().min(1),
    patient_count: z.number().int().nonnegative(),
    patients_with_verified_gaps: z.number().int().nonnegative(),
    verified_gap_counts: z.record(z.string(), z.number().int().nonnegative()),
  }),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export const PatientListItemSchema = z.object({
  patient_id: z.string().uuid(),
  display_name: z.string().min(1),
  age: z.number().int().min(0).max(120),
  sex: z.enum(["F", "M", "X"]),
  primary_condition: z.string().min(1),
  last_contact_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  verified_gap_count: z.number().int().nonnegative(),
  patient_priority_score: z.number().int().min(0).max(100),
  priority_band: PriorityBandSchema,
  priority_label: PriorityLabelSchema,
  top_gap_type: GapTypeSchema.nullable(),
});

export const PatientListResponseSchema = z.object({
  panel_id: z.string().min(1),
  patients: z.array(PatientListItemSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export const PriorityBreakdownSchema = z.object({
  top_gap_raw_score: z.number(),
  top_gap_overdue_days: z.number().int().nullable(),
  secondary_gap_count: z.number().int().nonnegative(),
  secondary_bonus: z.number(),
  patient_raw_score: z.number(),
});

export const PatientResponseSchema = z.object({
  patient: z.object({
    patient_id: z.string().uuid(),
    display_name: z.string().min(1),
    age: z.number().int().min(0).max(120),
    sex: z.enum(["F", "M", "X"]),
    primary_condition: z.string().min(1),
    last_contact_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    patient_priority_score: z.number().int().min(0).max(100),
    priority_band: PriorityBandSchema,
    priority_label: PriorityLabelSchema,
    priority_rank: z.number().int().positive().nullable(),
    verified_gap_count: z.number().int().nonnegative(),
    priority_breakdown: PriorityBreakdownSchema.nullable(),
  }),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export const TimelineEventSchema = z.object({
  event_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_precision: z.string().min(1),
  event_type: z.string().min(1),
  description: z.string(),
  provider: z.string().nullable(),
  provider_type: z.string().nullable(),
  source_doc_id: z.string().min(1),
  display: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

export const TimelineResponseSchema = z.object({
  patient_id: z.string().uuid(),
  events: z.array(TimelineEventSchema),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export const GapSummarySchema = z.object({
  gap_id: z.string().min(1),
  gap_type: GapTypeSchema,
  title: z.string().min(1),
  workflow_severity: WorkflowSeveritySchema,
  gap_priority_score: z.number().int().min(0).max(100),
  priority_band: PriorityBandSchema,
  priority_label: PriorityLabelSchema,
  summary: z.string().min(1),
  recommended_coordinator_action: z.string().min(1),
  evidence_status: z.literal("verified"),
  evidence_count: z.number().int().nonnegative(),
});

export const GapsResponseSchema = z.object({
  patient_id: z.string().uuid(),
  gaps: z.array(GapSummarySchema),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export const EvidenceSourceSchema = z.object({
  document_id: z.string().min(1),
  document_type: z.string().min(1),
  provider: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quoted_span: z.string().min(1),
  source_excerpt: z.string().min(1),
  verification_method: z.string().min(1),
});

export const EvidenceClaimSchema = z.object({
  claim: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]).nullable(),
  status: z.enum(["verified", "unsupported"]),
  evidence_ids: z.array(z.string()),
});

export const AbsenceCheckSchema = z.object({
  description: z.string().min(1),
  window_start: z.string().nullable(),
  window_end: z.string().nullable(),
  matching_event_count: z.number().int().nonnegative(),
  status: z.string().min(1),
});

export const PolicyCheckSchema = z.object({
  policy: z.string().min(1),
  status: z.string().min(1),
  detail: z.string().nullable(),
});

export const EvidenceResponseSchema = z.object({
  gap_id: z.string().min(1),
  verification_status: z.literal("verified"),
  claims: z.array(EvidenceClaimSchema),
  sources: z.array(EvidenceSourceSchema),
  absence_checks: z.array(AbsenceCheckSchema),
  policy_checks: z.array(PolicyCheckSchema),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export const QueueItemSchema = z.object({
  rank: z.number().int().min(1),
  patient_id: z.string().uuid(),
  display_name: z.string().min(1),
  patient_priority_score: z.number().int().min(0).max(100),
  priority_band: PriorityBandSchema,
  priority_label: PriorityLabelSchema,
  verified_gap_count: z.number().int().nonnegative(),
  top_gap_id: z.string().min(1),
  top_gap_type: GapTypeSchema,
  top_gap_priority_score: z.number().int().min(0).max(100),
  headline: z.string().min(1),
  recommended_coordinator_action: z.string().min(1),
});

export const QueueResponseSchema = z.object({
  panel_id: z.string().min(1),
  k: z.number().int().positive(),
  items: z.array(QueueItemSchema),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export const ImpactMetricSchema = z.object({
  metric: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  classification: z.enum(["MEASURED", "MODELED", "SCENARIO_ASSUMPTION", "EXTERNAL_RESEARCH"]),
  source: z.string().optional(),
  basis: z.string().optional(),
});

export const MetricsResponseSchema = z.object({
  panel_id: z.string().min(1),
  measured: z.array(ImpactMetricSchema),
  modeled: z.array(ImpactMetricSchema),
  scenario_assumptions: z.array(ImpactMetricSchema),
  external_research: z.array(ImpactMetricSchema),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export const EvaluationResponseSchema = z.object({
  evaluation: z.object({
    benchmark_run_id: z.string().min(1),
    benchmark_version: z.string().min(1),
    status: z.string().min(1),
    partition: z.string().nullable(),
    extraction: z.record(z.string(), z.unknown()).nullable(),
    gap_detection: z.record(z.string(), z.unknown()).nullable(),
    grounding: z.record(z.string(), z.unknown()).nullable(),
    hard_negatives: z.record(z.string(), z.unknown()).nullable(),
    priority: z.record(z.string(), z.unknown()).nullable(),
    end_to_end: z.record(z.string(), z.unknown()).nullable(),
    latency: z.record(z.string(), z.unknown()).nullable(),
    limitations: z.array(z.string()),
  }),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  api_version: z.literal("v1"),
  request_id: z.string().min(1),
});

export const ReadinessResponseSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  cache_version: z.string().nullable(),
  patient_count: z.number().int().nonnegative(),
  api_version: z.literal("v1"),
  request_id: z.string().min(1),
});

export const CoordinatorActionSchema = z.enum(["acknowledged", "contacted", "reviewed"]);
export type CoordinatorActionValue = z.infer<typeof CoordinatorActionSchema>;

export const ActionRequestSchema = z.object({ action: CoordinatorActionSchema });

export const ActionResponseSchema = z.object({
  gap_id: z.string().min(1),
  action: CoordinatorActionSchema,
  recorded_at: z.string().min(1),
  intelligence_unchanged: z.literal(true),
  meta: ResponseMetaSchema,
  disclaimer: DisclaimerSchema,
});

export type PanelResponse = z.infer<typeof PanelResponseSchema>;
export type PatientListResponse = z.infer<typeof PatientListResponseSchema>;
export type PatientResponse = z.infer<typeof PatientResponseSchema>;
export type TimelineResponse = z.infer<typeof TimelineResponseSchema>;
export type GapsResponse = z.infer<typeof GapsResponseSchema>;
export type EvidenceResponse = z.infer<typeof EvidenceResponseSchema>;
export type QueueResponse = z.infer<typeof QueueResponseSchema>;
export type MetricsResponse = z.infer<typeof MetricsResponseSchema>;
export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>;
export type ActionResponse = z.infer<typeof ActionResponseSchema>;

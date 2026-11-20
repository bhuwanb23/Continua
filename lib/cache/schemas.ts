import { z } from "zod";

export const CacheManifestSchema = z.object({
  cache_version: z.string().min(1),
  dataset_version: z.string().min(1),
  eval_version: z.string().min(1),
  clinical_event_schema: z.string().min(1),
  extractor_version: z.string().min(1),
  normalization_version: z.string().min(1),
  detector_version: z.string().min(1),
  gap_policy_version: z.string().min(1),
  evidence_version: z.string().min(1),
  priority_version: z.string().min(1),
  benchmark_version: z.string().min(1),
  evaluation_as_of_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  patient_count: z.number().int().nonnegative(),
  generated_at: z.string().min(1),
  git_commit: z.string().min(1),
  artifacts: z.record(z.string(), z.object({ sha256: z.string().length(64), bytes: z.number().int().nonnegative() })),
  manifest_sha256: z.string().length(64),
});

export const PanelCacheSchema = z.object({
  panel_id: z.string().min(1),
  name: z.string().min(1),
  patient_count: z.number().int().nonnegative(),
  flagged_patient_count: z.number().int().nonnegative(),
  verified_gap_counts: z.record(z.string(), z.number().int().nonnegative()),
  top_patient_ids: z.array(z.string()),
  generated_at: z.string().min(1),
  synthetic: z.literal(true),
});

export const PatientCacheSummarySchema = z.object({
  patient_id: z.string().uuid(),
  fixture_key: z.string().min(1),
  display_name: z.string().min(1),
  age: z.number().int().min(0).max(120),
  sex: z.enum(["F", "M", "X"]),
  primary_condition: z.string().min(1),
  last_contact_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  verified_gap_count: z.number().int().nonnegative(),
  patient_priority_score: z.number().int().min(0).max(100),
  priority_band: z.enum(["P1", "P2", "P3", "P4", "NONE"]),
});

export const TimelineCacheSchema = z.object({
  patient_id: z.string().uuid(),
  events: z.array(z.unknown()),
  event_store_hash: z.string().length(64),
  clinical_event_schema: z.string().min(1),
  extractor_version: z.string().min(1),
});

export const MariaCacheSchema = z.object({
  patient_id: z.string().uuid(),
  fixture_key: z.literal("P-001-maria"),
  queue_rank: z.number().int().positive().nullable(),
  flagship_gap_id: z.string().uuid().nullable(),
  demo_path: z.object({
    timeline_event_ids: z.array(z.string()),
    gap_ids: z.array(z.string()),
    flagship_evidence_id: z.string().nullable(),
  }),
});

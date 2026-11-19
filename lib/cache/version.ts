export const DEMO_CACHE_VERSION = "continua-demo-cache-v1" as const;

export const DEMO_CACHE_ARTIFACTS = [
  "manifest.json",
  "panel.json",
  "patients.json",
  "records.json",
  "timelines.json",
  "verified-gaps.json",
  "evidence.json",
  "priorities.json",
  "queue.json",
  "impact.json",
  "evaluation.json",
  "maria.json",
] as const;

export type DemoCacheArtifactName = (typeof DEMO_CACHE_ARTIFACTS)[number];

export const CACHE_SCHEMA_VERSION = 1 as const;

export const EXPECTED_CACHE_VERSIONS = {
  dataset_version: "continua-synth-v1",
  eval_version: "continua-eval-v1",
  clinical_event_schema: "clinical-event-v1.1",
  extractor_version: "extractor-v1",
  normalization_version: "normalization-v1",
  detector_version: "gaps-v1",
  gap_policy_version: "gap-policy-v1",
  evidence_version: "evidence-v1",
  priority_version: "priority-v1",
  benchmark_version: "continua-benchmark-v1",
  evaluation_as_of_date: "2026-06-05",
} as const;

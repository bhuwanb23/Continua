export const SPEC_VERSION = "1.0" as const;
export const DATASET_VERSION = "continua-synth-v1" as const;
export const EVAL_VERSION = "continua-eval-v1" as const;
export const EXTRACTOR_VERSION = "extractor-v1" as const;
export const DETECTOR_VERSION = "gaps-v1" as const;
export const PRIORITY_VERSION = "priority-v1" as const;
export const API_VERSION = "v1" as const;
export const CLINICAL_EVENT_SCHEMA_VERSION = "clinical-event-v1" as const;
export const NORMALIZATION_VERSION = "normalization-v1" as const;

/**
 * Frozen benchmark clock. Clinical rules must never call `new Date()` directly.
 */
export const EVALUATION_AS_OF_DATE = "2026-06-05" as const;

export interface VersionMetadata {
  spec_version: string;
  dataset_version: string;
  eval_version: string;
  extractor_version: string;
  detector_version: string;
  priority_version: string;
  api_version: string;
  clinical_event_schema: string;
  normalization_version: string;
}

export const VERSION_METADATA: VersionMetadata = {
  spec_version: SPEC_VERSION,
  dataset_version: DATASET_VERSION,
  eval_version: EVAL_VERSION,
  extractor_version: EXTRACTOR_VERSION,
  detector_version: DETECTOR_VERSION,
  priority_version: PRIORITY_VERSION,
  api_version: API_VERSION,
  clinical_event_schema: CLINICAL_EVENT_SCHEMA_VERSION,
  normalization_version: NORMALIZATION_VERSION,
};

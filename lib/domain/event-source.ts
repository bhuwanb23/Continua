export const VERIFICATION_METHODS = ["exact", "fuzzy"] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export interface EventSource {
  source_doc_id: string;
  source_span: string;
  span_start?: number;
  span_end?: number;
  verification_method: VerificationMethod;
  verification_score: number;
}

export interface ClinicalEventMetadata {
  schema_version: import("./versions").ClinicalEventSchemaVersion;
  normalization_version: string;
  extractor_version: string;
}

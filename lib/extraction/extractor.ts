import type { CandidateClinicalEvent } from "@/lib/schemas/candidate-event.schema";
import type { ExtractionEnvelope } from "./preprocess";

export interface ExtractionRequestMetadata {
  request_id: string;
  patient_id: string;
  document_id: string;
  provider: string;
  model: string;
  prompt_version: string;
  candidate_schema_version: string;
  latency_ms: number;
  attempt_count: number;
  status: "ok" | "failed";
  candidate_event_count: number;
  accepted_event_count?: number;
  rejected_event_count?: number;
  input_tokens?: number;
  output_tokens?: number;
  live_or_cached: "live" | "cached" | "fixture";
  error?: string;
}

export interface DocumentExtractionResult {
  candidates: CandidateClinicalEvent[];
  metadata: ExtractionRequestMetadata;
}

/**
 * Document-level extraction boundary. One document per request keeps
 * citations, retries, cache keys, and error analysis simple.
 */
export interface ClinicalEventDocumentExtractor {
  readonly version: string;
  readonly modelId: string;
  extractDocument(request: { envelope: ExtractionEnvelope }): Promise<DocumentExtractionResult>;
}
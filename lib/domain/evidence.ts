import type { ProviderType } from "./clinical-event";

export type VerificationScore = 1.0 | 0.6;

export interface EvidenceItem {
  doc_id: string;
  provider: string;
  provider_type: ProviderType;
  date: string;
  quoted_span: string;
  span_verified: boolean;
  verification_score: VerificationScore;
  source_text_excerpt?: string | undefined;
  event_id: string;
}

/**
 * Gap-layer confidence = extraction_confidence × verification_score.
 * Three values, never conflated.
 */
export interface ConfidenceBreakdown {
  extraction_confidence: number;
  verification_score: VerificationScore;
  evidence_confidence: number;
}

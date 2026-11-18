import { createHash } from "node:crypto";
import type { DocType, ProviderType, SourceRecord } from "@/lib/domain";

/**
 * Whitelisted extraction input. Only information legitimately available from
 * the record reaches the extractor — never fixture keys, scenario labels,
 * difficulty, or ground truth.
 */
export interface ExtractionEnvelope {
  document_id: string;
  patient_id: string;
  document_type: DocType;
  document_date: string;
  provider_display: string;
  provider_type: ProviderType;
  text: string;
  synthetic: true;
  content_hash: string;
}

export function prepareExtractionEnvelope(record: SourceRecord): ExtractionEnvelope {
  return {
    document_id: record.source_doc_id,
    patient_id: record.patient_id,
    document_type: record.doc_type,
    document_date: record.date,
    provider_display: record.provider,
    provider_type: record.provider_type,
    text: record.text,
    synthetic: true,
    content_hash: createHash("sha256").update(record.text).digest("hex"),
  };
}
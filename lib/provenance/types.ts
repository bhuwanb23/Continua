import type { EventSource, SourceRecord } from "@/lib/domain";

export interface ProvenanceContext {
  patient_id: string;
  records: SourceRecord[];
}

export type ProvenanceResult =
  | { ok: true; source: EventSource }
  | { ok: false; code: "CE-004" | "CE-005" | "CE-006"; reason: string };

export interface ProvenanceCandidate {
  source_doc_id: string;
  patient_id: string;
  source_span: string;
  span_start?: number;
  span_end?: number;
}
import { createHash as createCryptoHash } from "node:crypto";
import type { CanonicalClinicalEvent, SourceRecord } from "@/lib/domain";
import {
  CLINICAL_EVENT_SCHEMA_VERSION,
  DATASET_VERSION,
  EVALUATION_AS_OF_DATE,
  EXTRACTOR_VERSION,
} from "@/lib/domain/versions";
import { hashClinicalEvents } from "@/lib/clinical-events";

export const EVIDENCE_VERSION = "evidence-v1" as const;

/** Frozen lexical-support bounds. Fuzzy support is never a semantic search. */
export const FUZZY_MIN_SPAN_CHARS = 40;
export const FUZZY_MIN_SPAN_TOKENS = 6;
export const EXCERPT_CONTEXT_CHARS = 80;

export const EVIDENCE_DISCLAIMER =
  "Synthetic demo data. For coordinator verification only. Not medical advice.";

export interface EvidenceVerificationContext {
  events: CanonicalClinicalEvent[];
  records: SourceRecord[];
  evaluation_as_of_date: string;
  event_store_hash: string;
  dataset_version: string;
  extractor_version: string;
  clinical_event_schema: string;
  records_by_id: Map<string, SourceRecord>;
  events_by_id: Map<string, CanonicalClinicalEvent>;
}

export interface EvidenceVerificationOptions {
  evaluation_as_of_date?: string;
  event_store_hash?: string;
  dataset_version?: string;
  extractor_version?: string;
  clinical_event_schema?: string;
}

export function createEvidenceVerificationContext(
  events: CanonicalClinicalEvent[],
  records: SourceRecord[],
  options: EvidenceVerificationOptions = {},
): EvidenceVerificationContext {
  return {
    events,
    records,
    evaluation_as_of_date: options.evaluation_as_of_date ?? EVALUATION_AS_OF_DATE,
    event_store_hash: options.event_store_hash ?? hashClinicalEvents(events),
    dataset_version: options.dataset_version ?? DATASET_VERSION,
    extractor_version: options.extractor_version ?? EXTRACTOR_VERSION,
    clinical_event_schema: options.clinical_event_schema ?? CLINICAL_EVENT_SCHEMA_VERSION,
    records_by_id: new Map(records.map((record) => [record.source_doc_id, record])),
    events_by_id: new Map(events.map((event) => [event.event_id, event])),
  };
}

export function documentContentHash(text: string): string {
  return createCryptoHash("sha256").update(text).digest("hex");
}

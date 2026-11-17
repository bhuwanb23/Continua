import type { ProviderType } from "./clinical-event";

export const DOC_TYPES = [
  "referral",
  "consult_note",
  "lab_report",
  "imaging_report",
  "medication_list",
  "discharge_summary",
  "other",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export interface SourceRecord {
  source_doc_id: string;
  /** Human-readable alias, e.g. "R4". Never the machine identity. */
  fixture_key: string;
  patient_id: string;
  doc_type: DocType;
  provider: string;
  provider_type: ProviderType;
  date: string;
  text: string;
  dataset_version: string;
  generator_version: string;
  synthetic: true;
}

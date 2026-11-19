export type ClaimClassification =
  | "MEASURED"
  | "MODELED"
  | "SCENARIO_ASSUMPTION"
  | "EXTERNAL_RESEARCH"
  | "FUTURE_TARGET";

export type ClaimState = "DRAFT" | "VALIDATED" | "APPROVED" | "RETIRED";

export interface ExternalSource {
  publisher: string;
  title: string;
  url: string;
  publication_date: string;
  retrieved_at: string;
  excerpt_ref: string;
}

export interface Claim {
  claim_id: string;
  label: string;
  classification: ClaimClassification;
  state: ClaimState;
  value: number | string | null;
  unit?: string;
  benchmark_run_id?: string;
  source_artifact?: string;
  surfaces: string[];
  formula?: string;
  assumptions?: string[];
  external_source?: ExternalSource;
  sample_size?: number;
  notes?: string;
}

export const CLAIM_CLASSIFICATIONS: ClaimClassification[] = [
  "MEASURED",
  "MODELED",
  "SCENARIO_ASSUMPTION",
  "EXTERNAL_RESEARCH",
  "FUTURE_TARGET",
];

export const CLAIM_STATES: ClaimState[] = ["DRAFT", "VALIDATED", "APPROVED", "RETIRED"];

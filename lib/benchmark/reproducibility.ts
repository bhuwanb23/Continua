import type { ReproducibilityReport } from "./types";

export interface ReproducibilitySnapshot {
  canonical_event_cache_sha256: string;
  candidate_gap_ids: string[];
  verified_gap_ids: string[];
  patient_scores: Array<{ patient_id: string; score: number; rank: number | null }>;
  top_k_order: string[];
  evaluation_results: Record<string, number | string | boolean | null>;
}

const FIELDS: Array<keyof ReproducibilitySnapshot> = [
  "canonical_event_cache_sha256",
  "candidate_gap_ids",
  "verified_gap_ids",
  "patient_scores",
  "top_k_order",
  "evaluation_results",
];

export function compareReproducibility(
  first: ReproducibilitySnapshot,
  second: ReproducibilitySnapshot,
): ReproducibilityReport {
  const differences: Record<string, number> = {};
  for (const field of FIELDS) {
    differences[field] = JSON.stringify(first[field]) === JSON.stringify(second[field]) ? 0 : 1;
  }
  const total = Object.values(differences).reduce((sum, value) => sum + value, 0);
  return {
    status: "measured",
    runs: 2,
    compared: [...FIELDS],
    differences,
    identical: total === 0,
    llm_temperature: null,
    note:
      "Two deterministic post-extraction executions were compared. Live LLM extraction is excluded; the fixture event cache is frozen.",
  };
}

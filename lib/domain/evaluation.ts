import type { GapType } from "./gap";

export interface PerTypeMetrics {
  precision: number | null;
  recall: number | null;
  f1: number | null;
  tp: number;
  fp: number;
  fn: number;
}

export interface LatencyMetrics {
  panel_p50_sec: number | null;
  panel_p95_sec: number | null;
  single_patient_sec: number | null;
}

export interface EvalResult {
  run_at: string | null;
  panel_id: string;
  ground_truth_gaps: number;
  reported_gaps: number;
  per_type: Record<GapType, PerTypeMetrics>;
  macro_f1: number | null;
  micro_f1: number | null;
  grounding_accuracy: number | null;
  unsupported_claim_rate: number | null;
  extraction_accuracy: number | null;
  latency: LatencyMetrics;
  status: "not_run" | "complete" | "error";
}

import type { ReliabilitySeverity } from "./severity";

export const RELIABILITY_OUTCOMES = [
  "RECOVERED",
  "DEGRADED",
  "FAILED_SAFE",
  "UNSAFE_FAILURE",
] as const;
export type ReliabilityOutcome = (typeof RELIABILITY_OUTCOMES)[number];

export const RELIABILITY_LAYERS = [
  "dataset",
  "extraction",
  "event-store",
  "detectors",
  "evidence",
  "priority",
  "cache",
  "repository",
  "api",
  "ux",
  "dependency",
  "concurrency",
  "determinism",
  "browser",
  "demo",
] as const;
export type ReliabilityLayer = (typeof RELIABILITY_LAYERS)[number];

/** The official P0 path. Every stage has an independent failure injection. */
export const CRITICAL_PATH_STAGES = [
  "app_boot",
  "cache_initialization",
  "readiness",
  "today_queue",
  "patient_workspace",
  "timeline",
  "verified_gap",
  "evidence",
  "evaluation",
] as const;
export type CriticalPathStage = (typeof CRITICAL_PATH_STAGES)[number];

export interface ReliabilityScenario {
  id: string;
  layer: ReliabilityLayer;
  scenario: string;
  severity: ReliabilitySeverity;
  injection: string;
  expected_behavior: string;
  regression_test: string;
}

export interface ScenarioResult {
  id: string;
  layer: ReliabilityLayer;
  scenario: string;
  severity: ReliabilitySeverity;
  expected_behavior: string;
  observed_behavior: string;
  outcome: ReliabilityOutcome;
  status: "PASS" | "FAIL";
  regression_test: string;
  duration_ms: number;
}

export interface ReliabilityMetrics {
  scenarios_total: number;
  scenarios_passed: number;
  scenarios_failed: number;
  r0_unresolved: number;
  r1_unresolved: number;
  r2_accepted: number;
  r3_accepted: number;
  wrong_patient_outputs: number;
  ungrounded_gaps_displayed: number;
  partial_shown_complete: number;
  corrupt_caches_served: number;
  nondeterministic_runs: number;
  critical_path_runs: number;
  critical_path_passes: number;
}

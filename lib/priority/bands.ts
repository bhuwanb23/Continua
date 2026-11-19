import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";
import type { GapPriorityBand, WorkflowPriorityBand } from "./types";

function assertScore(score: number): void {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error(`Priority score must be an integer from 0 to 100, received ${String(score)}`);
  }
}

export function bandForScore(
  score: number,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): WorkflowPriorityBand {
  assertScore(score);
  const bands = config.bands;
  if (score >= bands.P1_min) return "P1";
  if (score >= bands.P2_min) return "P2";
  if (score >= bands.P3_min) return "P3";
  if (score >= bands.P4_min) return "P4";
  return "NONE";
}

export function gapBandForScore(
  score: number,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): GapPriorityBand {
  const band = bandForScore(score, config);
  if (band === "NONE") throw new Error("A scored gap cannot have the NONE workflow band");
  return band;
}

export function assertScoreBandMatch(
  score: number,
  band: WorkflowPriorityBand,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): void {
  const expected = bandForScore(score, config);
  if (expected !== band) {
    throw new Error(`Score/band mismatch: ${score} maps to ${expected}, received ${band}`);
  }
}

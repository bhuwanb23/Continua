import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";

/** Theoretical bounds, never the observed panel maximum. */
export function maxGapRaw(config: PriorityConfig = DEFAULT_PRIORITY_CONFIG): number {
  const maxSeverity = Math.max(...Object.values(config.severity_weights));
  const maxTemporal = Math.max(...Object.values(config.temporal_factors));
  const maxActionability = Math.max(...Object.values(config.actionability_weights));
  return round6(maxSeverity * maxTemporal * maxActionability);
}

export function maxPatientRaw(config: PriorityConfig = DEFAULT_PRIORITY_CONFIG): number {
  return round6(maxGapRaw(config) + config.secondary_bonus_cap);
}

export function round6(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Score arithmetic produced a non-finite value");
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

export function normalizeScore(raw: number, theoreticalMax: number): number {
  if (!Number.isFinite(raw) || raw < 0) throw new Error("raw score must be a finite non-negative number");
  if (!Number.isFinite(theoreticalMax) || theoreticalMax <= 0) {
    throw new Error("theoretical maximum must be a positive finite number");
  }
  const score = Math.round((raw / theoreticalMax) * 100);
  return Math.min(100, Math.max(0, score));
}

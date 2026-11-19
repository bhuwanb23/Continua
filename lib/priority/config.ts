import type { CandidateSeverity, GapType } from "@/lib/domain";
import type { TemporalBucket } from "./types";

export interface PriorityBandThresholds {
  P1_min: number;
  P2_min: number;
  P3_min: number;
  P4_min: number;
}

export interface TemporalThresholds {
  overdue_1_7_max: number;
  overdue_8_30_max: number;
  overdue_31_60_max: number;
  overdue_61_90_max: number;
}

export type TemporalFactors = Record<TemporalBucket, number>;

export interface PriorityConfig {
  severity_weights: Record<CandidateSeverity, number>;
  temporal_factors: TemporalFactors;
  temporal_thresholds: TemporalThresholds;
  actionability_weights: Record<GapType, number>;
  secondary_factor: number;
  secondary_bonus_cap: number;
  bands: PriorityBandThresholds;
}

export interface PriorityConfigOverride {
  severity_weights?: Partial<Record<CandidateSeverity, number>>;
  temporal_factors?: Partial<TemporalFactors>;
  temporal_thresholds?: Partial<TemporalThresholds>;
  actionability_weights?: Partial<Record<GapType, number>>;
  secondary_factor?: number;
  secondary_bonus_cap?: number;
  bands?: Partial<PriorityBandThresholds>;
}

/**
 * Frozen priority-v1 workflow constants.
 *
 * These are product-policy constants for coordinator triage, not clinical
 * coefficients. Changing any value requires a priority version bump.
 */
export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  severity_weights: {
    high: 1.0,
    medium: 0.7,
    low: 0.45,
  },
  temporal_factors: {
    not_overdue: 0.75,
    overdue_1_7: 1.0,
    overdue_8_30: 1.15,
    overdue_31_60: 1.3,
    overdue_61_90: 1.4,
    overdue_over_90: 1.5,
    duplicate_not_applicable: 1.0,
  },
  temporal_thresholds: {
    overdue_1_7_max: 7,
    overdue_8_30_max: 30,
    overdue_31_60_max: 60,
    overdue_61_90_max: 90,
  },
  actionability_weights: {
    missed_followup: 1.0,
    med_monitoring: 0.95,
    duplicate_test: 0.85,
  },
  secondary_factor: 0.1,
  secondary_bonus_cap: 0.3,
  bands: {
    P1_min: 80,
    P2_min: 60,
    P3_min: 35,
    P4_min: 1,
  },
};

function assertNumber(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a finite non-negative number`);
}

/** Sensitivity-analysis helper. Production ranking never passes an override. */
export function mergePriorityConfig(
  base: PriorityConfig,
  override: PriorityConfigOverride = {},
): PriorityConfig {
  const merged: PriorityConfig = {
    severity_weights: { ...base.severity_weights, ...override.severity_weights },
    temporal_factors: { ...base.temporal_factors, ...override.temporal_factors },
    temporal_thresholds: { ...base.temporal_thresholds, ...override.temporal_thresholds },
    actionability_weights: { ...base.actionability_weights, ...override.actionability_weights },
    secondary_factor: override.secondary_factor ?? base.secondary_factor,
    secondary_bonus_cap: override.secondary_bonus_cap ?? base.secondary_bonus_cap,
    bands: { ...base.bands, ...override.bands },
  };

  for (const [key, value] of Object.entries(merged.severity_weights)) assertNumber(value, `severity_weights.${key}`);
  for (const [key, value] of Object.entries(merged.temporal_factors)) assertNumber(value, `temporal_factors.${key}`);
  for (const [key, value] of Object.entries(merged.actionability_weights)) {
    assertNumber(value, `actionability_weights.${key}`);
  }
  for (const [key, value] of Object.entries(merged.temporal_thresholds)) assertNumber(value, `temporal_thresholds.${key}`);
  for (const [key, value] of Object.entries(merged.bands)) assertNumber(value, `bands.${key}`);
  assertNumber(merged.secondary_factor, "secondary_factor");
  assertNumber(merged.secondary_bonus_cap, "secondary_bonus_cap");

  const thresholds = merged.temporal_thresholds;
  if (!(
    thresholds.overdue_1_7_max <= thresholds.overdue_8_30_max &&
    thresholds.overdue_8_30_max <= thresholds.overdue_31_60_max &&
    thresholds.overdue_31_60_max <= thresholds.overdue_61_90_max
  )) {
    throw new Error("temporal thresholds must be non-decreasing");
  }
  if (!(merged.bands.P1_min > merged.bands.P2_min && merged.bands.P2_min > merged.bands.P3_min && merged.bands.P3_min > merged.bands.P4_min)) {
    throw new Error("priority band thresholds must be strictly descending");
  }

  return merged;
}

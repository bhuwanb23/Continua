import type { GapType } from "@/lib/domain";
import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";
import type { TemporalBucket } from "./types";

export interface TemporalFactorResult {
  factor: number;
  bucket: TemporalBucket;
  overdue_days: number | null;
  window_days: number | null;
  overdue_ratio: number | null;
}

function assertFiniteDays(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a finite number of days`);
}

export function temporalBucketForOverdue(
  overdueDays: number,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): TemporalBucket {
  assertFiniteDays(overdueDays, "overdue_days");
  const thresholds = config.temporal_thresholds;
  if (overdueDays < 1) return "not_overdue";
  if (overdueDays <= thresholds.overdue_1_7_max) return "overdue_1_7";
  if (overdueDays <= thresholds.overdue_8_30_max) return "overdue_8_30";
  if (overdueDays <= thresholds.overdue_31_60_max) return "overdue_31_60";
  if (overdueDays <= thresholds.overdue_61_90_max) return "overdue_61_90";
  return "overdue_over_90";
}

/**
 * Duplicate tests have no overdue concept. Their interval is already part of
 * detector eligibility, so the temporal factor is neutral for that type.
 */
export function temporalFactor(
  gapType: GapType,
  overdueDays: number | null,
  windowDays: number | null,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): TemporalFactorResult {
  if (gapType === "duplicate_test") {
    return {
      factor: config.temporal_factors.duplicate_not_applicable,
      bucket: "duplicate_not_applicable",
      overdue_days: null,
      window_days: windowDays,
      overdue_ratio: null,
    };
  }

  if (overdueDays === null) throw new Error("Temporal gap is missing overdue_days");
  assertFiniteDays(overdueDays, "overdue_days");
  if (windowDays !== null && (!Number.isFinite(windowDays) || windowDays <= 0)) {
    throw new Error("window_days must be a positive finite number");
  }

  const bucket = temporalBucketForOverdue(overdueDays, config);
  const ratio = windowDays === null ? null : overdueDays / windowDays;
  return {
    factor: config.temporal_factors[bucket],
    bucket,
    overdue_days: overdueDays,
    window_days: windowDays,
    overdue_ratio: ratio === null ? null : Math.round(ratio * 10_000) / 10_000,
  };
}

import { describe, expect, it } from "vitest";
import { temporalBucketForOverdue, temporalFactor } from "@/lib/priority";

describe("priority temporal factor", () => {
  it("maps every overdue bucket deterministically", () => {
    const cases: Array<[number, string, number]> = [
      [0, "not_overdue", 0.75],
      [1, "overdue_1_7", 1.0],
      [7, "overdue_1_7", 1.0],
      [8, "overdue_8_30", 1.15],
      [30, "overdue_8_30", 1.15],
      [31, "overdue_31_60", 1.3],
      [60, "overdue_31_60", 1.3],
      [61, "overdue_61_90", 1.4],
      [90, "overdue_61_90", 1.4],
      [91, "overdue_over_90", 1.5],
      [365, "overdue_over_90", 1.5],
    ];
    for (const [days, bucket, factor] of cases) {
      expect(temporalBucketForOverdue(days)).toBe(bucket);
      expect(temporalFactor("missed_followup", days, 45).factor).toBe(factor);
    }
  });

  it("is monotone non-decreasing as overdue days grow", () => {
    let previous = 0;
    for (let days = 0; days <= 365; days += 1) {
      const factor = temporalFactor("med_monitoring", days, 90).factor;
      expect(factor).toBeGreaterThanOrEqual(previous);
      previous = factor;
    }
  });

  it("uses a neutral factor for duplicate tests", () => {
    const result = temporalFactor("duplicate_test", null, 14);
    expect(result.factor).toBe(1);
    expect(result.bucket).toBe("duplicate_not_applicable");
    expect(result.overdue_days).toBeNull();
  });

  it("computes overdue ratio against the policy window", () => {
    const result = temporalFactor("missed_followup", 45, 45);
    expect(result.overdue_ratio).toBe(1);
    expect(temporalFactor("missed_followup", 27, 45).overdue_ratio).toBe(0.6);
  });

  it("rejects non-finite or missing temporal inputs", () => {
    expect(() => temporalFactor("missed_followup", Number.NaN, 45)).toThrow();
    expect(() => temporalFactor("med_monitoring", null, 90)).toThrow();
    expect(() => temporalFactor("missed_followup", 10, 0)).toThrow();
  });
});

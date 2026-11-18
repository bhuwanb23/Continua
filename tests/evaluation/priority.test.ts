import { describe, expect, it } from "vitest";
import {
  coverageAtK,
  evaluatePriority,
  precisionAtK,
  runMetamorphicPriorityTests,
  type PriorityCase,
} from "@/lib/evaluation/priority";

function priorityCase(overrides: Partial<PriorityCase> = {}): PriorityCase {
  return {
    gap_id: "gap-1",
    patient_id: "patient-1",
    gap_type: "missed_followup",
    overdue_days: 3,
    confidence: 0.95,
    gap_priority_score: 70,
    priority_band: "HIGH",
    truth_gap_id: "truth-1",
    ...overrides,
  };
}

describe("priority evaluation", () => {
  it("is deterministic for the same input and scorer", () => {
    const score = (value: PriorityCase): number => 50 + value.overdue_days + value.confidence * 10;
    const result = evaluatePriority([priorityCase()], { score });
    expect(result.deterministic).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it("rejects non-finite or out-of-range scores", () => {
    const result = evaluatePriority([priorityCase({ gap_priority_score: Number.NaN })]);
    expect(result.formula_applied).toBe(false);
    expect(result.failures[0]?.code).toBe("PRIO-01");
  });

  it("caps low-confidence bands at MEDIUM", () => {
    const capped = evaluatePriority([priorityCase({ confidence: 0.5, priority_band: "HIGH" })]);
    expect(capped.confidence_band_cap).toBe(false);
    expect(capped.failures[0]?.code).toBe("PRIO-02");
  });

  it("passes the overdue and confidence metamorphic checks", () => {
    const score = (value: PriorityCase): number => 50 + Math.min(value.overdue_days, 30) * 0.5 + value.confidence * 10;
    const result = runMetamorphicPriorityTests(score);
    expect(result.passed).toBe(true);
    expect(result.pairs).toHaveLength(2);
  });

  it("detects a reversed overdue ordering", () => {
    const base = priorityCase({ gap_id: "base", gap_priority_score: 60 });
    const variant = priorityCase({ gap_id: "variant", overdue_days: 30, gap_priority_score: 50 });
    const result = evaluatePriority([base, variant], {
      pairs: [{ baseline: base, variant, expectation: "not_lower" }],
    });
    expect(result.overdue_monotonicity).toBe(false);
  });

  it("computes precision@5 and coverage@5", () => {
    const ranked = [
      { prediction_id: "p1", truth_gap_id: "t1" },
      { prediction_id: "p2", truth_gap_id: null },
      { prediction_id: "p3", truth_gap_id: "t2" },
    ];
    expect(precisionAtK(ranked, 3)).toBeCloseTo(2 / 3);
    expect(coverageAtK(ranked, 3, ["t1", "t2", "t3"])).toBeCloseTo(2 / 3);
  });
});

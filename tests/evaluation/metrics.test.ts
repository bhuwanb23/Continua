import { describe, expect, it } from "vitest";
import {
  assertFiniteMetrics,
  computeDetectionMetrics,
  computeHardNegativePassRate,
  computeMacroF1,
  f1From,
  safeRatio,
} from "@/lib/evaluation/metrics";
import type { NegativeCase } from "@/lib/evaluation/types";
import { gapPrediction, truthGap } from "../support/evaluation";

function negative(overrides: Partial<NegativeCase> = {}): NegativeCase {
  return {
    negative_id: "negative-1",
    patient_id: "patient-1",
    detector_target: "missed_followup",
    scenario_family: "completed_referral",
    relevant_event_ids: ["event-1"],
    relevant_doc_ids: ["doc-1"],
    expected_result: "NO_GAP",
    reason: "Completed referral.",
    difficulty: "HARD",
    dataset_version: "continua-synth-v1",
    eval_version: "continua-eval-v1",
    ...overrides,
  };
}

describe("detection metrics", () => {
  it("is perfect for perfect predictions", () => {
    const metrics = computeDetectionMetrics([truthGap()], [gapPrediction()]);
    expect(metrics.per_type.missed_followup).toMatchObject({
      tp: 1,
      fp: 0,
      fn: 0,
      precision: 1,
      recall: 1,
      f1: 1,
    });
    expect(metrics.macro_f1).toBe(1);
    expect(metrics.micro_f1).toBe(1);
  });

  it("documents precision as null and recall/F1 as zero when nothing is predicted", () => {
    const metrics = computeDetectionMetrics([truthGap()], []);
    expect(metrics.per_type.missed_followup.precision).toBeNull();
    expect(metrics.per_type.missed_followup.recall).toBe(0);
    expect(metrics.per_type.missed_followup.f1).toBe(0);
    expect(metrics.macro_f1).toBe(0);
    expect(metrics.micro_f1).toBe(0);
  });

  it("collapses precision for an all-positive spam predictor", () => {
    const spam = Array.from({ length: 10 }, (_, index) =>
      gapPrediction({
        prediction_id: `spam-${index}`,
        patient_id: `patient-${index + 2}`,
        evidence: [{ doc_id: `doc-${index}`, quoted_span: "span" }],
      }),
    );
    const metrics = computeDetectionMetrics([truthGap()], spam);
    expect(metrics.per_type.missed_followup.precision).toBe(0);
    expect(metrics.per_type.missed_followup.recall).toBe(0);
  });

  it("never returns NaN or Infinity", () => {
    expect(safeRatio(0, 0)).toBeNull();
    expect(safeRatio(1, 0)).toBeNull();
    expect(f1From(0, 0)).toBe(0);
    const metrics = computeDetectionMetrics([], []);
    expect(metrics.macro_f1).toBeNull();
    expect(metrics.micro_f1).toBeNull();
    expect(() => assertFiniteMetrics(metrics)).not.toThrow();
  });

  it("keeps macro F1 equal-weight across all three detector types", () => {
    const perType = {
      missed_followup: { tp: 1, fp: 0, fn: 0, precision: 1, recall: 1, f1: 1 },
      duplicate_test: { tp: 0, fp: 1, fn: 0, precision: 0, recall: null, f1: 0 },
      med_monitoring: { tp: 0, fp: 0, fn: 1, precision: null, recall: 0, f1: 0 },
    };
    expect(computeMacroF1(perType)).toBeCloseTo(1 / 3);
  });

  it("counts hard negatives that receive no prediction", () => {
    const pass = computeHardNegativePassRate([negative()], []);
    expect(pass.pass_rate).toBe(1);
    const fail = computeHardNegativePassRate([negative()], [gapPrediction()]);
    expect(fail.pass_rate).toBe(0);
    expect(fail.failures[0]?.negative_id).toBe("negative-1");
  });

  it("ignores a prediction of another type for a type-specific negative", () => {
    const result = computeHardNegativePassRate([negative()], [gapPrediction({ gap_type: "duplicate_test" })]);
    expect(result.pass_rate).toBe(1);
  });
});

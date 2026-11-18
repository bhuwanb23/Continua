import { describe, expect, it } from "vitest";
import { evaluateGrounding } from "@/lib/evaluation/grounding";
import { computeDetectionMetrics, assertFiniteMetrics } from "@/lib/evaluation/metrics";
import { matchPredictions } from "@/lib/evaluation/matching";
import { validateBenchmark } from "@/lib/evaluation/validate-benchmark";
import { gapPrediction, loadBenchmarkBundle, sourceRecord, truthGap } from "../support/evaluation";

describe("Phase 3 red-team", () => {
  it("attack 1: predicts everything and watches precision collapse", () => {
    const truth = [truthGap()];
    const spam = Array.from({ length: 20 }, (_, index) =>
      gapPrediction({
        prediction_id: `p-${index}`,
        patient_id: `spam-patient-${index}`,
        evidence: [{ doc_id: `spam-doc-${index}`, quoted_span: "span" }],
      }),
    );
    const metrics = computeDetectionMetrics(truth, spam);
    expect(metrics.per_type.missed_followup.precision).toBe(0);
  });

  it("attack 2: predicts nothing and watches recall hit zero", () => {
    const metrics = computeDetectionMetrics([truthGap()], []);
    expect(metrics.per_type.missed_followup.recall).toBe(0);
    expect(metrics.per_type.missed_followup.f1).toBe(0);
  });

  it("attack 3: cites the wrong document and fails grounding", () => {
    const result = evaluateGrounding(
      [gapPrediction({ evidence: [{ doc_id: "wrong-doc", quoted_span: "span" }] })],
      [sourceRecord()],
    );
    expect(result.grounded_gap_rate).toBe(0);
    expect(result.results[0]?.failures).toContain("EV-01");
  });

  it("attack 4: duplicate predictions do not create duplicate true positives", () => {
    const result = matchPredictions(
      [truthGap()],
      [gapPrediction({ prediction_id: "a" }), gapPrediction({ prediction_id: "b" })],
    );
    expect(result.truePositives).toBe(1);
    expect(result.falsePositives).toBe(1);
  });

  it("attack 5/6: wrong specialty or occurrence is not a free true positive", () => {
    const wrongSpecialty = matchPredictions([truthGap()], [gapPrediction({ identity: { specialty: "cardiology" } })]);
    const wrongOccurrence = matchPredictions(
      [truthGap()],
      [gapPrediction({ evidence: [{ doc_id: "other", quoted_span: "span" }] })],
    );
    expect(wrongSpecialty.truePositives).toBe(0);
    expect(wrongOccurrence.truePositives).toBe(0);
  });

  it("attack 7: changing the evaluation date fails benchmark validation", () => {
    const bundle = loadBenchmarkBundle();
    const tampered = structuredClone(bundle);
    tampered.contracts.truth_gaps[0]!.temporal.evaluation_as_of_date = "2026-06-06";
    const result = validateBenchmark(tampered);
    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.includes("evaluation date"))).toBe(true);
  });

  it("attack 8: partition overlap and tampered labels fail validation", () => {
    const bundle = loadBenchmarkBundle();
    const overlap = structuredClone(bundle);
    const moved = overlap.partitions.final[0];
    expect(moved).toBeDefined();
    if (moved) {
      overlap.partitions.dev.push(moved);
      overlap.partitions.assignment[moved] = "dev";
    }
    expect(validateBenchmark(overlap).ok).toBe(false);

    const tampered = structuredClone(bundle);
    tampered.contracts.truth_gaps[0]!.rationale = "";
    expect(validateBenchmark(tampered).ok).toBe(false);
  });

  it("never produces NaN, Infinity, or undefined metrics", () => {
    const metrics = computeDetectionMetrics([], []);
    expect(() => assertFiniteMetrics(metrics)).not.toThrow();
    expect(JSON.stringify(metrics)).not.toMatch(/NaN|Infinity/);
  });
});

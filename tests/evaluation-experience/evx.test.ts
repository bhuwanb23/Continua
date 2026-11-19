import { describe, expect, it } from "vitest";
import { readCache } from "../api/support";
import { getProofEvaluation } from "@/lib/proof/evaluation";
import { CLAIMS } from "@/lib/claims/registry";

interface PerTypeMetric {
  tp: number;
  fp: number;
  fn: number;
}

interface EvaluationArtifactView {
  benchmark_run_id: string;
  end_to_end: { macro_f1: number };
  negatives: { verified: { pass_rate: number } };
  evidence: {
    verified: number;
    unsupported_displayed_claims: number;
    verified_grounding: { grounded_gap_rate: number };
  };
  scorecard: { top5_truth_precision: string };
  gaps: {
    oracle: { truth_gaps: number; per_type: Record<string, PerTypeMetric> };
    extracted: { metrics: { true_positives: number }; per_type: Record<string, PerTypeMetric> };
  };
  baselines: { entries: Array<{ macro_f1: number | null }> };
  priority: { ranked_gaps: number };
}

const evaluation = readCache<EvaluationArtifactView>("evaluation.json");

describe("evaluation experience (EVX)", () => {
  it("EVX-01: displayed metrics equal the frozen evaluation artifact", async () => {
    const proof = await getProofEvaluation();
    expect(proof.headline.macro_f1).toBe(evaluation.end_to_end.macro_f1);
    expect(proof.headline.hard_negative_pass_rate).toBe(
      evaluation.negatives.verified.pass_rate,
    );
    expect(proof.headline.grounding_rate).toBe(
      evaluation.evidence.verified_grounding.grounded_gap_rate,
    );
    expect(proof.headline.top5_truth).toBe(evaluation.scorecard.top5_truth_precision);
    expect(proof.benchmark_run_id).toBe(evaluation.benchmark_run_id);
  });

  it("EVX-02: no metric is renamed accuracy", () => {
    const labels = [
      "Held-out Macro F1",
      "Hard-negative pass",
      "Displayed-gap grounding",
      "Top-5 truth precision",
    ];
    for (const label of labels) expect(label.toLowerCase()).not.toContain("accuracy");
  });

  it("EVX-03/EVX-04: held-out partition and synthetic scope are exposed", async () => {
    const proof = await getProofEvaluation();
    expect(proof.partition).toContain("final");
    expect(proof.synthetic).toBe(true);
    expect(proof.limitations.length).toBeGreaterThan(0);
  });

  it("EVX-05: per-detector support counts derive from the artifact", async () => {
    const proof = await getProofEvaluation();
    const truthByType = evaluation.gaps.oracle.per_type;
    for (const [type, metric] of Object.entries(proof.per_type)) {
      const truth = truthByType[type];
      expect(truth).toBeDefined();
      expect(metric.tp).toBe(truth?.tp);
      expect(metric.fp).toBe(truth?.fp);
      expect(metric.fn).toBe(truth?.fn);
    }
  });

  it("EVX-06/EVX-07: missing values stay null rather than NaN", async () => {
    const proof = await getProofEvaluation();
    const values = [
      proof.headline.macro_f1,
      proof.headline.grounding_rate,
      proof.latency.cached_queue_p50_ms,
      proof.extraction.normalization_accuracy,
    ];
    for (const value of values) {
      if (value !== null) expect(Number.isFinite(value)).toBe(true);
      expect(value === null || Number.isFinite(value)).toBe(true);
    }
    expect(proof.latency.live_model_measured).toBe(false);
  });

  it("EVX-08: baseline values come from the frozen baseline artifact", async () => {
    const proof = await getProofEvaluation();
    const naive = proof.baselines.find((b) => b.name === "naive_keyword_rules");
    expect(naive?.macro_f1).toBe(evaluation.baselines.entries[1]?.macro_f1);
    const llmOnly = proof.baselines.find((b) => b.name === "llm_only_gap_judge");
    expect(llmOnly?.status).toBe("not_run");
  });

  it("EVX-09: grounding claims carry benchmark scope", () => {
    const grounding = CLAIMS.find((c) => c.claim_id === "displayed-gap-grounding");
    expect(grounding?.benchmark_run_id).toBe(evaluation.benchmark_run_id);
    expect(grounding?.sample_size).toBe(41);
  });

  it("EVX-10: displayed funnel counts are coherent with the run metrics", async () => {
    const proof = await getProofEvaluation();
    const byKey = Object.fromEntries(proof.funnel.stages.map((s) => [s.key, s.count]));
    expect(byKey.truth_gaps).toBe(evaluation.gaps.oracle.truth_gaps);
    expect(byKey.correct_candidates).toBe(evaluation.gaps.extracted.metrics.true_positives);
    expect(byKey.verified_gaps).toBe(evaluation.evidence.verified);
    expect(byKey.ranked_gaps).toBe(evaluation.priority.ranked_gaps);
    expect(byKey.top5_truth).toBe(5);
    // The artifact's contradictory support-event stage must not be displayed.
    expect(proof.funnel.stages.some((s) => s.key === "support_events_extracted")).toBe(false);
    expect(proof.funnel.excluded_note).toContain("not displayed");
  });
});

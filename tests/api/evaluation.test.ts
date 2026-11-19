import { describe, expect, it } from "vitest";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";
import { loadBenchmarkReport } from "@/lib/cache/benchmark-report";
import { FORBIDDEN_LABEL_TOKENS } from "@/lib/cache/evaluation";
import { asHandler, invokeGet } from "./support";

const evaluation = asHandler(evaluationRoute);

interface EvaluationBody {
  evaluation: {
    benchmark_run_id: string;
    benchmark_version: string;
    status: string;
    partition: string | null;
    extraction: Record<string, unknown>;
    gap_detection: Record<string, unknown>;
    grounding: Record<string, unknown>;
    hard_negatives: Record<string, unknown>;
    priority: Record<string, unknown>;
    end_to_end: Record<string, unknown>;
    latency: Record<string, unknown>;
    limitations: string[];
  };
}

type Report = Record<string, unknown> & {
  run_id: string;
  benchmark_version: string;
  gaps: { extracted: { metrics: { macro_f1: number; micro_f1: number; true_positives: number } } };
  evidence: { verified: number; candidates: number; wrong_patient_citations: number };
  negatives: { verified_pass_rate: number };
  end_to_end: { macro_f1: number; micro_f1: number };
};

const report = loadBenchmarkReport() as Report;

describe("GET /api/v1/evaluation", () => {
  it("matches the frozen Phase-9 report exactly (CT-07, Gate H)", async () => {
    const result = await invokeGet<EvaluationBody>(evaluation, "/api/v1/evaluation");
    expect(result.status).toBe(200);
    const value = result.body.evaluation;
    expect(value.benchmark_run_id).toBe(report.run_id);
    expect(value.benchmark_version).toBe(report.benchmark_version);
    expect(value.status).toBe("COMPLETED");
    expect(value.gap_detection.macro_f1).toBe(report.gaps.extracted.metrics.macro_f1);
    expect(value.gap_detection.micro_f1).toBe(report.gaps.extracted.metrics.micro_f1);
    expect(value.gap_detection.true_positives).toBe(report.gaps.extracted.metrics.true_positives);
    expect(value.grounding.verified).toBe(report.evidence.verified);
    expect(value.grounding.candidates).toBe(report.evidence.candidates);
    expect(value.grounding.wrong_patient_citations).toBe(report.evidence.wrong_patient_citations);
    expect(value.hard_negatives.verified_pass_rate).toBe(report.negatives.verified_pass_rate);
    expect(value.end_to_end.macro_f1).toBe(report.end_to_end.macro_f1);
    expect(value.end_to_end.micro_f1).toBe(report.end_to_end.micro_f1);
  });

  it("exposes judge-relevant sections without debug artifacts", async () => {
    const result = await invokeGet<EvaluationBody>(evaluation, "/api/v1/evaluation");
    const value = result.body.evaluation;
    expect(value.limitations.length).toBeGreaterThan(0);
    expect(value.partition).toBeTruthy();
    for (const key of ["extraction", "gap_detection", "grounding", "hard_negatives", "priority", "end_to_end", "latency"]) {
      expect(value[key as keyof EvaluationBody["evaluation"]]).not.toBeNull();
    }
    expect(result.text).not.toMatch(/baselines|ablations|scorecard|corruption|attribution/);
  });

  it("leaks no patient-level benchmark labels", async () => {
    const result = await invokeGet<EvaluationBody>(evaluation, "/api/v1/evaluation");
    for (const token of FORBIDDEN_LABEL_TOKENS) {
      expect(result.text).not.toContain(token);
    }
    expect(result.text).not.toContain("gold_event_id");
    expect(result.text).not.toContain("truth_match");
    expect(result.text).not.toContain(report.run_id + "-truth");
  });
});

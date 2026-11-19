import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { benchmarkRunId, loadBenchmarkReport, loadBenchmarkVerifiedGaps } from "@/lib/cache/benchmark-report";
import { projectEvaluationReport } from "@/lib/cache/evaluation";
import { loadDemoCache, validateBenchmarkGapIdentity, validateEvaluation } from "@/lib/cache/validate";
import { CACHE_DIR, cleanupCacheCopies, copyCache, readCacheJson, writeCacheJson } from "./support";

const frozen = loadBenchmarkReport();
const cache = loadDemoCache(CACHE_DIR);

describe("demo cache benchmark integrity", () => {
  it("stores the projection of the frozen Phase-9 report", () => {
    expect(validateEvaluation(cache, frozen)).toEqual([]);
    expect(cache.evaluation.benchmark_run_id).toBe(benchmarkRunId());
    expect(cache.evaluation.status).toBe("COMPLETED");
    const endToEnd = (cache.evaluation as { end_to_end?: { macro_f1?: number } }).end_to_end;
    const frozenEndToEnd = (frozen as { end_to_end?: { macro_f1?: number } }).end_to_end;
    expect(endToEnd?.macro_f1).toBe(frozenEndToEnd?.macro_f1);
  });

  it("matches the qualified VerifiedGap set by clinical identity", () => {
    expect(validateBenchmarkGapIdentity(cache, loadBenchmarkVerifiedGaps())).toEqual([]);
  });

  it("detects a hand-improved benchmark number", () => {
    const dir = copyCache("benchmark-f1");
    const evaluation = readCacheJson<{ benchmark_run_id: string; end_to_end?: { macro_f1?: number } }>(
      "evaluation.json",
      dir,
    );
    if (!evaluation.end_to_end) throw new Error("fixture has no end-to-end block");
    evaluation.end_to_end.macro_f1 = 1.25;
    writeCacheJson(dir, "evaluation.json", evaluation);
    expect(validateEvaluation(loadDemoCache(dir), frozen).length).toBeGreaterThan(0);
    cleanupCacheCopies();
  });

  it("ties evaluation.json back to the immutable final report hash", () => {
    const sourceHash = cache.evaluation.source_report_sha256;
    const raw = readFileSync(join(process.cwd(), "artifacts", "benchmark", benchmarkRunId(), "final-report.json"), "utf8");
    expect(sourceHash).toBe(projectEvaluationReport(JSON.parse(raw)).source_report_sha256);
  });
});

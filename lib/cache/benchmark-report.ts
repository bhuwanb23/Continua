import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function benchmarkRunId(root = process.cwd()): string {
  const latestPath = join(root, "artifacts", "benchmark", "latest.json");
  if (!existsSync(latestPath)) throw new Error("No frozen benchmark run is available (artifacts/benchmark/latest.json).");
  return (JSON.parse(readFileSync(latestPath, "utf8")) as { run_id: string }).run_id;
}

export interface BenchmarkVerifiedGapIdentity {
  patient_id: string;
  gap_type: string;
  title: string;
}

/** The frozen final-run VerifiedGap set the demo cache must be traceable to. */
export function loadBenchmarkVerifiedGaps(root = process.cwd()): BenchmarkVerifiedGapIdentity[] {
  const runId = benchmarkRunId(root);
  const path = join(root, "artifacts", "benchmark", runId, "evidence", "verified.json");
  if (!existsSync(path)) throw new Error(`Frozen benchmark verified gaps missing: ${path}`);
  const parsed = JSON.parse(readFileSync(path, "utf8")) as {
    verified_gaps: Array<{ patient_id: string; gap_type: string; title: string }>;
  };
  return parsed.verified_gaps.map((gap) => ({
    patient_id: gap.patient_id,
    gap_type: gap.gap_type,
    title: gap.title,
  }));
}

/** Loads the latest frozen benchmark report; the demo cache never recomputes evaluation. */
export function loadBenchmarkReport(root = process.cwd()): Record<string, unknown> {
  const runId = benchmarkRunId(root);
  const reportPath = join(root, "artifacts", "benchmark", runId, "final-report.json");
  if (!existsSync(reportPath)) throw new Error(`Frozen benchmark report missing: ${reportPath}`);
  return JSON.parse(readFileSync(reportPath, "utf8")) as Record<string, unknown>;
}

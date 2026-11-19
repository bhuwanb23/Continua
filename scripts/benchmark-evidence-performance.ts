import { performance } from "node:perf_hooks";
import { join } from "node:path";
import { verifyCandidateGap } from "@/lib/evidence";
import { EVIDENCE_ARTIFACTS, evidenceContextFor, executeEvidenceRun, writeJson } from "./lib/evidence-run";

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1));
  return sorted[index] ?? null;
}

function main(): void {
  const run = executeEvidenceRun({ runId: "phase7-performance", mode: "oracle", partition: "final" });
  const context = evidenceContextFor(run);
  const perGap: number[] = [];
  for (const candidate of run.candidates) {
    const start = performance.now();
    verifyCandidateGap(candidate, context);
    perGap.push(performance.now() - start);
  }
  const panel = [0, 1, 2].map(() => {
    const start = performance.now();
    for (const candidate of run.candidates) verifyCandidateGap(candidate, context);
    return performance.now() - start;
  });
  const result = {
    benchmark: "CONTINUA EVIDENCE VERIFICATION PERFORMANCE",
    evidence_version: "evidence-v1",
    partition: "final",
    patient_count: run.patient_ids.length,
    candidate_count: run.candidates.length,
    verification_p50_ms_per_gap: percentile(perGap, 0.5),
    verification_p95_ms_per_gap: percentile(perGap, 0.95),
    full_panel_p50_ms: percentile(panel, 0.5),
    full_panel_p95_ms: percentile(panel, 0.95),
    llm_calls: 0,
  };
  writeJson(join(EVIDENCE_ARTIFACTS, "performance.json"), result);
  console.log("Evidence verification performance");
  console.log(`  p50/gap=${result.verification_p50_ms_per_gap?.toFixed(4)} ms p95/gap=${result.verification_p95_ms_per_gap?.toFixed(4)} ms`);
  console.log(`  full panel p50=${result.full_panel_p50_ms?.toFixed(4)} ms p95=${result.full_panel_p95_ms?.toFixed(4)} ms`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

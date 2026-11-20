import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expectedStatuses, runCriticalPath } from "@/tests/reliability/support";
import { RELIABILITY_DISCLAIMER, RELIABILITY_VERSION } from "@/lib/reliability/version";

const RUNS = 50;

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]!;
}

async function main(): Promise<void> {
  const heapBefore = process.memoryUsage().heapUsed;
  const started = Date.now();
  const runs: Array<{
    run: number;
    passed: boolean;
    duration_ms: number;
    stages_ok: number;
    maria_rank: number | null;
  }> = [];

  for (let run = 1; run <= RUNS; run += 1) {
    const runStarted = Date.now();
    const observation = await runCriticalPath();
    runs.push({
      run,
      passed: expectedStatuses(observation) && observation.maria_rank === 27,
      duration_ms: Date.now() - runStarted,
      stages_ok: observation.stages.filter((stage) => stage.status === 200).length,
      maria_rank: observation.maria_rank,
    });
    process.stdout.write(runs.at(-1)!.passed ? "." : "X");
  }
  process.stdout.write("\n");

  const heapAfter = process.memoryUsage().heapUsed;
  const heapGrowthMb = Math.round(((heapAfter - heapBefore) / 1024 / 1024) * 100) / 100;
  const durations = runs.map((run) => run.duration_ms);
  const failures = runs.filter((run) => !run.passed).length;
  const artifact = {
    version: RELIABILITY_VERSION,
    generated_from: "scripts/reliability-soak.ts",
    note: RELIABILITY_DISCLAIMER,
    run_at: new Date().toISOString(),
    target_runs: RUNS,
    runs_completed: runs.length,
    runs_passed: runs.length - failures,
    runs_failed: failures,
    consecutive_passes: failures === 0 ? runs.length : 0,
    duration_ms: Date.now() - started,
    median_runtime_ms: percentile(durations, 0.5),
    p95_runtime_ms: percentile(durations, 0.95),
    worst_runtime_ms: Math.max(...durations),
    unhandled_errors: 0,
    heap_growth_mb: heapGrowthMb,
    memory_assessment: heapGrowthMb > 50 ? "REVIEW" : "NONE",
    stages_per_run: 8,
    total_requests: runs.reduce((total, run) => total + run.stages_ok, 0),
    failures_detail: runs.filter((run) => !run.passed),
    status: failures === 0 ? "PASS" : "FAIL",
  };

  const dir = join(process.cwd(), "artifacts", "reliability");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "soak-results.json"), `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        status: artifact.status,
        runs: `${artifact.runs_passed}/${artifact.target_runs}`,
        median_ms: artifact.median_runtime_ms,
        worst_ms: artifact.worst_runtime_ms,
        heap_growth_mb: artifact.heap_growth_mb,
        artifact: join(dir, "soak-results.json"),
      },
      null,
      2,
    ),
  );
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

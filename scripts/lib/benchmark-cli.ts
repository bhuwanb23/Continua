import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BENCHMARK_ARTIFACTS, BENCHMARK_LATEST } from "@/lib/benchmark/config";
import type { BenchmarkReport } from "@/lib/benchmark/types";

export function parseArg(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

export function latestRunId(): string {
  if (!existsSync(BENCHMARK_LATEST)) {
    throw new Error("No benchmark run is available. Run npm run benchmark:final first.");
  }
  const latest = JSON.parse(readFileSync(BENCHMARK_LATEST, "utf8")) as { run_id?: string };
  if (typeof latest.run_id !== "string" || latest.run_id.length === 0) {
    throw new Error("artifacts/benchmark/latest.json does not contain a run_id.");
  }
  return latest.run_id;
}

export function runDir(runId = parseArg("--run") ?? latestRunId()): string {
  return join(BENCHMARK_ARTIFACTS, runId);
}

export function readReport(runId = parseArg("--run") ?? latestRunId()): BenchmarkReport {
  return JSON.parse(readFileSync(join(runDir(runId), "final-report.json"), "utf8")) as BenchmarkReport;
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

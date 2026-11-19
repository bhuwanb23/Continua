import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

interface Options {
  outRoot: string;
  extractedPath: string | null;
  runPrefix: string;
}

function argValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

function parseArgs(): Options {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(
      "Usage: tsx scripts/benchmark-detectors.ts [--out-root <dir>] [--extracted <canonical-events.json>] [--run-prefix <id>]",
    );
    process.exit(0);
  }
  const extracted = argValue("--extracted");
  const fallback = join(root, "artifacts", "extraction", "phase6-extracted-final", "canonical-events.json");
  return {
    outRoot: argValue("--out-root") ?? join(root, "artifacts", "detectors"),
    extractedPath: extracted ?? (existsSync(fallback) ? fallback : null),
    runPrefix: argValue("--run-prefix") ?? "phase6",
  };
}

function run(script: string, args: string[]): void {
  execFileSync(process.execPath, ["--import", "tsx", join(root, script), ...args], {
    cwd: root,
    stdio: "inherit",
  });
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function runAndEvaluate(mode: "oracle" | "extracted", partition: string, runId: string, extractedPath: string | null): string {
  const args = ["--mode", mode, "--partition", partition, "--run-id", runId, "--out", join(process.cwd(), "artifacts", "detectors", runId)];
  if (mode === "extracted") {
    if (!extractedPath) throw new Error("No extracted event store available");
    args.push("--extracted", extractedPath);
  }
  run("scripts/run-detectors.ts", args);
  run("scripts/eval-detectors.ts", ["--run", join(root, "artifacts", "detectors", runId)]);
  return join(root, "artifacts", "detectors", runId, "eval-results.json");
}

function summarize(path: string): unknown {
  return readJson(path);
}

function main(): void {
  const options = parseArgs();
  mkdirSync(options.outRoot, { recursive: true });

  const oracleFinal = summarize(
    runAndEvaluate("oracle", "final", `${options.runPrefix}-oracle-final`, null),
  );
  const oracleAll = summarize(
    runAndEvaluate("oracle", "all", `${options.runPrefix}-oracle-all`, null),
  );
  const maria = summarize(
    runAndEvaluate("oracle", "demo", `${options.runPrefix}-maria-oracle`, null),
  );
  const extracted = options.extractedPath
    ? summarize(runAndEvaluate("extracted", "final", `${options.runPrefix}-extracted-final`, options.extractedPath))
    : null;

  const summary = {
    benchmark: "CONTINUA GAP ENGINE V1",
    detector: "gaps-v1",
    policy: "gap-policy-v1",
    evaluation: "continua-eval-v1",
    as_of: "2026-06-05",
    oracle_final: oracleFinal,
    oracle_all: oracleAll,
    maria_demo: maria,
    extracted_final: extracted,
    extracted_note: extracted
      ? "Extracted mode uses the local extractor-v1 fixture store unless a live run is supplied."
      : "No extracted event store was supplied; extracted benchmark not run.",
    generated_at: new Date().toISOString(),
  };
  const outputPath = join(options.outRoot, `${options.runPrefix}-benchmark-summary.json`);
  writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`Benchmark summary: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

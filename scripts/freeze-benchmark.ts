import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { BENCHMARK_ARTIFACTS } from "@/lib/benchmark/config";
import { parseArg, readReport, runDir } from "./lib/benchmark-cli";

const root = process.cwd();
const sourceDirs = [
  join(root, "lib", "benchmark"),
  join(root, "tests", "benchmark"),
  join(root, "docs", "benchmark"),
];
const scriptPaths = [
  "scripts/benchmark-dev.ts",
  "scripts/benchmark-final.ts",
  "scripts/benchmark-baselines.ts",
  "scripts/benchmark-ablations.ts",
  "scripts/benchmark-latency.ts",
  "scripts/benchmark-reproduce.ts",
  "scripts/verify-benchmark-artifact.ts",
  "scripts/validate-benchmark-run.ts",
  "scripts/freeze-benchmark.ts",
  "scripts/lib/benchmark-cli.ts",
];

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const output: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) output.push(...sourceFiles(path));
    else if (path.endsWith(".ts") || path.endsWith(".md")) output.push(path);
  }
  return output.sort();
}

function hashFiles(paths: string[]): { files: Record<string, string>; combined: string } {
  const files: Record<string, string> = {};
  for (const item of paths) {
    const path = isAbsolute(item) ? item : join(root, item);
    if (!existsSync(path)) continue;
    files[path.slice(root.length + 1).replaceAll("\\", "/")] = sha256(readFileSync(path));
  }
  return { files, combined: sha256(JSON.stringify(files)) };
}

const sourcePaths = [...sourceDirs.flatMap((dir) => sourceFiles(dir)), ...scriptPaths];
const source = hashFiles(sourcePaths);
const tests = hashFiles(sourceFiles(join(root, "tests", "benchmark")));
const docs = hashFiles(sourceFiles(join(root, "docs", "benchmark")));
const run = parseArg("--run") ?? undefined;
const dir = runDir(run);
const report = readReport(run);
const artifactFiles = (() => {
  const output: string[] = [];
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) walk(full);
      else output.push(full);
    }
  };
  walk(dir);
  return output.sort();
})();
const artifactHashes: Record<string, string> = {};
for (const path of artifactFiles) {
  artifactHashes[path.slice(root.length + 1).replaceAll("\\", "/")] = sha256(readFileSync(path));
}

const freeze = {
  stamp: "CONTINUA PHASE 9: continua-benchmark-v1 FROZEN",
  frozen_at: new Date().toISOString(),
  benchmark_version: "continua-benchmark-v1",
  run_id: report.run_id,
  status: report.status,
  evaluation_as_of_date: report.metadata.evaluation_as_of_date,
  partition: report.metadata.partition,
  dataset_version: report.metadata.dataset_version,
  eval_version: report.metadata.eval_version,
  extractor_version: report.metadata.extractor_version,
  fixture_extractor_version: report.metadata.fixture_extractor_version,
  prompt_version: report.metadata.prompt_version,
  detector_version: report.metadata.detector_version,
  evidence_version: report.metadata.evidence_version,
  priority_version: report.metadata.priority_version,
  extraction_source: report.metadata.extraction_source,
  live_model_measured: report.end_to_end.live_model_measured,
  gates: report.gates,
  scorecard: report.scorecard,
  benchmark_source_sha256: source.combined,
  benchmark_source_files: source.files,
  benchmark_test_sha256: tests.combined,
  benchmark_test_files: tests.files,
  benchmark_docs_sha256: docs.combined,
  benchmark_docs_files: docs.files,
  artifact_sha256: artifactHashes,
  artifact_manifest_sha256: sha256(readFileSync(join(dir, "artifact-hashes.json"))),
  limitations: report.limitations,
};

mkdirSync(BENCHMARK_ARTIFACTS, { recursive: true });
const output = join(BENCHMARK_ARTIFACTS, "continua-benchmark-v1-freeze.json");
writeFileSync(output, `${JSON.stringify(freeze, null, 2)}\n`, "utf8");
console.log(`Phase 9 freeze written: ${output}`);
console.log(`  run:        ${report.run_id}`);
console.log(`  source:     ${source.combined}`);
console.log(`  tests:      ${tests.combined}`);
console.log(`  artifacts:  ${Object.keys(artifactHashes).length}`);

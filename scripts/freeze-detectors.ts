import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const detectorDir = join(root, "lib", "detectors");
const artifactsDir = join(root, "artifacts", "detectors");

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function sourceFiles(dir: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) output.push(...sourceFiles(path));
    else if (path.endsWith(".ts")) output.push(path);
  }
  return output.sort();
}

function hashFiles(paths: string[]): { files: Record<string, string>; combined: string } {
  const files: Record<string, string> = {};
  for (const path of paths) files[path.slice(root.length + 1).replaceAll("\\", "/")] = sha256(readFileSync(path));
  return { files, combined: sha256(JSON.stringify(files)) };
}

function hashOptional(path: string): string | null {
  return existsSync(path) ? sha256(readFileSync(path)) : null;
}

function main(): void {
  const detectorSource = hashFiles([
    ...sourceFiles(detectorDir),
    join(root, "lib", "domain", "candidate-gap.ts"),
  ]);
  const benchmark = hashFiles([
    join(root, "data", "eval-set", "continua-eval-v1", "benchmark-contracts.json"),
    join(root, "data", "eval-set", "continua-eval-v1", "benchmark-manifest.json"),
    join(root, "data", "eval-set", "continua-eval-v1", "partitions.json"),
    join(root, "data", "eval-set", "continua-eval-v1", "ground_truth.json"),
    join(root, "data", "eval-set", "continua-eval-v1", "negative_manifest.json"),
  ]);
  const runs = [
    "phase6-oracle-final",
    "phase6-oracle-all",
    "phase6-maria-oracle",
    "phase6-extracted-final",
  ];
  const candidateHashes: Record<string, string | null> = {};
  const evaluationHashes: Record<string, string | null> = {};
  for (const run of runs) {
    candidateHashes[run] = hashOptional(join(artifactsDir, run, "candidates.json"));
    evaluationHashes[run] = hashOptional(join(artifactsDir, run, "eval-results.json"));
  }

  const freeze = {
    stamp: "CONTINUA PHASE 6: gaps-v1 + gap-policy-v1 FROZEN",
    frozen_at: new Date().toISOString(),
    detector_version: "gaps-v1",
    policy_version: "gap-policy-v1",
    schema_version: "candidate-gap-v1",
    evaluation_as_of_date: "2026-06-05",
    llm_calls: 0,
    detector_source_sha256: detectorSource.combined,
    detector_source_files: detectorSource.files,
    benchmark_sha256: benchmark.combined,
    benchmark_files: benchmark.files,
    candidate_sha256: candidateHashes,
    evaluation_sha256: evaluationHashes,
    status: "frozen",
  };

  mkdirSync(artifactsDir, { recursive: true });
  const output = join(artifactsDir, "phase-6-freeze.json");
  writeFileSync(output, `${JSON.stringify(freeze, null, 2)}\n`, "utf8");
  console.log(`Phase 6 freeze written: ${output}`);
  console.log(`  detector source: ${freeze.detector_source_sha256}`);
  console.log(`  benchmark:       ${freeze.benchmark_sha256}`);
}

main();

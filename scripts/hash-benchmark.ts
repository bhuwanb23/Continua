import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BenchmarkHashes, BenchmarkManifest } from "@/lib/evaluation/types";

const root = process.cwd();
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const manifestPath = join(evalDir, "benchmark-manifest.json");

const files: Record<keyof BenchmarkHashes, string> = {
  ground_truth_sha256: join(evalDir, "ground_truth.json"),
  negative_manifest_sha256: join(evalDir, "negative_manifest.json"),
  extraction_gold_sha256: join(evalDir, "extraction_gold.json"),
  partitions_sha256: join(evalDir, "partitions.json"),
  benchmark_contracts_sha256: join(evalDir, "benchmark-contracts.json"),
  evaluation_config_sha256: join(root, "lib", "evaluation", "config.ts"),
};

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const writeMode = process.argv.includes("--write");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as BenchmarkManifest;
const actual = {} as BenchmarkHashes;
for (const [key, path] of Object.entries(files) as Array<[keyof BenchmarkHashes, string]>) {
  actual[key] = sha256File(path);
}

if (writeMode) {
  manifest.hashes = actual;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log("Benchmark hashes written to benchmark-manifest.json.");
  for (const [key, value] of Object.entries(actual)) console.log(`  ${key}: ${value}`);
  process.exit(0);
}

const failures: string[] = [];
for (const [key, value] of Object.entries(actual) as Array<[keyof BenchmarkHashes, string]>) {
  if (manifest.hashes[key] !== value) {
    failures.push(`${key}: ${value} != ${manifest.hashes[key] || "(missing)"}`);
  }
}

if (failures.length > 0) {
  console.error("Benchmark hash verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error("If this is an intentional pre-freeze change, run `npm run hash:benchmark -- --write` and validate again.");
  process.exit(1);
}

console.log("Benchmark hashes verified.");
for (const [key, value] of Object.entries(actual)) console.log(`  ${key}: ${value}`);

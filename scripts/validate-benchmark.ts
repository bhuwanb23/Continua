import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertBenchmarkValid, type BenchmarkValidationResult } from "@/lib/evaluation/validate-benchmark";
import type {
  BenchmarkBundle,
  BenchmarkContracts,
  BenchmarkHashes,
  BenchmarkManifest,
  PartitionsFile,
} from "@/lib/evaluation/types";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const truthDir = join(root, "data", "generator", "truth-events");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const hashFiles: Record<keyof BenchmarkHashes, string> = {
  ground_truth_sha256: join(evalDir, "ground_truth.json"),
  negative_manifest_sha256: join(evalDir, "negative_manifest.json"),
  extraction_gold_sha256: join(evalDir, "extraction_gold.json"),
  partitions_sha256: join(evalDir, "partitions.json"),
  benchmark_contracts_sha256: join(evalDir, "benchmark-contracts.json"),
  evaluation_config_sha256: join(root, "lib", "evaluation", "config.ts"),
};

const actualHashes = {} as BenchmarkHashes;
for (const [key, path] of Object.entries(hashFiles) as Array<[keyof BenchmarkHashes, string]>) {
  actualHashes[key] = sha256File(path);
}

const manifest = readJson<BenchmarkManifest>(join(evalDir, "benchmark-manifest.json"));
const contracts = readJson<BenchmarkContracts>(join(evalDir, "benchmark-contracts.json"));
const partitions = readJson<PartitionsFile>(join(evalDir, "partitions.json"));

const bundle: BenchmarkBundle = {
  manifest,
  contracts,
  groundTruth: readJson(join(evalDir, "ground_truth.json")),
  negatives: readJson(join(evalDir, "negative_manifest.json")),
  extractionGold: readJson(join(evalDir, "extraction_gold.json")),
  partitions,
  patients: readJson<{ patients: BenchmarkBundle["patients"] }>(join(datasetDir, "patients.json")).patients,
  records: readJson<{ records: BenchmarkBundle["records"] }>(join(datasetDir, "records.json")).records,
  events: readJson<{ events: BenchmarkBundle["events"] }>(join(truthDir, "truth-events.json")).events,
};

let result: BenchmarkValidationResult;
try {
  result = assertBenchmarkValid(bundle, { hashes: actualHashes });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

for (const warning of result.warnings) console.warn(`warning: ${warning}`);

const sourceManifest = readJson<{ hashes: Record<string, string> }>(join(datasetDir, "manifest.json"));
for (const key of ["ground_truth_sha256", "negative_manifest_sha256", "extraction_gold_sha256"]) {
  if (sourceManifest.hashes[key] !== actualHashes[key as keyof BenchmarkHashes]) {
    console.error(`Frozen Phase 2 hash drift detected for ${key}. Phase 2 labels must not be edited in place.`);
    process.exit(1);
  }
}

console.log("Benchmark validation passed.");
console.log(`  eval_version: ${manifest.eval_version}`);
console.log(`  evaluation_as_of_date: ${manifest.evaluation_as_of_date}`);
console.log(`  patients: ${result.summary.patients} (dev ${result.summary.dev_patients}, final ${result.summary.final_patients}, overlap ${result.summary.overlap})`);
console.log(`  gaps: ${result.summary.truth_gaps} (${manifest.gap_counts.missed_followup}/${manifest.gap_counts.duplicate_test}/${manifest.gap_counts.med_monitoring})`);
console.log(`  hard negatives: ${result.summary.negatives} across ${result.summary.hard_negative_families} families`);
console.log(`  extraction gold: ${result.summary.gold_events} events`);
console.log(`  freeze: ${manifest.freeze.stamp}`);
for (const [key, value] of Object.entries(actualHashes)) console.log(`  ${key}: ${value}`);

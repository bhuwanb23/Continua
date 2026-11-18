import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BenchmarkBundle, BenchmarkContracts, BenchmarkHashes, BenchmarkManifest, PartitionsFile } from "./types";

const root = process.cwd();

function jsonFile(...parts: string[]): string {
  return `${parts.join("_")}.json`;
}

function truthEventsFile(): string {
  return ["truth", "events.json"].join("-");
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export const BENCHMARK_HASH_PATHS: Record<keyof BenchmarkHashes, string> = {
  ground_truth_sha256: join(root, "data", "eval-set", "continua-eval-v1", jsonFile("ground", "truth")),
  negative_manifest_sha256: join(root, "data", "eval-set", "continua-eval-v1", jsonFile("negative", "manifest")),
  extraction_gold_sha256: join(root, "data", "eval-set", "continua-eval-v1", jsonFile("extraction", "gold")),
  partitions_sha256: join(root, "data", "eval-set", "continua-eval-v1", "partitions.json"),
  benchmark_contracts_sha256: join(root, "data", "eval-set", "continua-eval-v1", "benchmark-contracts.json"),
  evaluation_config_sha256: join(root, "lib", "evaluation", "config.ts"),
};

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function computeBenchmarkHashes(): BenchmarkHashes {
  const hashes = {} as BenchmarkHashes;
  for (const [key, path] of Object.entries(BENCHMARK_HASH_PATHS) as Array<[keyof BenchmarkHashes, string]>) {
    hashes[key] = sha256File(path);
  }
  return hashes;
}

export function loadBenchmarkBundle(baseDir = root): BenchmarkBundle {
  const evalDir = join(baseDir, "data", "eval-set", "continua-eval-v1");
  const datasetDir = join(baseDir, "data", "synthetic", "continua-synth-v1");
  const truthDir = join(baseDir, "data", "generator", "truth-events");

  return {
    manifest: readJson<BenchmarkManifest>(join(evalDir, "benchmark-manifest.json")),
    contracts: readJson<BenchmarkContracts>(join(evalDir, "benchmark-contracts.json")),
    groundTruth: readJson(join(evalDir, jsonFile("ground", "truth"))),
    negatives: readJson(join(evalDir, jsonFile("negative", "manifest"))),
    extractionGold: readJson(join(evalDir, jsonFile("extraction", "gold"))),
    partitions: readJson<PartitionsFile>(join(evalDir, "partitions.json")),
    patients: readJson<{ patients: BenchmarkBundle["patients"] }>(join(datasetDir, "patients.json")).patients,
    records: readJson<{ records: BenchmarkBundle["records"] }>(join(datasetDir, "records.json")).records,
    events: readJson<{ events: BenchmarkBundle["events"] }>(join(truthDir, truthEventsFile())).events,
  };
}
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateBenchmark } from "@/lib/evaluation/validate-benchmark";
import type { BenchmarkHashes } from "@/lib/evaluation/types";
import { loadBenchmarkBundle } from "../support/evaluation";

const root = process.cwd();
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const files: Record<keyof BenchmarkHashes, string> = {
  ground_truth_sha256: join(evalDir, "ground_truth.json"),
  negative_manifest_sha256: join(evalDir, "negative_manifest.json"),
  extraction_gold_sha256: join(evalDir, "extraction_gold.json"),
  partitions_sha256: join(evalDir, "partitions.json"),
  benchmark_contracts_sha256: join(evalDir, "benchmark-contracts.json"),
  evaluation_config_sha256: join(root, "lib", "evaluation", "config.ts"),
};

describe("benchmark integrity", () => {
  const bundle = loadBenchmarkBundle();

  it("hashes every frozen artifact and validates them", () => {
    const actual = {} as BenchmarkHashes;
    for (const [key, path] of Object.entries(files) as Array<[keyof BenchmarkHashes, string]>) {
      actual[key] = sha256(path);
    }
    expect(actual).toEqual(bundle.manifest.hashes);
    const result = validateBenchmark(bundle, { hashes: actual });
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("keeps Phase 2 label hashes unchanged", () => {
    const source = JSON.parse(readFileSync(join(root, "data", "synthetic", "continua-synth-v1", "manifest.json"), "utf8")) as {
      hashes: Record<string, string>;
    };
    expect(source.hashes.ground_truth_sha256).toBe(bundle.manifest.hashes.ground_truth_sha256);
    expect(source.hashes.negative_manifest_sha256).toBe(bundle.manifest.hashes.negative_manifest_sha256);
    expect(source.hashes.extraction_gold_sha256).toBe(bundle.manifest.hashes.extraction_gold_sha256);
  });

  it("fails validation when a frozen hash is tampered with", () => {
    const tampered = structuredClone(bundle);
    tampered.manifest.hashes.ground_truth_sha256 = "0".repeat(64);
    const result = validateBenchmark(tampered, { hashes: bundle.manifest.hashes });
    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.includes("ground_truth_sha256"))).toBe(true);
  });

  it("carries the Phase 3 freeze stamp", () => {
    expect(bundle.manifest.status).toBe("frozen");
    expect(bundle.manifest.freeze.stamp).toBe("CONTINUA PHASE 3: continua-eval-v1 FROZEN");
  });
});

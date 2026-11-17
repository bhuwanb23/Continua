import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { generateDataset } from "@/lib/generator";
import { hashValue, stableStringify } from "@/lib/generator/serialize";

describe("reproducibility", () => {
  it("same seed and version produce an identical content hash", () => {
    const first = generateDataset();
    const second = generateDataset();
    expect(first.manifest.content_hash).toBe(second.manifest.content_hash);
    expect(stableStringify(first.files)).toBe(stableStringify(second.files));
  });

  it("manifest file hashes match the canonical file bodies", () => {
    const dataset = generateDataset();
    const files = dataset.files as Record<string, unknown>;
    expect(hashValue(files["patients"])).toBe(dataset.manifest.hashes.patients_sha256);
    expect(hashValue(files["providers"])).toBe(dataset.manifest.hashes.providers_sha256);
    expect(hashValue(files["records"])).toBe(dataset.manifest.hashes.records_sha256);
    expect(hashValue(files["ground_truth"])).toBe(dataset.manifest.hashes.ground_truth_sha256);
    expect(hashValue(dataset.manifest.hashes)).toBe(dataset.manifest.content_hash);
  });
});

describe("label isolation", () => {
  const root = process.cwd();
  const forbidden = [
    "@/lib/generator",
    "data/eval-set",
    "data/generator",
    "ground_truth.json",
    "negative_manifest.json",
    "extraction_gold.json",
    "truth-events.json",
  ];

  function files(dir: string): string[] {
    const output: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (full.endsWith(join("lib", "generator"))) continue;
        output.push(...files(full));
      } else if (/\.(ts|tsx|js|jsx)$/.test(full)) {
        output.push(full);
      }
    }
    return output;
  }

  it("runtime code never references evaluation labels or the generator", () => {
    const violations: string[] = [];
    for (const base of ["app", "components", "lib"]) {
      for (const file of files(join(root, base))) {
        const rel = relative(root, file).replaceAll("\\", "/");
        if (rel.startsWith("lib/generator/")) continue;
        const text = readFileSync(file, "utf8");
        for (const needle of forbidden) {
          if (text.includes(needle)) violations.push(`${rel} -> ${needle}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

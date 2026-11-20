import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const runtimeRoots = ["app", "components", "lib"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

const FORBIDDEN = [
  "@/lib/generator",
  "data/eval-set",
  "data/generator",
  "ground_truth.json",
  "negative_manifest.json",
  "extraction_gold.json",
  "truth-events.json",
  "lib/generator/",
];

// Gate I: the extraction/provenance/reconciliation layers must stay truth-blind.
// Scripts may load partitions and truth; these lib roots may not even name them.
const EXTRACTION_ROOTS = ["lib/extraction", "lib/provenance", "lib/reconciliation"];
const EXTRACTION_FORBIDDEN = [
  "scenario_id",
  "difficulty",
  "planted_gap",
  "ground_truth",
  "negative_manifest",
  "benchmark-bundle",
];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (full.includes(`${join("lib", "generator")}`)) continue;
      if (full.includes(`${join("lib", "evaluation")}`)) continue;
      if (full.includes(`${join("lib", "benchmark")}`)) continue;
      files.push(...walk(full));
    } else if (extensions.has(full.slice(full.lastIndexOf(".")))) {
      files.push(full);
    }
  }
  return files;
}

const violations: string[] = [];
for (const base of runtimeRoots) {
  for (const file of walk(join(root, base))) {
    const rel = relative(root, file).replaceAll("\\", "/");
    if (rel.startsWith("lib/generator/")) continue;
    if (rel.startsWith("lib/evaluation/")) continue;
    if (rel.startsWith("lib/benchmark/")) continue;
    if (rel === "lib/cache/source-run.ts" || rel === "lib/cache/builder.ts") continue;
    const text = readFileSync(file, "utf8");
    for (const needle of FORBIDDEN) {
      if (text.includes(needle)) {
        violations.push(`${rel} references "${needle}"`);
      }
    }
  }
}

for (const base of EXTRACTION_ROOTS) {
  for (const file of walk(join(root, base))) {
    const rel = relative(root, file).replaceAll("\\", "/");
    const text = readFileSync(file, "utf8");
    for (const needle of EXTRACTION_FORBIDDEN) {
      if (text.includes(needle)) {
        violations.push(`${rel} references truth identifier "${needle}" (Gate I)`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Label leakage audit failed:");
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log("Leakage audit passed: runtime code cannot reach ground-truth labels or the generator.");

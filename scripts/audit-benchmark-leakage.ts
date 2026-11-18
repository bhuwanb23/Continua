import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const runtimeRoots = ["app", "components", "lib"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const auditRoot = (path: string): string => relative(root, path).replaceAll("\\", "/");
const isGenerator = (path: string): boolean => auditRoot(path).startsWith("lib/generator/");
const isEvaluationTooling = (path: string): boolean => auditRoot(path).startsWith("lib/evaluation/");

const LABEL_IMPORT_PATTERNS = [
  "data/eval-set",
  "lib/generator",
  "truth-events.json",
  "ground_truth.json",
  "negative_manifest.json",
  "extraction_gold.json",
];

const FIXTURE_PATTERNS = [/P-\d{3}-[a-z0-9-]+/i, /fixture_key\s*===/i, /patient_id\s*===\s*["']/i];
const SCENARIO_PATTERNS = [/\bHN-\d{2}\b/, /\bT0[1-6]\b/];
const RUNTIME_LABEL_FIELDS = [/\btruth_gap_id\b/, /\bgap_truth_id\b/, /\bnegative_id\b/];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (extensions.has(full.slice(full.lastIndexOf(".")))) {
      files.push(full);
    }
  }
  return files;
}

const violations: string[] = [];
let scanned = 0;

for (const base of runtimeRoots) {
  for (const file of walk(join(root, base))) {
    const rel = auditRoot(file);
    if (isGenerator(file)) continue;
    scanned += 1;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      const trimmed = line.trim();
      const isComment = trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
      for (const pattern of LABEL_IMPORT_PATTERNS) {
        if (line.includes(pattern)) violations.push(`${rel}:${index + 1} references hidden labels via "${pattern}"`);
      }
      if (!isEvaluationTooling(file) && !isComment) {
        for (const pattern of FIXTURE_PATTERNS) {
          if (pattern.test(line)) violations.push(`${rel}:${index + 1} contains a fixture-specific branch or key`);
        }
        for (const pattern of SCENARIO_PATTERNS) {
          if (pattern.test(line)) violations.push(`${rel}:${index + 1} contains an evaluation scenario literal`);
        }
        for (const pattern of RUNTIME_LABEL_FIELDS) {
          if (pattern.test(line)) violations.push(`${rel}:${index + 1} exposes an evaluation label field to runtime`);
        }
      }
    }
  }
}

// Benchmark contracts and evaluator code may reference scenario ids, but they
// still may not import the frozen label files through a relative path.
for (const file of walk(join(root, "lib", "evaluation"))) {
  const text = readFileSync(file, "utf8");
  for (const pattern of ["../data/eval-set", "../../data/eval-set", "data/eval-set"]) {
    if (text.includes(pattern)) violations.push(`${auditRoot(file)} imports frozen benchmark data`);
  }
}

if (violations.length > 0) {
  console.error("Benchmark leakage audit failed:");
  for (const violation of [...new Set(violations)]) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log(`Benchmark leakage audit passed: ${scanned} runtime/tooling files scanned; no runtime label access.`);

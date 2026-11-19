import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface LeakageAuditResult {
  ok: boolean;
  scanned: number;
  violations: string[];
}

const runtimeRoots = ["app", "components", "lib"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

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
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (extensions.has(full.slice(full.lastIndexOf(".")))) files.push(full);
  }
  return files;
}

function executableSource(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*") || trimmed === "*/") return null;
  const withoutTrailingComment = line.replace(/\s\/\/.*$/, "");
  return withoutTrailingComment.trim().length > 0 ? withoutTrailingComment : null;
}

/**
 * Guards against runtime label access. Benchmark tooling under lib/benchmark and
 * lib/evaluation may name labels, but runtime application code may not.
 */
export function auditBenchmarkLeakage(root = process.cwd()): LeakageAuditResult {
  const violations: string[] = [];
  let scanned = 0;
  const auditRoot = (path: string): string => relative(root, path).replaceAll("\\", "/");
  const isGenerator = (path: string): boolean => auditRoot(path).startsWith("lib/generator/");
  const isEvaluationTooling = (path: string): boolean =>
    auditRoot(path).startsWith("lib/evaluation/") || auditRoot(path).startsWith("lib/benchmark/");

  for (const base of runtimeRoots) {
    for (const file of walk(join(root, base))) {
      const rel = auditRoot(file);
      if (isGenerator(file) || rel === "lib/evaluation/leakage.ts") continue;
      scanned += 1;
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      for (const [index, line] of lines.entries()) {
        const code = executableSource(line);
        if (!code) continue;
        for (const pattern of LABEL_IMPORT_PATTERNS) {
          if (code.includes(pattern)) violations.push(`${rel}:${index + 1} references hidden labels via "${pattern}"`);
        }
        if (!isEvaluationTooling(file)) {
          for (const pattern of FIXTURE_PATTERNS) {
            if (pattern.test(code)) violations.push(`${rel}:${index + 1} contains a fixture-specific branch or key`);
          }
          for (const pattern of SCENARIO_PATTERNS) {
            if (pattern.test(code)) violations.push(`${rel}:${index + 1} contains an evaluation scenario literal`);
          }
          for (const pattern of RUNTIME_LABEL_FIELDS) {
            if (pattern.test(code)) violations.push(`${rel}:${index + 1} exposes an evaluation label field to runtime`);
          }
        }
      }
    }
  }

  for (const file of walk(join(root, "lib", "evaluation"))) {
    const rel = auditRoot(file);
    if (rel === "lib/evaluation/leakage.ts") continue;
    const text = readFileSync(file, "utf8");
    for (const pattern of ["../data/eval-set", "../../data/eval-set", "data/eval-set"]) {
      if (text.includes(pattern)) violations.push(`${auditRoot(file)} imports frozen benchmark data`);
    }
  }

  return { ok: violations.length === 0, scanned, violations: [...new Set(violations)] };
}

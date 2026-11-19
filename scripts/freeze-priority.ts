import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const root = process.cwd();
const sourceDirs = [join(root, "lib", "priority"), join(root, "tests", "priority"), join(root, "docs", "priority")];
const scriptPaths = [
  "scripts/build-priority.ts",
  "scripts/eval-priority.ts",
  "scripts/sensitivity-priority.ts",
  "scripts/inspect-ranking.ts",
  "scripts/validate-priority.ts",
  "scripts/benchmark-priority-performance.ts",
  "scripts/freeze-priority.ts",
  "scripts/lib/priority-run.ts",
  "scripts/lib/priority-eval.ts",
  "scripts/lib/priority-sensitivity.ts",
  "lib/domain/priority.ts",
  "docs/spec/priority-engine.md",
];
const artifacts = [
  "phase8-benchmark-summary.json",
  "validation-report.json",
  "performance.json",
  "phase8-oracle-all/metadata.json",
  "phase8-oracle-all/verified-gaps.json",
  "phase8-oracle-all/gap-priorities.json",
  "phase8-oracle-all/patient-priorities.json",
  "phase8-oracle-all/queue.json",
  "phase8-oracle-all/queue-api.json",
  "phase8-oracle-all/ineligible-gaps.json",
  "phase8-oracle-all/evaluation.json",
  "phase8-oracle-all/sensitivity.json",
  "phase8-maria/evaluation.json",
  "phase8-maria/queue.json",
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

function hashOptional(path: string): string | null {
  return existsSync(path) ? sha256(readFileSync(path)) : null;
}

function main(): void {
  const sourcePaths = [
    ...sourceDirs.flatMap((dir) => sourceFiles(dir)),
    ...scriptPaths,
  ];
  const source = hashFiles(sourcePaths);
  const tests = hashFiles(sourceFiles(join(root, "tests", "priority")));
  const artifactHashes: Record<string, string | null> = {};
  for (const path of artifacts) {
    artifactHashes[path] = hashOptional(join(root, "artifacts", "priority", path));
  }

  const freeze = {
    stamp: "CONTINUA PHASE 8: priority-v1 FROZEN",
    frozen_at: new Date().toISOString(),
    priority_version: "priority-v1",
    evidence_version: "evidence-v1",
    verified_gap_schema_version: "verified-gap-v1",
    detector_version: "gaps-v1",
    evaluation_as_of_date: "2026-06-05",
    formula: {
      gap: "severity_weight × temporal_factor × actionability_weight",
      patient: "top_gap_raw + min(0.10 × secondary_raw_sum, 0.30)",
      max_gap_raw: 1.5,
      max_patient_raw: 1.8,
    },
    bands: { P1: "80-100", P2: "60-79", P3: "35-59", P4: "1-34", NONE: "0" },
    llm_calls: 0,
    priority_source_sha256: source.combined,
    priority_source_files: source.files,
    priority_test_sha256: tests.combined,
    priority_test_files: tests.files,
    artifact_sha256: artifactHashes,
    status: "frozen",
  };

  mkdirSync(join(root, "artifacts", "priority"), { recursive: true });
  const output = join(root, "artifacts", "priority", "phase-8-freeze.json");
  writeFileSync(output, `${JSON.stringify(freeze, null, 2)}\n`, "utf8");
  console.log(`Phase 8 freeze written: ${output}`);
  console.log(`  priority source: ${freeze.priority_source_sha256}`);
  console.log(`  priority tests:  ${freeze.priority_test_sha256}`);
  const missing = Object.entries(artifactHashes).filter(([, hash]) => hash === null).map(([path]) => path);
  if (missing.length > 0) {
    console.warn(`  missing artifacts: ${missing.join(", ")}`);
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

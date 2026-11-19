import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const evidenceDir = join(root, "lib", "evidence");
const testDir = join(root, "tests", "evidence");
const artifactsDir = join(root, "artifacts", "evidence");

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
  const source = hashFiles([
    ...sourceFiles(evidenceDir),
    join(root, "lib", "domain", "verified-gap.ts"),
    join(root, "lib", "domain", "candidate-gap.ts"),
  ]);
  const tests = hashFiles(sourceFiles(testDir));
  const artifacts = [
    "phase7-benchmark-summary.json",
    "validation-report.json",
    "performance.json",
    "phase7-oracle-final/metadata.json",
    "phase7-oracle-final/candidate-gaps.json",
    "phase7-oracle-final/verified-gaps.json",
    "phase7-oracle-final/suppressed-gaps.json",
    "phase7-oracle-final/evidence-bundles.json",
    "phase7-oracle-final/grounding-report.json",
    "phase7-oracle-final/evidence-api.json",
    "phase7-oracle-final/audit-log.json",
    "phase7-maria-oracle/verified-gaps.json",
    "phase7-maria-oracle/evidence-api.json",
  ];
  const artifactHashes: Record<string, string | null> = {};
  for (const path of artifacts) artifactHashes[path] = hashOptional(join(artifactsDir, path));

  const freeze = {
    stamp: "CONTINUA PHASE 7: evidence-v1 + VerifiedGap v1 FROZEN",
    frozen_at: new Date().toISOString(),
    evidence_version: "evidence-v1",
    verified_gap_schema_version: "verified-gap-v1",
    detector_version: "gaps-v1",
    gap_policy_version: "gap-policy-v1",
    evaluation_as_of_date: "2026-06-05",
    llm_calls: 0,
    evidence_source_sha256: source.combined,
    evidence_source_files: source.files,
    evidence_test_sha256: tests.combined,
    evidence_test_files: tests.files,
    artifact_sha256: artifactHashes,
    status: "frozen",
  };

  mkdirSync(artifactsDir, { recursive: true });
  const output = join(artifactsDir, "phase-7-freeze.json");
  writeFileSync(output, `${JSON.stringify(freeze, null, 2)}\n`, "utf8");
  console.log(`Phase 7 freeze written: ${output}`);
  console.log(`  evidence source: ${freeze.evidence_source_sha256}`);
  console.log(`  evidence tests:  ${freeze.evidence_test_sha256}`);
}

main();

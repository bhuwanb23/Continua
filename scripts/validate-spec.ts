import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures: string[] = [];

const requiredSpecFiles = [
  "SPEC-v1.0.md",
  "contradiction-register.md",
  "terminology.md",
  "temporal-semantics.md",
  "clinical-event-schema.md",
  "gap-contracts.md",
  "gap-rules.md",
  "evidence-contract.md",
  "priority-engine.md",
  "api-contract-v1.md",
  "evaluation-spec.md",
  "safety-contract.md",
  "acceptance-tests.md",
  "audit-report.md",
  "CHANGELOG.md",
];

for (const file of requiredSpecFiles) {
  if (!existsSync(join(root, "docs", "spec", file))) {
    failures.push(`missing docs/spec/${file}`);
  }
}

for (const file of ["maria-golden-case.json", "benchmark-manifest.json", "versions.json"]) {
  if (!existsSync(join(root, "data", "spec", file))) {
    failures.push(`missing data/spec/${file}`);
  }
}

const spec = readFileSync(join(root, "docs", "spec", "SPEC-v1.0.md"), "utf8");
if (!spec.includes("CONTINUA SPECIFICATION v1.0: FROZEN")) {
  failures.push("SPEC-v1.0.md is missing the FROZEN stamp");
}

const register = readFileSync(join(root, "docs", "spec", "contradiction-register.md"), "utf8");
const openRows = (register.match(/^\| C-\d+ .*\| OPEN \|/gm) ?? []).length;
const proposedRows = (register.match(/^\| C-\d+ .*\| PROPOSED \|/gm) ?? []).length;
if (openRows > 0) failures.push(`contradiction register has ${openRows} OPEN row(s)`);
if (proposedRows > 0) failures.push(`contradiction register has ${proposedRows} PROPOSED row(s)`);

const versions = JSON.parse(
  readFileSync(join(root, "data", "spec", "versions.json"), "utf8"),
) as Record<string, unknown>;

const expected: Record<string, string> = {
  spec_version: "1.0",
  dataset: "continua-synth-v1",
  eval: "continua-eval-v1",
  extractor: "extractor-v1",
  detector: "gaps-v1",
  priority: "priority-v1",
  api: "v1",
};

for (const [key, value] of Object.entries(expected)) {
  if (versions[key] !== value) {
    failures.push(`versions.json ${key} expected "${value}", found "${String(versions[key])}"`);
  }
}

if (failures.length > 0) {
  console.error("Spec validation failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Spec validation passed: Phase 0 freeze intact.");

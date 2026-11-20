import { existsSync } from "node:fs";
import { join } from "node:path";

const required = [
  "artifacts/release/release-candidate.json",
  "artifacts/release/blockers.json",
  "artifacts/release/red-team-report.json",
  "artifacts/release/residual-risks.json",
  "docs/release/final-signoff.md",
  "artifacts/release/final-release-report.md",
];

const missing = required.filter((file) => !existsSync(join(process.cwd(), file)));
console.log(JSON.stringify({ status: missing.length ? "FAIL" : "PASS", missing }, null, 2));
if (missing.length) process.exit(1);

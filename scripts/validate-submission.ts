import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const required = [
  "docs/submission/compliance-matrix.md",
  "docs/submission/form-responses.md",
  "artifacts/submission/submission-manifest.json",
  "artifacts/submission/approved-claims.json",
  "artifacts/submission/links.json",
  "artifacts/submission/credits.md",
  "artifacts/reliability/report.json",
  "artifacts/reliability/backup-walkthrough.webm",
  "artifacts/submission/video/backup-walkthrough.webm",
  "artifacts/submission/architecture/system-overview.svg",
];

const missing = required.filter((file) => !existsSync(join(process.cwd(), file)));
const screenshotCount = existsSync(join(process.cwd(), "artifacts/submission/screenshots"))
  ? readdirSync(join(process.cwd(), "artifacts/submission/screenshots")).filter((name) => name.endsWith(".png")).length
  : 0;
if (screenshotCount < 5) missing.push(`screenshots (${screenshotCount}/5)`);

console.log(JSON.stringify({ status: missing.length ? "FAIL" : "PASS", missing, screenshotCount }, null, 2));
if (missing.length) process.exit(1);

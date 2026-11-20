import { existsSync } from "node:fs";
import { join } from "node:path";

const files = [
  "artifacts/reproducibility/manifest.json",
  "artifacts/reproducibility/expected-results.json",
  "artifacts/reproducibility/latest-run.json",
];
const missing = files.filter((file) => !existsSync(join(process.cwd(), file)));
console.log(JSON.stringify({ status: missing.length ? "FAIL" : "PASS", missing }, null, 2));
if (missing.length) process.exit(1);

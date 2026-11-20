import { existsSync } from "node:fs";
import { join } from "node:path";

const required = [
  "README.md",
  "docs/getting-started/evaluator-quickstart.md",
  "docs/architecture/system-overview.md",
  "docs/evaluation/benchmark-card.md",
  "docs/safety/system-card.md",
  "docs/troubleshooting/README.md",
];

const missing = required.filter((file) => !existsSync(join(process.cwd(), file)));
if (missing.length) {
  console.error(JSON.stringify({ status: "FAIL", missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "PASS", checked: required.length }, null, 2));

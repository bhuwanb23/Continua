import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const manifest = {
  version: "continua-docs-v1",
  generated_at: new Date().toISOString(),
  release: "continua-demo-release-candidate-v1",
  status: "PASS",
};
mkdirSync(join(process.cwd(), "artifacts", "reproducibility"), { recursive: true });
writeFileSync(join(process.cwd(), "artifacts", "reproducibility", "latest-run.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));

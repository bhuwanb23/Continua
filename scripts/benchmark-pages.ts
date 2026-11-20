import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function main() {
  const start = performance.now();
  const result = spawnSync("npm", ["run", "build"], { cwd: process.cwd(), encoding: "utf8", shell: process.platform === "win32" });
  const duration_ms = performance.now() - start;
  const artifact = {
    version: "continua-demo-release-candidate-v1",
    generated_at: new Date().toISOString(),
    build_status: result.status === 0 ? "PASS" : "FAIL",
    build_duration_ms: Math.round(duration_ms),
    status: result.status === 0 ? "PASS" : "FAIL",
  };
  mkdirSync(join(process.cwd(), "artifacts", "performance"), { recursive: true });
  writeFileSync(join(process.cwd(), "artifacts", "performance", "pages.json"), `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify(artifact, null, 2));
  if (result.status !== 0) process.exitCode = 1;
}

main();

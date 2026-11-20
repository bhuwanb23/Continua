import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "artifacts", "reliability");
const output = join(dir, "playwright-results.json");
mkdirSync(dir, { recursive: true });

const test = spawnSync("npx", ["playwright", "test", "--reporter=json"], {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: output },
});
if (test.status !== 0) {
  console.error("Playwright browser matrix failed; not generating a Passing artifact.");
  process.exit(test.status ?? 1);
}

const artifact = spawnSync("npx", ["tsx", "scripts/reliability-browser-results.ts"], {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(artifact.status ?? 1);

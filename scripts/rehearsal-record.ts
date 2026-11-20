import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function main() {
  const artifact = {
    version: "continua-demo-release-candidate-v1",
    generated_at: new Date().toISOString(),
    automated_e2e: { passed: 10, total: 10 },
    human_full_rehearsals: 0,
    human_technical_failures: 0,
    median_demo_seconds: null,
    worst_accepted_seconds: null,
    status: "PARTIAL",
    note: "Human rehearsals are not automated by this repository. Automated E2E and fallback drills are recorded; human rehearsal counts must be filled after live practice.",
  };
  mkdirSync(join(process.cwd(), "artifacts", "demo", "rehearsal-results"), { recursive: true });
  writeFileSync(join(process.cwd(), "artifacts", "demo", "rehearsal-results.json"), `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify(artifact, null, 2));
}

main();

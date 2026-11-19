import { join } from "node:path";
import {
  executePriorityRun,
  parseOption,
  PRIORITY_ARTIFACTS,
  writePriorityRun,
} from "./lib/priority-run";
import { runPrioritySensitivity } from "./lib/priority-sensitivity";

function main(): void {
  const runId = parseOption("--run-id") ?? "phase8-oracle-all";
  const run = executePriorityRun({ runId: `${runId}-sensitivity`, partition: "all" });
  const sensitivity = runPrioritySensitivity(run);
  writePriorityRun(run, { sensitivity });
  console.log(`Priority sensitivity: ${join(PRIORITY_ARTIFACTS, `${runId}-sensitivity`, "sensitivity.json")}`);
  console.log(`  top-5 retention=${sensitivity.top5_retention_percent}% min=${sensitivity.min_top5_retention}`);
  console.log(`  top-1 stability=${sensitivity.top1_stability_percent}% rank1 changes=${sensitivity.rank1_changes}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

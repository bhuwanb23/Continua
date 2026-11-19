import { join } from "node:path";
import { executePriorityRun, parseOption, PRIORITY_ARTIFACTS, writePriorityRun } from "./lib/priority-run";
import { evaluatePriorityRun } from "./lib/priority-eval";
import { writeJson } from "./lib/evidence-run";

function main(): void {
  const partition = (parseOption("--partition") ?? "all") as "demo" | "dev" | "final" | "all";
  const runId = parseOption("--run-id") ?? `phase8-priority-${partition}`;
  const run = executePriorityRun({ runId, partition });
  const report = evaluatePriorityRun(run);
  writeJson(join(PRIORITY_ARTIFACTS, runId, "evaluation.json"), report);
  writePriorityRun(run, { evaluation: report });
  console.log(`Priority evaluation: ${join(PRIORITY_ARTIFACTS, runId, "evaluation.json")}`);
  console.log(`  queue trust=${String((report.queue as Record<string, unknown>).all_queue_gaps_verified)}`);
  console.log(`  top-5 precision=${String((report.quality as Record<string, unknown>).top5_precision)}`);
  console.log(`  repeat differences=${String((report.determinism as Record<string, unknown>).repeat_queue_differences)}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

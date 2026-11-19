import { performance } from "node:perf_hooks";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { cacheDirFor } from "@/lib/cache/validate";
import { parseArgValue } from "./lib/cache-cli";

async function main(): Promise<void> {
  const dir = parseArgValue("--dir") ?? cacheDirFor();
  const repository = new JsonDemoRepository({ cacheDir: dir });
  const startup = repository.initialize();
  console.log("CONTINUA DEMO CACHE INSPECTION");
  console.log(JSON.stringify(startup, null, 2));
  if (repository.getState() !== "READY") {
    process.exitCode = 1;
    return;
  }

  const panel = await repository.panels.getPanel();
  const queue = await repository.priorities.getQueue();
  const maria = await repository.maria.get();
  const evaluation = await repository.evaluation.getReport();
  const impact = await repository.impact.get();

  console.log(`Panel: ${panel.name} (${panel.patient_count} patients, ${panel.flagged_patient_count} flagged)`);
  const queueStart = performance.now();
  await repository.priorities.getQueue(5);
  console.log(`Queue read: ${(performance.now() - queueStart).toFixed(3)} ms`);
  for (const item of queue.items) {
    console.log(`  #${item.rank} ${item.display_name} — ${item.patient_priority_score} ${item.priority_band} (${item.top_gap.gap_type})`);
  }
  console.log(`Maria: rank ${maria.queue_rank ?? "unranked"}, flagship gap ${maria.flagship_gap_id ?? "none"}`);
  console.log(`Benchmark run: ${String((evaluation as { run_id?: string }).run_id ?? "unknown")}`);
  console.log(`Benchmark status: ${String((evaluation as { status?: string }).status ?? "unknown")}`);
  console.log(`Impact buckets: ${Object.keys(impact).join(", ")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

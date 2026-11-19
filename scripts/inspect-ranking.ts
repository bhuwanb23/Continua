import { join } from "node:path";
import { parseOption, PRIORITY_ARTIFACTS, readJson } from "./lib/priority-run";

interface QueueArtifactItem {
  rank: number;
  display_name: string;
  patient_priority_score: number;
  priority_band: string;
  verified_gap_count: number;
  headline: string;
  top_gap: { gap_id: string; gap_type: string; gap_priority_score: number };
  explanation: { arithmetic: string; why_band: string; action: string };
}

function main(): void {
  const runId = parseOption("--run") ?? "phase8-oracle-all";
  const path = join(PRIORITY_ARTIFACTS, runId, "queue.json");
  const queue = readJson<{ items: QueueArtifactItem[] }>(path).items;
  console.log(`Queue ${runId}: ${queue.length} items`);
  for (const item of queue) {
    console.log(
      `\n#${item.rank} ${item.priority_band} ${item.patient_priority_score} · ${item.display_name} · ${item.verified_gap_count} verified gap(s)`,
    );
    console.log(`  ${item.headline}`);
    console.log(`  top gap: ${item.top_gap.gap_type} ${item.top_gap.gap_priority_score}`);
    console.log(`  why: ${item.explanation.why_band}`);
    console.log(`  action: ${item.explanation.action}`);
    console.log(`  arithmetic: ${item.explanation.arithmetic}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

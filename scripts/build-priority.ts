import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  PRIORITY_ARTIFACTS,
  executePriorityRun,
  writePriorityRun,
} from "./lib/priority-run";
import { evaluatePriorityRun } from "./lib/priority-eval";
import { runPrioritySensitivity } from "./lib/priority-sensitivity";
import { writeJson } from "./lib/evidence-run";

function main(): void {
  const panel = executePriorityRun({ runId: "phase8-oracle-all", partition: "all" });
  const evaluation = evaluatePriorityRun(panel);
  const sensitivity = runPrioritySensitivity(panel);
  const panelDir = writePriorityRun(panel, { evaluation, sensitivity });

  const maria = executePriorityRun({ runId: "phase8-maria", partition: "demo" });
  const mariaEvaluation = evaluatePriorityRun(maria);
  const mariaDir = writePriorityRun(maria, { evaluation: mariaEvaluation });

  const mariaResult = evaluation["maria"] as {
    verified_gap_count: number;
    patient_priority_score: number;
    priority_band: string;
    rank: number | null;
  };
  const mariaDemoEvaluation = mariaEvaluation["maria"] as {
    verified_gap_count: number;
    patient_priority_score: number;
    priority_band: string;
    rank: number | null;
  };

  const summary = {
    benchmark: "CONTINUA INTERVENTION PRIORITY V1",
    priority_version: "priority-v1",
    evidence_version: "evidence-v1",
    verified_gap_schema: "verified-gap-v1",
    evaluation_as_of_date: "2026-06-05",
    llm_calls: 0,
    raw_document_reads: 0,
    panel: {
      patients: panel.evidence.patient_ids.length,
      patients_with_verified_gaps: panel.panel.ranked_patient_count,
      verified_gaps: panel.evidence.verified.length,
      ranked_gaps: panel.panel.gap_priorities.length,
      ineligible_gaps: panel.panel.ineligible_gaps.length,
      queue: panel.queue.map((item) => ({
        rank: item.rank,
        patient_id: item.patient_id,
        display_name: item.display_name,
        patient_priority_score: item.patient_priority_score,
        priority_band: item.priority_band,
        verified_gap_count: item.verified_gap_count,
        headline: item.headline,
        top_gap: item.top_gap,
      })),
    },
    evaluation,
    sensitivity: {
      variant_count: sensitivity.variant_count,
      mean_top5_retention: sensitivity.mean_top5_retention,
      min_top5_retention: sensitivity.min_top5_retention,
      top5_retention_percent: sensitivity.top5_retention_percent,
      top1_stability_percent: sensitivity.top1_stability_percent,
      rank1_changes: sensitivity.rank1_changes,
    },
    maria: {
      verified_gap_count: mariaResult.verified_gap_count,
      patient_priority_score: mariaResult.patient_priority_score,
      priority_band: mariaResult.priority_band,
      rank: mariaResult.rank,
      panel_patient_count: panel.evidence.patient_ids.length,
      demo_run: mariaDemoEvaluation,
      demo_queue_size: maria.queue.length,
      note: "Maria is scored by the same formula. Her full-panel rank is empirical; rank #1 is not required.",
    },
    artifacts: {
      panel: panelDir,
      maria: mariaDir,
    },
  };
  mkdirSync(PRIORITY_ARTIFACTS, { recursive: true });
  writeJson(join(PRIORITY_ARTIFACTS, "phase8-benchmark-summary.json"), summary);

  console.log("CONTINUA INTERVENTION PRIORITY V1");
  console.log(`  patients: ${summary.panel.patients} (${summary.panel.patients_with_verified_gaps} with verified gaps)`);
  console.log(`  verified gaps: ${summary.panel.verified_gaps} ranked=${summary.panel.ranked_gaps} ineligible=${summary.panel.ineligible_gaps}`);
  console.log(`  queue: ${panel.queue.length}`);
  for (const item of panel.queue) {
    console.log(`    #${item.rank} ${item.priority_band} ${item.patient_priority_score} ${item.display_name} — ${item.headline}`);
  }
  console.log(
    `  Maria: score=${summary.maria.patient_priority_score} band=${summary.maria.priority_band} full-panel rank=${String(summary.maria.rank)} / ${summary.maria.panel_patient_count}`,
  );
  console.log(`  top-5 retention: ${summary.sensitivity.top5_retention_percent}% (min ${summary.sensitivity.min_top5_retention})`);
  console.log(`  artifacts: ${PRIORITY_ARTIFACTS}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

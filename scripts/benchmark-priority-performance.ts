import { performance } from "node:perf_hooks";
import { join } from "node:path";
import {
  buildQueue,
  computeGapPriority,
  computePanelPriorities,
  computePatientPriority,
  createPriorityContext,
} from "@/lib/priority";
import { executePriorityRun, PRIORITY_ARTIFACTS, writeJson } from "./lib/priority-run";

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1));
  return sorted[index] ?? null;
}

function main(): void {
  const run = executePriorityRun({ runId: "phase8-performance", partition: "all" });
  const context = createPriorityContext(run.evidence.verified, {
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: run.evidence.event_store_hash,
    verified_gap_set_hash: run.panel.verified_gap_set_hash,
  });

  const gapTimes: number[] = [];
  for (const gap of run.evidence.verified) {
    const start = performance.now();
    computeGapPriority(gap, context);
    gapTimes.push(performance.now() - start);
  }

  const byPatient = new Map<string, typeof run.panel.gap_priorities>();
  for (const gap of run.panel.gap_priorities) {
    const list = byPatient.get(gap.patient_id) ?? [];
    list.push(gap);
    byPatient.set(gap.patient_id, list);
  }

  const patientTimes: number[] = [];
  for (const patientId of run.evidence.patient_ids) {
    const start = performance.now();
    computePatientPriority(patientId, byPatient.get(patientId) ?? [], context);
    patientTimes.push(performance.now() - start);
  }

  const panelTimes: number[] = [];
  for (let index = 0; index < 10; index += 1) {
    const start = performance.now();
    computePanelPriorities({
      patient_ids: run.evidence.patient_ids,
      gaps: run.evidence.verified,
      evaluation_as_of_date: "2026-06-05",
      event_store_hash: run.evidence.event_store_hash,
    });
    panelTimes.push(performance.now() - start);
  }

  const topkTimes: number[] = [];
  for (let index = 0; index < 50; index += 1) {
    const start = performance.now();
    buildQueue(run.panel, run.evidence.verified, run.patients, 5);
    topkTimes.push(performance.now() - start);
  }

  const result = {
    benchmark: "CONTINUA INTERVENTION PRIORITY PERFORMANCE",
    priority_version: "priority-v1",
    patient_count: run.evidence.patient_ids.length,
    verified_gap_count: run.evidence.verified.length,
    gap_scoring_p50_ms_per_gap: percentile(gapTimes, 0.5),
    gap_scoring_p95_ms_per_gap: percentile(gapTimes, 0.95),
    patient_aggregation_p50_ms_per_patient: percentile(patientTimes, 0.5),
    patient_aggregation_p95_ms_per_patient: percentile(patientTimes, 0.95),
    full_panel_p50_ms: percentile(panelTimes, 0.5),
    full_panel_p95_ms: percentile(panelTimes, 0.95),
    top_k_p50_ms: percentile(topkTimes, 0.5),
    top_k_p95_ms: percentile(topkTimes, 0.95),
    llm_calls: 0,
    raw_document_reads: 0,
  };

  writeJson(join(PRIORITY_ARTIFACTS, "performance.json"), result);
  console.log("Priority performance");
  console.log(
    `  gap p50=${result.gap_scoring_p50_ms_per_gap?.toFixed(4)} ms p95=${result.gap_scoring_p95_ms_per_gap?.toFixed(4)} ms`,
  );
  console.log(
    `  panel p50=${result.full_panel_p50_ms?.toFixed(4)} ms p95=${result.full_panel_p95_ms?.toFixed(4)} ms`,
  );
  console.log(`  top-K p50=${result.top_k_p50_ms?.toFixed(4)} ms p95=${result.top_k_p95_ms?.toFixed(4)} ms`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

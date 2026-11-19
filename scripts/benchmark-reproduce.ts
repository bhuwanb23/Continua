import { createHash } from "node:crypto";
import { loadBenchmarkBundle } from "@/lib/evaluation/benchmark-bundle";
import { computeDetectionMetrics } from "@/lib/evaluation/metrics";
import { matchPredictions } from "@/lib/evaluation/matching";
import { buildQueue, computePanelPriorities } from "@/lib/priority";
import { executeEvidenceRun } from "./lib/evidence-run";
import { loadPatientDisplays } from "./lib/priority-run";
import { EXTRACTED_FINAL_PATH } from "@/lib/benchmark/config";
import { parseArg, readReport } from "./lib/benchmark-cli";

function signature() {
  const run = executeEvidenceRun({
    runId: "reproduce",
    mode: "extracted",
    partition: "final",
    extractedPath: EXTRACTED_FINAL_PATH,
  });
  const panel = computePanelPriorities({
    patient_ids: run.patient_ids,
    gaps: run.verified,
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: run.event_store_hash,
  });
  const queue = buildQueue(panel, run.verified, loadPatientDisplays(), 5);
  const bundle = loadBenchmarkBundle();
  const truth = bundle.contracts.truth_gaps.filter((gap) => run.patient_ids.includes(gap.patient_id));
  const metrics = computeDetectionMetrics(
    truth,
    run.verified.map((gap) => ({
      prediction_id: gap.gap_id,
      patient_id: gap.patient_id,
      gap_type: gap.gap_type,
      trigger_event_ids: gap.candidate.trigger_event_ids,
      identity: gap.candidate.identity,
      evidence: gap.candidate.evidence_refs.map((ref) => ({ doc_id: ref.source_doc_id, quoted_span: ref.source_span })),
      detector_version: gap.candidate.detector_version,
      ...(gap.candidate.window_days === undefined ? {} : { window_days: gap.candidate.window_days }),
      ...(gap.candidate.due_date === undefined ? {} : { due_date: gap.candidate.due_date }),
    })),
  );
  const matches = matchPredictions(
    truth,
    run.verified.map((gap) => ({
      prediction_id: gap.gap_id,
      patient_id: gap.patient_id,
      gap_type: gap.gap_type,
      trigger_event_ids: gap.candidate.trigger_event_ids,
      identity: gap.candidate.identity,
      evidence: gap.candidate.evidence_refs.map((ref) => ({ doc_id: ref.source_doc_id, quoted_span: ref.source_span })),
      detector_version: gap.candidate.detector_version,
    })),
  );
  return {
    event_store_hash: run.event_store_hash,
    candidate_ids_hash: createHash("sha256").update(JSON.stringify(run.candidates.map((gap) => gap.gap_id))).digest("hex"),
    verified_ids_hash: createHash("sha256").update(JSON.stringify(run.verified.map((gap) => gap.gap_id))).digest("hex"),
    patient_scores: panel.patient_priorities.map((patient) => [patient.patient_id, patient.patient_priority_score, patient.rank]),
    top5: queue.map((item) => item.patient_id),
    macro_f1: metrics.macro_f1,
    micro_f1: metrics.micro_f1,
    true_positives: matches.truePositives,
    false_positives: matches.falsePositives,
  };
}

const first = signature();
const second = signature();
const identical = JSON.stringify(first) === JSON.stringify(second);
const report = readReport(parseArg("--run") ?? undefined);
const metricsMatch =
  report.end_to_end.macro_f1 === first.macro_f1 &&
  report.end_to_end.micro_f1 === first.micro_f1 &&
  report.end_to_end.metrics.true_positives === first.true_positives;

console.log("CONTINUA REPRODUCIBILITY");
console.log(JSON.stringify({ identical, metrics_match_committed_report: metricsMatch, first }, null, 2));
if (!identical || !metricsMatch) process.exit(1);

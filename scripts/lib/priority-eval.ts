import { matchPredictions } from "@/lib/evaluation";
import {
  buildQueue,
  computePanelPriorities,
  type PriorityPanel,
  type QueueItem,
} from "@/lib/priority";
import type { GapPrediction } from "@/lib/evaluation/types";
import { candidateToPrediction } from "./detector-predictions";
import { loadBenchmarkContracts } from "./evidence-grounding";
import { EVALUATION_DATE, PRIORITY_K, type PriorityRun } from "./priority-run";

function predictionForVerifiedGap(run: PriorityRun, gapId: string): GapPrediction | null {
  const gap = run.evidence.verified.find((item) => item.gap_id === gapId);
  if (!gap) return null;
  return candidateToPrediction(gap.candidate);
}

export function evaluatePriorityRun(run: PriorityRun): Record<string, unknown> {
  const contracts = loadBenchmarkContracts(new Set(run.evidence.patient_ids));
  const truthPatientIds = new Set(contracts.truth_gaps.map((gap) => gap.patient_id));
  const predictions = run.evidence.verified
    .map((gap) => predictionForVerifiedGap(run, gap.gap_id))
    .filter((prediction): prediction is GapPrediction => prediction !== null);
  const matched = matchPredictions(contracts.truth_gaps, predictions);
  const verifiedGapIds = new Set(run.evidence.verified.map((gap) => gap.gap_id));

  const top5PatientsWithTruth = run.queue.filter((item) => truthPatientIds.has(item.patient_id)).length;
  const topGapTruthMatches = run.queue.filter((item) => matched.matchedPredictionIds.has(item.top_gap.gap_id)).length;
  const queueGapsVerified = run.queue.filter((item) => verifiedGapIds.has(item.top_gap.gap_id)).length;
  const ranked = run.panel.patient_priorities.filter((patient) => patient.rank !== null);
  const averageGapsPerFlagged = ranked.length === 0
    ? null
    : ranked.reduce((total, patient) => total + patient.breakdown.verified_gap_count, 0) / ranked.length;

  const rerunPanel = computePanelPriorities({
    patient_ids: run.evidence.patient_ids,
    gaps: run.evidence.verified,
    evaluation_as_of_date: EVALUATION_DATE,
    event_store_hash: run.evidence.event_store_hash,
  });
  const rerunQueue = buildQueue(rerunPanel, run.evidence.verified, run.patients, PRIORITY_K);
  const rerunDifferences = JSON.stringify(rerunQueue) === JSON.stringify(run.queue) ? 0 : 1;

  const maria = run.patients.find((patient) => patient.fixture_key === "P-001-maria");
  const mariaPriority = maria
    ? run.panel.patient_priorities.find((patient) => patient.patient_id === maria.patient_id) ?? null
    : null;
  const mariaGaps = maria
    ? run.panel.gap_priorities.filter((gap) => gap.patient_id === maria.patient_id)
    : [];

  return {
    run_id: run.run_id,
    priority_version: "priority-v1",
    evaluation_as_of_date: EVALUATION_DATE,
    partition: run.partition,
    patient_count: run.evidence.patient_ids.length,
    patients_with_verified_gaps: run.panel.ranked_patient_count,
    verified_gaps: run.evidence.verified.length,
    ranked_gaps: run.panel.gap_priorities.length,
    ineligible_gaps: run.panel.ineligible_gaps.length,
    queue: {
      k: run.queue.length,
      requested_k: PRIORITY_K,
      ranked_patients: ranked.length,
      patients_ranked_above_zero: ranked.length,
      average_verified_gaps_per_flagged_patient: averageGapsPerFlagged,
      compression_ratio: run.queue.length === 0 ? null : run.evidence.patient_ids.length / run.queue.length,
      all_queue_gaps_verified: queueGapsVerified === run.queue.length && run.queue.length > 0,
      verified_gaps_in_queue: queueGapsVerified,
      queue_gaps: run.queue.length,
      unverified_gaps_ranked: run.queue.length - queueGapsVerified,
    },
    quality: {
      top5_patients_with_true_gap: top5PatientsWithTruth,
      top5_precision: run.queue.length === 0 ? null : top5PatientsWithTruth / run.queue.length,
      top5_gap_truth_matches: topGapTruthMatches,
      truth_gap_count: contracts.truth_gaps.length,
      queue_gap_match_rate: run.queue.length === 0 ? null : topGapTruthMatches / run.queue.length,
      measured: true,
      note: "Top-5 precision is patient-level: the patient has at least one frozen benchmark truth gap.",
    },
    determinism: {
      repeat_queue_differences: rerunDifferences,
      formula_reproduced: JSON.stringify(rerunPanel) === JSON.stringify(run.panel),
    },
    maria: {
      verified_gap_count: mariaPriority?.breakdown.verified_gap_count ?? 0,
      gap_scores: mariaGaps
        .map((gap) => ({
          gap_id: gap.gap_id,
          gap_type: gap.gap_type,
          gap_priority_score: gap.gap_priority_score,
          priority_band: gap.priority_band,
        }))
        .sort((left, right) => {
          if (left.gap_id < right.gap_id) return -1;
          if (left.gap_id > right.gap_id) return 1;
          return 0;
        }),
      patient_priority_score: mariaPriority?.patient_priority_score ?? 0,
      priority_band: mariaPriority?.priority_band ?? "NONE",
      rank: mariaPriority?.rank ?? null,
    },
    llm_calls: 0,
    raw_document_reads: 0,
    runtime_ground_truth_labels: 0,
    measured_at: EVALUATION_DATE,
  };
}

export function mariaSummary(queue: readonly QueueItem[], panel: PriorityPanel, mariaId: string): Record<string, unknown> | null {
  const priority = panel.patient_priorities.find((patient) => patient.patient_id === mariaId);
  if (!priority) return null;
  const item = queue.find((queueItem) => queueItem.patient_id === mariaId) ?? null;
  return { priority, queue_item: item };
}

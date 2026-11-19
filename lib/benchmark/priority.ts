import type { VerifiedGap } from "@/lib/domain";
import type { TruthGap } from "@/lib/evaluation/types";
import { matchPredictions } from "@/lib/evaluation/matching";
import { safeRatio } from "@/lib/evaluation/metrics";
import {
  buildQueue,
  computePanelPriorities,
  DEFAULT_PRIORITY_CONFIG,
  mergePriorityConfig,
  validatePriorityPanel,
  validateQueue,
  type PriorityConfigOverride,
  type QueueItem,
} from "@/lib/priority";
import type { PatientDisplayRecord } from "@/scripts/lib/priority-run";
import { PRIORITY_K, TARGETS } from "./config";
import type { PriorityLayerResult } from "./types";
import { verifiedPrediction } from "./gaps";

const SENSITIVITY_VARIANTS: Array<{ name: string; override: PriorityConfigOverride }> = [
  { name: "severity_medium_low_plus_15", override: { severity_weights: { medium: 0.805, low: 0.5175 } } },
  { name: "severity_medium_low_minus_15", override: { severity_weights: { medium: 0.595, low: 0.3825 } } },
  { name: "actionability_duplicate_plus_15", override: { actionability_weights: { duplicate_test: 0.9775 } } },
  { name: "actionability_duplicate_minus_15", override: { actionability_weights: { duplicate_test: 0.7225 } } },
  {
    name: "temporal_thresholds_early",
    override: {
      temporal_thresholds: { overdue_1_7_max: 2, overdue_8_30_max: 25, overdue_31_60_max: 55, overdue_61_90_max: 85 },
    },
  },
  {
    name: "temporal_thresholds_late",
    override: {
      temporal_thresholds: { overdue_1_7_max: 12, overdue_8_30_max: 35, overdue_31_60_max: 65, overdue_61_90_max: 95 },
    },
  },
  { name: "secondary_factor_0_08", override: { secondary_factor: 0.08 } },
  { name: "secondary_cap_0_35", override: { secondary_bonus_cap: 0.35 } },
];

function retention(left: readonly string[], right: readonly string[]): number {
  if (left.length === 0) return 1;
  const rightSet = new Set(right);
  return left.filter((id) => rightSet.has(id)).length / left.length;
}

function precisionAt(ranked: QueueItem[], patientIds: Set<string>, k: number): number | null {
  const top = ranked.slice(0, k);
  if (top.length === 0) return null;
  return top.filter((item) => patientIds.has(item.patient_id)).length / top.length;
}

function buildPanel(input: {
  patientIds: string[];
  gaps: VerifiedGap[];
  eventStoreHash: string;
  override?: PriorityConfigOverride;
}) {
  const config = input.override
    ? mergePriorityConfig(DEFAULT_PRIORITY_CONFIG, input.override)
    : DEFAULT_PRIORITY_CONFIG;
  return computePanelPriorities({
    patient_ids: input.patientIds,
    gaps: input.gaps,
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: input.eventStoreHash,
    config,
  });
}

export function evaluatePriorityLayer(input: {
  patientIds: string[];
  gaps: VerifiedGap[];
  truthGaps: TruthGap[];
  eventStoreHash: string;
  patients: PatientDisplayRecord[];
}): PriorityLayerResult {
  const panel = buildPanel(input);
  const queue = buildQueue(panel, input.gaps, input.patients, PRIORITY_K);
  const fullQueue = buildQueue(panel, input.gaps, input.patients, 10);
  const repeatPanel = buildPanel(input);
  const repeatQueue = buildQueue(repeatPanel, input.gaps, input.patients, PRIORITY_K);
  const truthPatients = new Set(input.truthGaps.map((gap) => gap.patient_id));
  const truthByPrediction = matchPredictions(input.truthGaps, input.gaps.map(verifiedPrediction));
  const verifiedGapIds = new Set(input.gaps.map((gap) => gap.gap_id));

  const top5 = queue.map((item) => ({
    rank: item.rank,
    patient_id: item.patient_id,
    display_name: item.display_name,
    verified: verifiedGapIds.has(item.top_gap.gap_id),
    truth_match: truthByPrediction.matchedPredictionIds.has(item.top_gap.gap_id),
    gap_id: item.top_gap.gap_id,
    gap_type: item.top_gap.gap_type,
  }));
  const top5Verified = top5.filter((item) => item.verified).length;
  const top5Truth = top5.filter((item) => item.truth_match).length;

  const baselineTop5 = queue.map((item) => item.patient_id);
  const variants = SENSITIVITY_VARIANTS.map((variant) => {
    const variantPanel = buildPanel({ ...input, override: variant.override });
    const variantQueue = buildQueue(variantPanel, input.gaps, input.patients, PRIORITY_K);
    const ids = variantQueue.map((item) => item.patient_id);
    return {
      name: variant.name,
      top5_patient_ids: ids,
      top5_retention: retention(baselineTop5, ids),
      top1_unchanged: (ids[0] ?? null) === (baselineTop5[0] ?? null),
    };
  });

  const mutatedPatients = input.patients.map((patient) => ({
    ...patient,
    display_name: `${patient.display_name} (demographic mutation)`,
    demo_age: patient.demo_age + 17,
    sex: patient.sex === "F" ? "M" : "F",
  }));
  const mutatedQueue = buildQueue(panel, input.gaps, mutatedPatients, PRIORITY_K);
  const demographicViolations = queue.filter(
    (item, index) =>
      mutatedQueue[index]?.patient_id !== item.patient_id ||
      mutatedQueue[index]?.patient_priority_score !== item.patient_priority_score ||
      mutatedQueue[index]?.top_gap.gap_id !== item.top_gap.gap_id,
  ).length;

  const panelFailures = validatePriorityPanel(panel);
  const queueFailures = validateQueue(queue, panel, PRIORITY_K);

  return {
    status: "measured",
    source: "oracle",
    patients: input.patientIds.length,
    patients_with_verified_gaps: panel.ranked_patient_count,
    ranked_patients: panel.ranked_patient_count,
    verified_gaps: input.gaps.length,
    ranked_gaps: panel.gap_priorities.length,
    ineligible_gaps: panel.ineligible_gaps.length,
    queue,
    top5,
    top5_verified: top5Verified,
    top5_truth_matches: top5Truth,
    top5_truth_precision: safeRatio(top5Truth, queue.length),
    precision_at_k: {
      "1": precisionAt(fullQueue, truthPatients, 1),
      "3": precisionAt(fullQueue, truthPatients, 3),
      "5": precisionAt(fullQueue, truthPatients, 5),
      "10": precisionAt(fullQueue, truthPatients, 10),
    },
    sensitivity: {
      variant_count: variants.length,
      mean_top5_retention:
        Math.round((variants.reduce((sum, variant) => sum + variant.top5_retention, 0) / variants.length) * 10_000) /
        10_000,
      min_top5_retention: Math.round(Math.min(...variants.map((variant) => variant.top5_retention)) * 10_000) / 10_000,
      top1_stability:
        Math.round((variants.filter((variant) => variant.top1_unchanged).length / variants.length) * 10_000) / 10_000,
      variants,
    },
    invariants: {
      checked_gaps: panel.gap_priorities.length,
      formula_failures: panelFailures.filter((failure) => failure.code === "PR-002").length,
      queue_failures: queueFailures.length,
      deterministic_repeat_differences: JSON.stringify(queue) === JSON.stringify(repeatQueue) ? 0 : 1,
      demographic_violations: demographicViolations,
      secondary_cap_violations: panelFailures.filter((failure) => failure.code === "PR-006").length,
      tie_ordering_stable: JSON.stringify(panel) === JSON.stringify(repeatPanel),
      passed:
        panelFailures.length === 0 &&
        queueFailures.length === 0 &&
        demographicViolations === 0 &&
        JSON.stringify(panel) === JSON.stringify(repeatPanel) &&
        JSON.stringify(queue) === JSON.stringify(repeatQueue),
    },
    panel,
  };
}

export function priorityTargets(): { top5Verified: number; top5Truth: number } {
  return { top5Verified: TARGETS.top5_verified, top5Truth: TARGETS.top5_truth };
}

import {
  buildQueue,
  computePanelPriorities,
  DEFAULT_PRIORITY_CONFIG,
  mergePriorityConfig,
  type PriorityConfigOverride,
} from "@/lib/priority";
import { EVALUATION_DATE, PRIORITY_K, type PriorityRun } from "./priority-run";

interface SensitivityVariant {
  name: string;
  description: string;
  override: PriorityConfigOverride;
}

function jaccard(left: readonly string[], right: readonly string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((id) => rightSet.has(id)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 1 : intersection / union;
}

function retention(left: readonly string[], right: readonly string[]): number {
  if (left.length === 0) return 1;
  const rightSet = new Set(right);
  return left.filter((id) => rightSet.has(id)).length / left.length;
}

const VARIANTS: SensitivityVariant[] = [
  {
    name: "severity_medium_low_plus_15",
    description: "Medium and low workflow severity weights +15%, high unchanged.",
    override: { severity_weights: { medium: 0.805, low: 0.5175 } },
  },
  {
    name: "severity_medium_low_minus_15",
    description: "Medium and low workflow severity weights -15%, high unchanged.",
    override: { severity_weights: { medium: 0.595, low: 0.3825 } },
  },
  {
    name: "actionability_duplicate_plus_15",
    description: "Duplicate-test actionability +15%, other mappings unchanged.",
    override: { actionability_weights: { duplicate_test: 0.9775 } },
  },
  {
    name: "actionability_duplicate_minus_15",
    description: "Duplicate-test actionability -15%, other mappings unchanged.",
    override: { actionability_weights: { duplicate_test: 0.7225 } },
  },
  {
    name: "temporal_thresholds_early",
    description: "Temporal bucket boundaries shifted five days earlier.",
    override: {
      temporal_thresholds: {
        overdue_1_7_max: 2,
        overdue_8_30_max: 25,
        overdue_31_60_max: 55,
        overdue_61_90_max: 85,
      },
    },
  },
  {
    name: "temporal_thresholds_late",
    description: "Temporal bucket boundaries shifted five days later.",
    override: {
      temporal_thresholds: {
        overdue_1_7_max: 12,
        overdue_8_30_max: 35,
        overdue_31_60_max: 65,
        overdue_61_90_max: 95,
      },
    },
  },
  {
    name: "secondary_factor_0_08",
    description: "Secondary-gap factor reduced from 0.10 to 0.08.",
    override: { secondary_factor: 0.08 },
  },
  {
    name: "secondary_cap_0_35",
    description: "Secondary-gap bonus cap raised from 0.30 to 0.35.",
    override: { secondary_bonus_cap: 0.35 },
  },
];

export function runPrioritySensitivity(run: PriorityRun): Record<string, unknown> {
  const baselineTop5 = run.queue.map((item) => item.patient_id);
  const baselineTop1 = baselineTop5[0] ?? null;
  const variants = VARIANTS.map((variant) => {
    const config = mergePriorityConfig(DEFAULT_PRIORITY_CONFIG, variant.override);
    const panel = computePanelPriorities({
      patient_ids: run.evidence.patient_ids,
      gaps: run.evidence.verified,
      evaluation_as_of_date: EVALUATION_DATE,
      event_store_hash: run.evidence.event_store_hash,
      config,
    });
    const queue = buildQueue(panel, run.evidence.verified, run.patients, PRIORITY_K, config);
    const top5 = queue.map((item) => item.patient_id);
    return {
      name: variant.name,
      description: variant.description,
      override: variant.override,
      top5_patient_ids: top5,
      top1_patient_id: top5[0] ?? null,
      top1_unchanged: (top5[0] ?? null) === baselineTop1,
      top5_retention: retention(baselineTop5, top5),
      top5_jaccard: jaccard(baselineTop5, top5),
    };
  });

  const meanRetention = variants.reduce((total, variant) => total + variant.top5_retention, 0) / variants.length;
  const minRetention = Math.min(...variants.map((variant) => variant.top5_retention));
  const top1Stable = variants.filter((variant) => variant.top1_unchanged).length / variants.length;

  return {
    priority_version: "priority-v1",
    evaluation_as_of_date: EVALUATION_DATE,
    frozen_perturbation_suite: true,
    baseline_top5: baselineTop5,
    baseline_top1: baselineTop1,
    variant_count: variants.length,
    variants,
    mean_top5_retention: Math.round(meanRetention * 10_000) / 10_000,
    min_top5_retention: Math.round(minRetention * 10_000) / 10_000,
    top5_retention_percent: Math.round(meanRetention * 1000) / 10,
    top1_stability_percent: Math.round(top1Stable * 1000) / 10,
    rank1_changes: variants.length - variants.filter((variant) => variant.top1_unchanged).length,
    interpretation:
      "Sensitivity is an interpretability check, not a search for weights that preserve a chosen demo rank.",
  };
}

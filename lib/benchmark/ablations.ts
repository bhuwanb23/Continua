import type { VerifiedGap } from "@/lib/domain";
import type { DetectionMetrics } from "@/lib/evaluation/types";
import type { TruthGap } from "@/lib/evaluation/types";
import {
  buildQueue,
  computePanelPriorities,
  DEFAULT_PRIORITY_CONFIG,
  mergePriorityConfig,
} from "@/lib/priority";
import type { PatientDisplayRecord } from "@/scripts/lib/priority-run";
import type { AblationEntry, AblationReport } from "./types";

function retention(left: readonly string[], right: readonly string[]): number {
  if (left.length === 0) return 1;
  const rightSet = new Set(right);
  return left.filter((id) => rightSet.has(id)).length / left.length;
}

function delta(value: number | null, baseline: number | null): number | null {
  if (value === null || baseline === null) return null;
  return Math.round((value - baseline) * 1_000_000) / 1_000_000;
}

export function buildAblationReport(input: {
  truthGaps: TruthGap[];
  patientIds: string[];
  verified: VerifiedGap[];
  patients: PatientDisplayRecord[];
  eventStoreHash: string;
  fullMetrics: DetectionMetrics;
  candidateMetrics: DetectionMetrics;
  oracleMetrics: DetectionMetrics;
}): AblationReport {
  const basePanel = computePanelPriorities({
    patient_ids: input.patientIds,
    gaps: input.verified,
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: input.eventStoreHash,
  });
  const baseQueue = buildQueue(basePanel, input.verified, input.patients, 5);
  const noCapConfig = mergePriorityConfig(DEFAULT_PRIORITY_CONFIG, { secondary_bonus_cap: 1 });
  const noCapPanel = computePanelPriorities({
    patient_ids: input.patientIds,
    gaps: input.verified,
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: input.eventStoreHash,
    config: noCapConfig,
  });
  const noCapQueue = buildQueue(noCapPanel, input.verified, input.patients, 5);
  const noCapRetention = retention(
    baseQueue.map((item) => item.patient_id),
    noCapQueue.map((item) => item.patient_id),
  );

  const entries: AblationEntry[] = [
    {
      name: "oracle_events",
      status: "measured",
      description: "Replace fixture extraction with frozen canonical truth events.",
      metrics: input.oracleMetrics,
      macro_f1: input.oracleMetrics.macro_f1,
      delta_macro_f1: delta(input.oracleMetrics.macro_f1, input.fullMetrics.macro_f1),
      top5_retention: null,
      finding:
        input.oracleMetrics.macro_f1 === input.fullMetrics.macro_f1
          ? "Fixture replay gives the same gap metrics as oracle events in this run; no extraction loss is observable."
          : "Oracle events change gap metrics, identifying extraction as a material contributor.",
      limitation: "Oracle is not deployable.",
    },
    {
      name: "no_evidence_gate",
      status: "measured",
      description: "Use candidate gaps directly instead of requiring evidence verification.",
      metrics: input.candidateMetrics,
      macro_f1: input.candidateMetrics.macro_f1,
      delta_macro_f1: delta(input.candidateMetrics.macro_f1, input.fullMetrics.macro_f1),
      top5_retention: null,
      finding:
        input.candidateMetrics.true_positives === input.fullMetrics.true_positives &&
        input.candidateMetrics.false_positives === input.fullMetrics.false_positives
          ? "The evidence gate removed no benchmark gap in this fixture run; its value is trust/auditability, not measured F1 gain here."
          : "The evidence gate changes detection metrics; inspect precision/recall trade-offs before deployment.",
      limitation: "Candidate output does not satisfy the trust gates for displayed care gaps.",
    },
    {
      name: "no_secondary_priority_cap",
      status: "measured",
      description: "Raise the secondary-gap bonus cap from 0.30 to 1.00.",
      metrics: null,
      macro_f1: null,
      delta_macro_f1: null,
      top5_retention: noCapRetention,
      finding:
        noCapRetention === 1
          ? "Removing the secondary cap does not change the Top-5 in this panel."
          : `Removing the secondary cap changes the Top-5 (retention ${Math.round(noCapRetention * 1000) / 10}%).`,
      limitation: "Single fixed panel; not evidence of population-level ranking stability.",
    },
  ];

  return {
    status: "partial",
    entries,
    unmeasured: [
      {
        name: "no_normalization",
        reason: "The frozen extraction store has already been normalized; a faithful raw-entity ablation requires a new extraction run.",
      },
      {
        name: "no_reconciliation",
        reason: "Reconciliation is embedded in the frozen extraction artifact; disabling it requires regenerating canonical events.",
      },
      {
        name: "no_negative_safeguards",
        reason: "Detector safeguard flags are not exposed as a supported runtime configuration.",
      },
      {
        name: "no_grounding_claim_filter",
        reason: "The evidence gate and claim-coverage filter are the same architecture boundary; no separate observable was produced.",
      },
    ],
  };
}

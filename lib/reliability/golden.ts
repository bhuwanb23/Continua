import { stableJson } from "./assertions";

export interface GoldenCacheInputs {
  manifest: Record<string, unknown>;
  panel: Record<string, unknown>;
  queue: Record<string, unknown>;
  priorities: Record<string, unknown>;
  maria: Record<string, unknown>;
  timelines: Array<Record<string, unknown>>;
  verifiedGaps: Array<Record<string, unknown>>;
  evidence: Record<string, unknown>;
  evaluation: Record<string, unknown>;
}

export interface GoldenSnapshot {
  versions: Record<string, unknown>;
  panel: {
    patient_count: unknown;
    flagged_patient_count: unknown;
    verified_gap_counts: unknown;
    synthetic: unknown;
  };
  queue: Array<{
    rank: unknown;
    patient_id: unknown;
    patient_priority_score: unknown;
    priority_band: unknown;
    top_gap_id: unknown;
    top_gap_type: unknown;
  }>;
  maria: {
    rank: unknown;
    flagship_gap_id: unknown;
    gap_ids: string[];
    timeline_event_ids: string[];
  };
  verified_gaps: {
    total: number;
    by_type: Record<string, number>;
    gap_ids: string[];
  };
  evidence: {
    bundles: number;
    flagship_gap_has_sources: boolean;
  };
  evaluation: Record<string, unknown>;
}

/**
 * Semantic, machine-derived golden baseline. Deliberately not an HTML snapshot:
 * ids, ranks, scores, counts, and version metadata only.
 */
export function projectGolden(input: GoldenCacheInputs): GoldenSnapshot {
  const queue = (input.queue.items as Array<Record<string, unknown>>) ?? [];
  const mariaPriority = (
    (input.priorities.patient_priorities as Array<Record<string, unknown>>) ?? []
  ).find((item) => item.patient_id === input.maria.patient_id);
  const mariaGapIds = (input.verifiedGaps as Array<Record<string, unknown>>)
    .filter((gap) => gap.patient_id === input.maria.patient_id)
    .map((gap) => String(gap.gap_id))
    .sort();
  const mariaTimeline = input.timelines.find(
    (entry) => entry.patient_id === input.maria.patient_id,
  );
  const byType: Record<string, number> = {};
  for (const gap of input.verifiedGaps) {
    const type = String(gap.gap_type);
    byType[type] = (byType[type] ?? 0) + 1;
  }
  const bundles = (input.evidence.bundles as Array<Record<string, unknown>>) ?? [];
  const flagshipBundle = bundles.find((bundle) => bundle.gap_id === input.maria.flagship_gap_id);

  return {
    versions: {
      cache_version: input.manifest.cache_version,
      dataset_version: input.manifest.dataset_version,
      eval_version: input.manifest.eval_version,
      clinical_event_schema: input.manifest.clinical_event_schema,
      extractor_version: input.manifest.extractor_version,
      detector_version: input.manifest.detector_version,
      evidence_version: input.manifest.evidence_version,
      priority_version: input.manifest.priority_version,
      benchmark_version: input.manifest.benchmark_version,
      evaluation_as_of_date: input.manifest.evaluation_as_of_date,
      patient_count: input.manifest.patient_count,
    },
    panel: {
      patient_count: input.panel.patient_count,
      flagged_patient_count: input.panel.flagged_patient_count,
      verified_gap_counts: input.panel.verified_gap_counts,
      synthetic: input.panel.synthetic,
    },
    queue: queue.map((item) => {
      const topGap = (item.top_gap as Record<string, unknown>) ?? {};
      return {
        rank: item.rank,
        patient_id: item.patient_id,
        patient_priority_score: item.patient_priority_score,
        priority_band: item.priority_band,
        top_gap_id: topGap.gap_id,
        top_gap_type: topGap.gap_type,
      };
    }),
    maria: {
      rank: mariaPriority?.rank ?? null,
      flagship_gap_id: input.maria.flagship_gap_id,
      gap_ids: mariaGapIds,
      timeline_event_ids: (
        (mariaTimeline?.events as Array<Record<string, unknown>>) ?? []
      ).map((event) => String(event.event_id)),
    },
    verified_gaps: {
      total: input.verifiedGaps.length,
      by_type: byType,
      gap_ids: input.verifiedGaps.map((gap) => String(gap.gap_id)).sort(),
    },
    evidence: {
      bundles: bundles.length,
      flagship_gap_has_sources:
        Array.isArray(flagshipBundle?.positive) && flagshipBundle.positive.length > 0,
    },
    evaluation: input.evaluation,
  };
}

export function goldenFingerprint(snapshot: GoldenSnapshot): string {
  return stableJson(snapshot);
}

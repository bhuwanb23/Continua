import type { CanonicalClinicalEvent } from "@/lib/domain";
import type { DetectionMetrics, GapPrediction, NegativeCase, TruthGap } from "@/lib/evaluation/types";
import { computeDetectionMetrics, computeHardNegativePassRate } from "@/lib/evaluation/metrics";
import { evaluateGrounding } from "@/lib/evaluation/grounding";
import { dueDate, daysBetween } from "@/lib/evaluation/temporal";
import type { BaselineEntry, BaselineReport, LayerStatus } from "./types";
import { providerState } from "./metadata";

function eventDate(event: CanonicalClinicalEvent): string {
  return event.date;
}

function typed(event: CanonicalClinicalEvent): Record<string, unknown> {
  return event.typed as unknown as Record<string, unknown>;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function evidenceFor(event: CanonicalClinicalEvent): GapPrediction["evidence"] {
  return [{ doc_id: event.source.source_doc_id, quoted_span: event.source.source_span }];
}

function referralGaps(events: CanonicalClinicalEvent[], patientIds: Set<string>): GapPrediction[] {
  const predictions: GapPrediction[] = [];
  for (const event of events) {
    if (event.event_type !== "referral" || !patientIds.has(event.patient_id)) continue;
    const specialty = text(typed(event)["specialty_raw"] ?? typed(event)["specialty_normalized"] ?? typed(event)["specialty"]);
    const window = typed(event)["expected_window_days"];
    if (!specialty || typeof window !== "number" || !Number.isFinite(window)) continue;
    const completion = events.find((candidate) => {
      if (candidate.patient_id !== event.patient_id) return false;
      if (candidate.event_type !== "consult" && candidate.event_type !== "followup") return false;
      const candidateSpecialty = text(typed(candidate)["specialty"]);
      if (candidateSpecialty !== specialty) return false;
      const delta = daysBetween(event.date, candidate.date);
      return delta >= 0 && delta <= window;
    });
    if (completion) continue;
    predictions.push({
      prediction_id: `naive-followup-${event.event_id}`,
      patient_id: event.patient_id,
      gap_type: "missed_followup",
      trigger_event_ids: [event.event_id],
      identity: { specialty },
      evidence: evidenceFor(event),
      detector_version: "naive-rules-v1",
      window_days: window,
      due_date: dueDate(event.date, window),
      confidence: 1,
    });
  }
  return predictions;
}

function duplicateGaps(events: CanonicalClinicalEvent[], patientIds: Set<string>): GapPrediction[] {
  const predictions: GapPrediction[] = [];
  const byPatient = new Map<string, CanonicalClinicalEvent[]>();
  for (const event of events) {
    if (!patientIds.has(event.patient_id)) continue;
    const list = byPatient.get(event.patient_id) ?? [];
    list.push(event);
    byPatient.set(event.patient_id, list);
  }

  for (const [patientId, patientEvents] of byPatient) {
    const groups = new Map<string, CanonicalClinicalEvent[]>();
    for (const event of patientEvents) {
      if (event.event_type !== "lab_result" && event.event_type !== "imaging") continue;
      if (typed(event)["series_status"] === "explicit_series") continue;
      const rawTest = typed(event)["test_name_raw"] ?? typed(event)["test"];
      const rawModality = typed(event)["modality_raw"] ?? typed(event)["modality"];
      const rawRegion = typed(event)["body_region_raw"] ?? typed(event)["body_region"];
      const key =
        event.event_type === "lab_result"
          ? `lab:${String(rawTest ?? "")}`
          : `imaging:${String(rawModality ?? "")}:${String(rawRegion ?? "")}`;
      if (key.endsWith(":")) continue;
      const list = groups.get(key) ?? [];
      list.push(event);
      groups.set(key, list);
    }

    for (const grouped of groups.values()) {
      const sorted = [...grouped].sort((left, right) => left.date.localeCompare(right.date));
      for (let index = 0; index < sorted.length - 1; index += 1) {
        const first = sorted[index];
        const second = sorted[index + 1];
        if (!first || !second) continue;
        if (daysBetween(first.date, second.date) > 14) continue;
        const identity: GapPrediction["identity"] =
          first.event_type === "lab_result"
            ? {
                test: text(
                  (typed(first)["test_name_raw"] ?? typed(first)["test"]) as string | null,
                ),
                event_ids: [first.event_id, second.event_id],
              }
            : {
                modality: text(
                  (typed(first)["modality_raw"] ?? typed(first)["modality"]) as string | null,
                ),
                body_region: text(
                  (typed(first)["body_region_raw"] ?? typed(first)["body_region"]) as string | null,
                ),
                event_ids: [first.event_id, second.event_id],
              };
        predictions.push({
          prediction_id: `naive-duplicate-${first.event_id}-${second.event_id}`,
          patient_id: patientId,
          gap_type: "duplicate_test",
          trigger_event_ids: [first.event_id],
          identity,
          evidence: [...evidenceFor(first), ...evidenceFor(second)],
          detector_version: "naive-rules-v1",
          window_days: 14,
          due_date: dueDate(first.date, 14),
          confidence: 1,
        });
      }
    }
  }
  return predictions;
}

export function naiveBaselinePredictions(
  events: CanonicalClinicalEvent[],
  patientIds: Set<string>,
): GapPrediction[] {
  return [...referralGaps(events, patientIds), ...duplicateGaps(events, patientIds)].sort((left, right) =>
    left.prediction_id.localeCompare(right.prediction_id),
  );
}

function entry(
  name: string,
  status: LayerStatus,
  source: BaselineEntry["source"],
  metrics: DetectionMetrics | null,
  hardNegativePassRate: number | null,
  groundingRate: number | null,
  note: string,
): BaselineEntry {
  return {
    name,
    status,
    source,
    metrics,
    macro_f1: metrics?.macro_f1 ?? null,
    micro_f1: metrics?.micro_f1 ?? null,
    hard_negative_pass_rate: hardNegativePassRate,
    grounding_rate: groundingRate,
    note,
  };
}

export function buildBaselineReport(input: {
  truthGaps: TruthGap[];
  negatives: NegativeCase[];
  patientIds: Set<string>;
  events: CanonicalClinicalEvent[];
  records: Array<{ source_doc_id: string; patient_id: string; text: string }>;
  oracleMetrics: DetectionMetrics;
  fullHybridMetrics: DetectionMetrics;
  fullHybridNegativePassRate: number | null;
  fullHybridGroundingRate: number | null;
}): { report: BaselineReport; naivePredictions: GapPrediction[] } {
  const empty = computeDetectionMetrics(input.truthGaps, []);
  const naivePredictions = naiveBaselinePredictions(input.events, input.patientIds);
  const naiveMetrics = computeDetectionMetrics(input.truthGaps, naivePredictions);
  const naiveGrounding = evaluateGrounding(naivePredictions, input.records);
  const naiveNegatives = computeHardNegativePassRate(input.negatives, naivePredictions);
  const provider = providerState();

  const entries: BaselineEntry[] = [
    entry(
      "predict_nothing",
      "measured",
      "none",
      empty,
      computeHardNegativePassRate(input.negatives, []).pass_rate,
      null,
      "Sanity predictor. Recall and F1 must be zero.",
    ),
    entry(
      "naive_keyword_rules",
      "measured",
      "fixture_replay",
      naiveMetrics,
      naiveNegatives.pass_rate,
      naiveGrounding.grounded_gap_rate,
      "Simple referral-completion and exact duplicate rules over frozen extracted events; no normalization layer beyond frozen event fields and no evidence gate.",
    ),
    entry(
      "oracle_events_upper_bound",
      "measured",
      "oracle",
      input.oracleMetrics,
      null,
      null,
      "Gold canonical events plus deterministic rules; diagnostic upper bound, not deployable.",
    ),
    entry(
      "full_hybrid_fixture_replay",
      "measured",
      "fixture_replay",
      input.fullHybridMetrics,
      input.fullHybridNegativePassRate,
      input.fullHybridGroundingRate,
      "Full extracted -> detector -> evidence -> priority path using frozen fixture extraction.",
    ),
    entry(
      "llm_only_gap_judge",
      "not_run",
      "unavailable",
      null,
      null,
      null,
      provider.configured
        ? "Documented benchmark slot exists, but the LLM-only judge was not executed in this run."
        : "No live provider configured. The LLM-only baseline is not measured; no synthetic substitute is reported.",
    ),
  ];

  return {
    report: {
      status: "measured",
      entries,
      measured_baselines: entries.filter((item) => item.status === "measured").length,
      meaningful_comparison: entries.some((item) => item.name === "naive_keyword_rules" && item.status === "measured"),
      limitations: [
        "The naive baseline shares the frozen fixture-extracted event store; it tests simpler judgment, not simpler extraction.",
        "The LLM-only baseline was not run because no provider was configured.",
        "The oracle-events baseline is an upper bound, not a competitor.",
      ],
    },
    naivePredictions,
  };
}

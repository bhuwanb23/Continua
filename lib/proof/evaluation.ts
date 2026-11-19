import { demoRepository } from "@/lib/services/context";
import type {
  AblationView,
  BaselineView,
  FunnelStageView,
  NegativeFamilyView,
  PerTypeMetric,
  ProofEvaluation,
} from "@/lib/proof/types";

type Json = Record<string, unknown>;

const obj = (value: unknown): Json =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};

const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const str = (value: unknown): string | null => (typeof value === "string" ? value : null);

const bool = (value: unknown): boolean => value === true;

/** "5/5" -> 5, 5 -> 5, anything else -> 0. */
function fractionCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const [first] = value.split("/");
    const parsed = Number(first);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function perType(value: unknown): Record<string, PerTypeMetric> {
  const output: Record<string, PerTypeMetric> = {};
  for (const [key, entry] of Object.entries(obj(value))) {
    const m = obj(entry);
    output[key] = {
      precision: num(m.precision),
      recall: num(m.recall),
      f1: num(m.f1),
      tp: num(m.tp) ?? 0,
      fp: num(m.fp) ?? 0,
      fn: num(m.fn) ?? 0,
    };
  }
  return output;
}

function topK(value: unknown, field: "top5_truth_precision" | "top5_verified"): string {
  const scorecard = obj(value);
  const raw = scorecard[field];
  if (typeof raw === "string") return raw;
  const number = num(raw);
  return number === null ? "—" : `${number}/5`;
}

const BASELINE_LABELS: Record<string, string> = {
  predict_nothing: "Predict nothing (sanity)",
  naive_keyword_rules: "Naive keyword rules",
  oracle_events_upper_bound: "Oracle events (upper bound)",
  full_hybrid_fixture_replay: "Continua hybrid (fixture replay)",
  llm_only_gap_judge: "LLM-only gap judge",
};

function baselines(value: unknown): BaselineView[] {
  return arr(obj(value).entries).map((entry) => {
    const b = obj(entry);
    const name = str(b.name) ?? "unknown";
    return {
      name,
      label: BASELINE_LABELS[name] ?? name.replace(/_/g, " "),
      status: str(b.status) ?? "unknown",
      macro_f1: num(b.macro_f1),
      micro_f1: num(b.micro_f1),
      hard_negative_pass_rate: num(b.hard_negative_pass_rate),
      grounding_rate: num(b.grounding_rate),
      ...(str(b.note) ? { note: str(b.note) as string } : {}),
    };
  });
}

function ablations(value: unknown): AblationView[] {
  return arr(obj(value).entries).map((entry) => {
    const a = obj(entry);
    const name = str(a.name) ?? "unknown";
    return {
      name,
      status: str(a.status) ?? "unknown",
      macro_f1: num(a.macro_f1),
      delta_macro_f1: num(a.delta_macro_f1),
      finding: str(a.finding) ?? "",
      ...(str(a.limitation) ? { limitation: str(a.limitation) as string } : {}),
    };
  });
}

/**
 * Read-only projection of the frozen Phase-9 report into the Phase-14 proof
 * shape. It never recomputes or repairs benchmark numbers.
 */
export async function getProofEvaluation(): Promise<ProofEvaluation> {
  const cache = await demoRepository().store.requireCache();
  const evaluation = cache.evaluation as Json;
  const scorecard = obj(evaluation.scorecard);
  const gaps = obj(evaluation.gaps);
  const extracted = obj(gaps.extracted);
  const extractedMetrics = obj(extracted.metrics);
  const evidence = obj(evaluation.evidence);
  const verifiedGrounding = obj(evidence.verified_grounding);
  const negatives = obj(evaluation.negatives);
  const verifiedNegatives = obj(negatives.verified);
  const priority = obj(evaluation.priority);
  const latency = obj(evaluation.latency);
  const endToEnd = obj(evaluation.end_to_end);
  const extraction = obj(evaluation.extraction);
  const annotated = obj(obj(extraction.annotated_scope).metrics);
  const reproducibility = obj(evaluation.reproducibility);
  const truthGaps = num(obj(gaps.oracle).truth_gaps) ?? 41;
  const verifiedGaps = num(evidence.verified) ?? 0;

  const families: NegativeFamilyView[] = arr(negatives.by_family).map((entry) => {
    const family = obj(entry);
    return {
      family: str(family.family) ?? "unknown",
      cases: num(family.cases) ?? 0,
      passed: num(family.passed) ?? 0,
      pass_rate: num(family.pass_rate) ?? 0,
    };
  });

  const rejected = num(obj(evaluation.corruption).rejected) ?? 0;
  const corruptionTotal = num(obj(evaluation.corruption).total) ?? 0;

  const normalization = num(annotated.normalization_accuracy);
  const normalizedMatches = normalization === null ? null : Math.round(normalization * (num(annotated.gold_events) ?? 0));

  const funnelStages: FunnelStageView[] = [
    {
      key: "truth_gaps",
      label: "Ground-truth gaps",
      count: truthGaps,
      denominator: truthGaps,
      note: "Frozen benchmark truth gaps.",
    },
    {
      key: "correct_candidates",
      label: "Correct candidate gaps",
      count: num(extractedMetrics.true_positives) ?? 0,
      denominator: truthGaps,
      note: "Detector candidate matches truth by the frozen matching rules.",
    },
    {
      key: "verified_gaps",
      label: "Evidence-verified gaps",
      count: verifiedGaps,
      denominator: truthGaps,
      note: "Candidate survives the evidence gate.",
    },
    {
      key: "ranked_gaps",
      label: "Ranked gaps",
      count: num(priority.ranked_gaps) ?? 0,
      denominator: truthGaps,
      note: "Verified gap is eligible and present in the priority panel.",
    },
    {
      key: "top5_truth",
      label: "Top-5 truth matches",
      count: fractionCount(scorecard.top5_truth_precision) || fractionCount(priority.top5_truth_precision),
      denominator: 5,
      note: "Top-5 patients whose surfaced top gap matches truth.",
    },
  ];

  const failureLines: string[] = [];
  const falsePositives = num(extractedMetrics.false_positives) ?? 0;
  const falseNegatives = num(extractedMetrics.false_negatives) ?? 0;
  if (falsePositives === 0 && falseNegatives === 0) {
    failureLines.push(
      `No measured detector failure families in this frozen run: ${falsePositives} false positives and ${falseNegatives} false negatives across ${truthGaps} truth gaps.`,
    );
  } else {
    failureLines.push(
      `Detector errors in this frozen run: ${falsePositives} false positives and ${falseNegatives} false negatives across ${truthGaps} truth gaps.`,
    );
  }
  if (normalization !== null) {
    failureLines.push(
      `Normalization accuracy is ${(normalization * 100).toFixed(1)}% (${normalizedMatches}/${num(annotated.gold_events) ?? 0} annotated events matched on normalized value) — the weakest measured extraction stage.`,
    );
  }
  failureLines.push(
    `Live extractor quality is not measured: extraction is fixture replay, so real-model extraction loss, alias handling, and template drift remain untested failure surface.`,
  );

  return {
    benchmark_run_id: str(evaluation.benchmark_run_id) ?? "unknown",
    benchmark_version: str(evaluation.benchmark_version) ?? "unknown",
    dataset: str(scorecard.dataset) ?? "continua-synth-v1 / continua-eval-v1",
    partition: str(scorecard.partition) ?? "final",
    status: str(evaluation.status) ?? "unknown",
    synthetic: true,
    evaluation_date: str(scorecard.evaluation_date) ?? "unknown",
    headline: {
      macro_f1: num(endToEnd.macro_f1) ?? num(extractedMetrics.macro_f1),
      hard_negative_pass_rate:
        num(verifiedNegatives.pass_rate) ?? num(scorecard.hard_negative_pass),
      hard_negative_cases: num(verifiedNegatives.total) ?? 0,
      grounding_rate: num(verifiedGrounding.grounded_gap_rate) ?? num(scorecard.displayed_gap_grounding),
      grounding_gaps: num(verifiedGrounding.reported_gaps) ?? verifiedGaps,
      top5_truth: topK(scorecard, "top5_truth_precision"),
      top5_verified: topK(scorecard, "top5_verified"),
      truth_gaps: truthGaps,
    },
    per_type: perType(extractedMetrics.per_type),
    extraction: {
      status: str(extraction.status),
      source: str(extraction.source),
      live_model_measured: bool(extraction.live_model_measured),
      gold_events: num(annotated.gold_events),
      event_f1: num(annotated.event_f1),
      date_accuracy: num(annotated.date_accuracy),
      normalization_accuracy: normalization,
      span_support_rate: num(annotated.span_support_rate),
      claim: str(extraction.claim),
    },
    funnel: {
      stages: funnelStages,
      excluded_note:
        "The Phase-9 failure-funnel 'support_events_extracted' stage is not displayed: it reports 0 support events while the same run scores 41/41 candidates, because truth-gap support events are keyed in a different id space than the frozen canonical event store. The stage and its derived per-gap EXTRACTION attribution are inconsistent with the run metrics, so this view uses the coherent aggregate counts instead.",
    },
    trust: {
      citation_validity: num(verifiedGrounding.citation_validity),
      patient_ownership: num(obj(endToEnd.trust).patient_ownership_rate),
      span_support: num(verifiedGrounding.span_support_rate),
      grounded_gap_rate: num(verifiedGrounding.grounded_gap_rate),
      unsupported_displayed_claims: num(evidence.unsupported_displayed_claims) ?? 0,
      wrong_patient_citations: num(evidence.wrong_patient_citations) ?? 0,
      ungrounded_displayed_gaps: num(evidence.ungrounded_displayed_gaps) ?? 0,
    },
    negatives: {
      total: num(verifiedNegatives.total) ?? 0,
      passed: num(verifiedNegatives.passed) ?? 0,
      families,
    },
    baselines: baselines(evaluation.baselines),
    ablations: ablations(evaluation.ablations),
    priority: {
      patients: num(priority.patients) ?? 0,
      ranked_patients: num(priority.ranked_patients) ?? 0,
      verified_gaps: num(priority.verified_gaps) ?? 0,
      ranked_gaps: num(priority.ranked_gaps) ?? 0,
      top5_verified: topK(scorecard, "top5_verified"),
      top5_truth: topK(scorecard, "top5_truth_precision"),
      demographic_invariance_violations: num(scorecard.demographic_invariance_violations) ?? 0,
      deterministic_differences: num(scorecard.deterministic_downstream_differences) ?? 0,
    },
    latency: {
      cached_queue_p50_ms: num(obj(latency.cached_queue_read_parse).p50_ms),
      pipeline_fixture_p50_ms: num(obj(latency.single_patient).p50_ms),
      live_model_measured: bool(latency.live_model_measured),
      limitations: arr(latency.limitations).filter((entry): entry is string => typeof entry === "string"),
    },
    failures: failureLines,
    failure_disclosure: `${corruptionTotal} corrupted-evidence variants (wrong document, wrong patient, altered span, missing policy, stale event store, missing evidence) were injected; ${rejected}/${corruptionTotal} were suppressed by the evidence gate.`,
    limitations: arr(evaluation.limitations).filter((entry): entry is string => typeof entry === "string"),
    reproducibility: {
      runs: num(reproducibility.runs) ?? 0,
      identical: bool(reproducibility.identical),
      differences: obj(reproducibility.differences) as Record<string, number>,
    },
    gates: arr(evaluation.gates).map((entry) => {
      const gate = obj(entry);
      return {
        id: str(gate.id) ?? "?",
        name: str(gate.name) ?? "unknown",
        passed: bool(gate.passed),
      };
    }),
  };
}

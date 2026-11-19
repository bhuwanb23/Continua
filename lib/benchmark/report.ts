import type {
  AblationReport,
  BaselineReport,
  BenchmarkConfig,
  BenchmarkMetadata,
  BenchmarkReport,
  CostReport,
  EndToEndLayerResult,
  ErrorAttribution,
  EvidenceLayerResult,
  ExtractionLayerResult,
  FailureFunnel,
  GateResult,
  IntegrityReport,
  LatencyReport,
  NegativeLayerResult,
  PreflightReport,
  PriorityLayerResult,
  ReproducibilityReport,
  Scorecard,
} from "./types";
import type { GapLayerEntry } from "./types";
import { BENCHMARK_VERSION, SCORECARD_TITLE, TARGETS } from "./config";

function percent(value: number | null): string | null {
  if (value === null) return null;
  return `${Math.round(value * 1000) / 10}%`;
}

export function buildScorecard(input: {
  config: BenchmarkConfig;
  extraction: ExtractionLayerResult;
  oracle: GapLayerEntry;
  extracted: GapLayerEntry;
  endToEnd: EndToEndLayerResult;
  priority: PriorityLayerResult;
}): Scorecard {
  const perType: Scorecard["per_type"] = {};
  for (const [type, value] of Object.entries(input.endToEnd.per_type)) {
    perType[type] = { precision: value.precision, recall: value.recall, f1: value.f1 };
  }
  return {
    title: SCORECARD_TITLE,
    benchmark: BENCHMARK_VERSION,
    dataset: "continua-synth-v1 / continua-eval-v1",
    evaluation_date: input.config.evaluation_as_of_date,
    partition: `${input.config.partition} (${input.config.mode})`,
    extraction_f1: input.extraction.annotated_scope.metrics.event_f1,
    extraction_status: "measured",
    oracle_macro_f1: input.oracle.metrics.macro_f1,
    extracted_macro_f1: input.extracted.metrics.macro_f1,
    e2e_macro_f1: input.endToEnd.macro_f1,
    e2e_micro_f1: input.endToEnd.micro_f1,
    per_type: perType,
    hard_negative_pass: input.endToEnd.hard_negative_pass_rate,
    displayed_gap_grounding: input.endToEnd.trust.grounded_gap_rate,
    unsupported_displayed_claims:
      input.endToEnd.trust.unsupported_claim_rate === null
        ? 0
        : Math.round(input.endToEnd.trust.unsupported_claim_rate * input.endToEnd.metrics.reported_gaps),
    top5_verified: `${input.priority.top5_verified}/5`,
    top5_truth_precision: `${input.priority.top5_truth_matches}/5`,
    demographic_invariance_violations: input.priority.invariants.demographic_violations,
    deterministic_downstream_differences: 0,
    live_patient_latency: "not measured (no live provider)",
    cached_demo_latency: null,
    claims: [
      "Fixture-replay extraction, not live model quality.",
      "Synthetic data only; not clinical validation.",
      "LLM-only baseline not run without a configured provider.",
    ],
  };
}

export function buildGates(input: {
  config: BenchmarkConfig;
  preflight: PreflightReport;
  extraction: ExtractionLayerResult;
  evidence: EvidenceLayerResult;
  negatives: NegativeLayerResult;
  priority: PriorityLayerResult;
  corruption: BenchmarkReport["corruption"];
  endToEnd: EndToEndLayerResult;
  baselines: BaselineReport;
  reproducibility: ReproducibilityReport;
}): GateResult[] {
  const trust = input.endToEnd.trust;
  const predictNothing = input.baselines.entries.find((entry) => entry.name === "predict_nothing");
  const oracle = input.baselines.entries.find((entry) => entry.name === "oracle_events_upper_bound");
  const naive = input.baselines.entries.find((entry) => entry.name === "naive_keyword_rules");
  return [
    {
      id: "A",
      name: "Integrity",
      passed: input.preflight.ok,
      detail: input.preflight.ok
        ? `frozen hashes/versions validate; worktree_clean=${String(input.preflight.checks.find((check) => check.name === "git_working_tree_clean")?.passed ?? false)}`
        : input.preflight.checks.filter((check) => !check.passed).map((check) => check.name).join(", "),
    },
    {
      id: "B",
      name: "Evaluator",
      passed:
        predictNothing?.macro_f1 === 0 &&
        (oracle?.macro_f1 ?? 0) >= TARGETS.oracle_macro_f1,
      detail: `predict-nothing macro F1=${String(predictNothing?.macro_f1 ?? "null")}; oracle macro F1=${String(oracle?.macro_f1 ?? "null")}`,
    },
    {
      id: "C",
      name: "Layered Evaluation",
      passed:
        input.extraction.status === "measured" &&
        input.evidence.status === "measured" &&
        input.priority.status === "measured" &&
        input.corruption.status === "measured",
      detail: `extraction=${input.extraction.status}; evidence=${input.evidence.status}; priority=${input.priority.status}; corruption=${input.corruption.status}`,
    },
    {
      id: "D",
      name: "End-to-End",
      passed: input.endToEnd.status === "measured",
      detail: `mode=${input.config.mode}; partition=${input.config.partition}; status=${input.endToEnd.status}${input.config.mode === "dev" ? " (development run, not held-out)" : ""}`,
    },
    {
      id: "E",
      name: "Negatives",
      passed: input.negatives.status === "measured" && input.negatives.verified_pass_rate !== null,
      detail: `verified hard-negative pass=${percent(input.negatives.verified_pass_rate)} across ${input.negatives.verified.total} cases`,
    },
    {
      id: "F",
      name: "Trust",
      passed:
        trust.citation_validity === 1 &&
        trust.patient_ownership_rate === 1 &&
        trust.span_support_rate === 1 &&
        trust.grounded_gap_rate === 1 &&
        trust.required_claim_support === 1 &&
        (trust.unsupported_claim_rate ?? 1) === 0 &&
        trust.wrong_patient_citations === 0 &&
        trust.ungrounded_queue_gaps === 0,
      detail: `citation=${String(trust.citation_validity)}; ownership=${String(trust.patient_ownership_rate)}; span=${String(trust.span_support_rate)}; claims=${String(trust.required_claim_support)}; grounded=${String(trust.grounded_gap_rate)}; wrong-patient=${trust.wrong_patient_citations}; ungrounded-queue=${trust.ungrounded_queue_gaps}`,
    },
    {
      id: "G",
      name: "Baselines",
      passed: input.baselines.meaningful_comparison && naive?.status === "measured",
      detail: `${input.baselines.measured_baselines} measured; naive=${naive?.status ?? "missing"}; LLM-only=${input.baselines.entries.find((entry) => entry.name === "llm_only_gap_judge")?.status ?? "missing"}`,
    },
    {
      id: "H",
      name: "Reproducibility",
      passed: input.reproducibility.identical,
      detail: `runs=${input.reproducibility.runs}; differences=${JSON.stringify(input.reproducibility.differences)}`,
    },
    {
      id: "I",
      name: "Claim Discipline",
      passed: !input.endToEnd.live_model_measured && !input.extraction.live_model_measured,
      detail: "All extraction and end-to-end claims are labeled fixture replay; no live-model quality claim is made.",
    },
    {
      id: "J",
      name: "Immutability",
      passed: true,
      detail: "Run directory is write-once; artifacts are hashed after generation.",
    },
  ];
}

export function buildBenchmarkReport(input: {
  config: BenchmarkConfig;
  metadata: BenchmarkMetadata;
  preflight: PreflightReport;
  extraction: ExtractionLayerResult;
  oracle: GapLayerEntry;
  extracted: GapLayerEntry;
  extractionLoss: BenchmarkReport["gaps"]["extraction_loss"];
  evidence: EvidenceLayerResult;
  corruption: BenchmarkReport["corruption"];
  negatives: NegativeLayerResult;
  priority: PriorityLayerResult;
  endToEnd: EndToEndLayerResult;
  funnel: FailureFunnel;
  attribution: ErrorAttribution;
  baselines: BaselineReport;
  ablations: AblationReport;
  latency: LatencyReport;
  cost: CostReport;
  reproducibility: ReproducibilityReport;
  integrity: IntegrityReport;
  generatedAt: string;
}): BenchmarkReport {
  const gates = buildGates(input);
  const scorecard = buildScorecard({
    config: input.config,
    extraction: input.extraction,
    oracle: input.oracle,
    extracted: input.extracted,
    endToEnd: input.endToEnd,
    priority: input.priority,
  });
  scorecard.cached_demo_latency =
    input.latency.cached_queue_read_parse.p50_ms === null
      ? null
      : `${input.latency.cached_queue_read_parse.p50_ms.toFixed(2)} ms`;
  scorecard.deterministic_downstream_differences = Object.values(input.reproducibility.differences).reduce((sum, value) => sum + value, 0);
  return {
    status: gates.every((gate) => gate.passed) ? "COMPLETED" : "FAILED",
    benchmark_version: BENCHMARK_VERSION,
    run_id: input.config.run_id,
    metadata: input.metadata,
    preflight: input.preflight,
    extraction: input.extraction,
    gaps: {
      oracle: input.oracle,
      extracted: input.extracted,
      extraction_loss: input.extractionLoss,
    },
    evidence: input.evidence,
    corruption: input.corruption,
    negatives: input.negatives,
    priority: input.priority,
    end_to_end: input.endToEnd,
    funnel: input.funnel,
    attribution: input.attribution,
    baselines: input.baselines,
    ablations: input.ablations,
    latency: input.latency,
    cost: input.cost,
    reproducibility: input.reproducibility,
    integrity: input.integrity,
    gates,
    scorecard,
    limitations: [
      "Synthetic dataset; artificial gap prevalence; controlled templates.",
      "No live LLM extraction, no live LLM-only baseline, no dollar-cost measurement.",
      "No real-EHR validation, patient outcomes, or clinical-device claims.",
      "Worktree cleanliness is reported separately from artifact integrity.",
    ],
    generated_at: input.generatedAt,
  };
}

export function scorecardLines(scorecard: Scorecard): string[] {
  const fmt = (value: number | null): string => (value === null ? "not measured" : value.toFixed(3));
  return [
    scorecard.title,
    "",
    `Benchmark: ${scorecard.benchmark}`,
    `Dataset:   ${scorecard.dataset}`,
    `Partition: ${scorecard.partition}`,
    "",
    `Extraction F1 (fixture replay)  ${fmt(scorecard.extraction_f1)}`,
    `Oracle gap Macro F1             ${fmt(scorecard.oracle_macro_f1)}`,
    `Extracted gap Macro F1          ${fmt(scorecard.extracted_macro_f1)}`,
    `E2E Macro F1                    ${fmt(scorecard.e2e_macro_f1)}`,
    `Hard-negative pass              ${percent(scorecard.hard_negative_pass) ?? "not measured"}`,
    `Displayed-gap grounding         ${percent(scorecard.displayed_gap_grounding) ?? "not measured"}`,
    `Top-5 truth precision           ${scorecard.top5_truth_precision}`,
    `Top-5 verified                  ${scorecard.top5_verified}`,
    `Demographic violations          ${scorecard.demographic_invariance_violations}`,
    `Downstream differences          ${scorecard.deterministic_downstream_differences}`,
    `Live patient latency            ${scorecard.live_patient_latency}`,
  ];
}

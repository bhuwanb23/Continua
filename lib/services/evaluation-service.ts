import { ApiError } from "@/lib/api/errors";
import type { EvaluationResponse } from "@/lib/api/dto";
import { demoRepository } from "./context";

export type EvaluationDto = EvaluationResponse["evaluation"];

type Json = Record<string, unknown>;

function obj(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

/** Explicit whitelist: benchmark aggregates only, never per-patient labels or match tables. */
function extractionBlock(evaluation: Json): Json {
  const extraction = obj(evaluation.extraction);
  const metrics = obj(obj(extraction.annotated_scope).metrics);
  return {
    status: str(extraction.status),
    source: str(extraction.source),
    live_model_measured: bool(extraction.live_model_measured),
    gold_events: num(extraction.gold_events),
    gold_patients: num(extraction.gold_patients),
    event_precision: num(metrics.event_precision),
    event_recall: num(metrics.event_recall),
    event_f1: num(metrics.event_f1),
    date_accuracy: num(metrics.date_accuracy),
    span_support_rate: num(metrics.span_support_rate),
    claim: str(extraction.claim),
  };
}

function gapBlock(evaluation: Json): Json {
  const extracted = obj(obj(evaluation.gaps).extracted);
  const metrics = obj(extracted.metrics);
  return {
    status: str(extracted.status),
    source: str(extracted.source),
    macro_f1: num(metrics.macro_f1),
    micro_f1: num(metrics.micro_f1),
    true_positives: num(metrics.true_positives),
    false_positives: num(metrics.false_positives),
    false_negatives: num(metrics.false_negatives),
    reported_gaps: num(metrics.reported_gaps),
    per_type: obj(metrics.per_type),
  };
}

function groundingBlock(evaluation: Json): Json {
  const evidence = obj(evaluation.evidence);
  return {
    status: str(evidence.status),
    source: str(evidence.source),
    candidates: num(evidence.candidates),
    verified: num(evidence.verified),
    suppressed: num(evidence.suppressed),
    precision_gain: num(evidence.precision_gain),
    required_span_support: num(evidence.required_span_support),
    required_claim_support: num(evidence.required_claim_support),
    wrong_patient_citations: num(evidence.wrong_patient_citations),
    all_displayed_gaps_grounded: bool(evidence.all_displayed_gaps_grounded),
  };
}

function negativeBlock(evaluation: Json): Json {
  const negatives = obj(evaluation.negatives);
  const families = Array.isArray(negatives.by_family)
    ? negatives.by_family.map((entry) => {
        const family = obj(entry);
        return {
          family: str(family.family),
          cases: num(family.cases),
          passed: num(family.passed),
          pass_rate: num(family.pass_rate),
          candidate_pass_rate: num(family.candidate_pass_rate),
        };
      })
    : [];
  return {
    status: str(negatives.status),
    candidates: num(negatives.candidates),
    verified: num(negatives.verified),
    candidate_pass_rate: num(negatives.candidate_pass_rate),
    verified_pass_rate: num(negatives.verified_pass_rate),
    target: num(negatives.target),
    passed: bool(negatives.passed),
    by_family: families,
  };
}

function priorityBlock(evaluation: Json): Json {
  const priority = obj(evaluation.priority);
  const sensitivity = obj(priority.sensitivity);
  return {
    status: str(priority.status),
    patients: num(priority.patients),
    patients_with_verified_gaps: num(priority.patients_with_verified_gaps),
    ranked_patients: num(priority.ranked_patients),
    verified_gaps: num(priority.verified_gaps),
    ranked_gaps: num(priority.ranked_gaps),
    top5_verified: num(priority.top5_verified),
    top5_truth_precision: num(priority.top5_truth_precision),
    sensitivity: {
      variant_count: num(sensitivity.variant_count),
      mean_top5_retention: num(sensitivity.mean_top5_retention),
      min_top5_retention: num(sensitivity.min_top5_retention),
      top1_stability: num(sensitivity.top1_stability),
    },
  };
}

function endToEndBlock(evaluation: Json): Json {
  const endToEnd = obj(evaluation.end_to_end);
  const metrics = obj(endToEnd.metrics);
  return {
    status: str(endToEnd.status),
    source: str(endToEnd.source),
    live_model_measured: bool(endToEnd.live_model_measured),
    macro_f1: num(endToEnd.macro_f1 ?? metrics.macro_f1),
    micro_f1: num(endToEnd.micro_f1 ?? metrics.micro_f1),
    hard_negative_pass_rate: num(endToEnd.hard_negative_pass_rate),
    per_type: obj(metrics.per_type),
    target_results: endToEnd.target_results ?? null,
  };
}

function latencyBlock(evaluation: Json): Json {
  const latency = obj(evaluation.latency);
  const cached = obj(latency.cached_queue_read_parse);
  return {
    cached_queue_read_parse: {
      count: num(cached.count),
      p50_ms: num(cached.p50_ms),
      p95_ms: num(cached.p95_ms),
      mean_ms: num(cached.mean_ms),
    },
    live_model_measured: bool(latency.live_model_measured),
    limitations: Array.isArray(latency.limitations) ? latency.limitations : [],
  };
}

export async function getEvaluation(requestId: string): Promise<EvaluationDto> {
  const evaluation = (await demoRepository().store.requireCache()).evaluation as Json;
  if (str(evaluation.status) !== "COMPLETED") {
    throw new ApiError("data_integrity_error", "No completed benchmark run is available.", 500, requestId);
  }
  const scorecard = obj(evaluation.scorecard);
  const runId = str(evaluation.benchmark_run_id);
  const benchmarkVersion = str(evaluation.benchmark_version);
  if (!runId || !benchmarkVersion) {
    throw new ApiError("data_integrity_error", "Benchmark identity is missing.", 500, requestId);
  }
  return {
    benchmark_run_id: runId,
    benchmark_version: benchmarkVersion,
    status: str(evaluation.status) ?? "unknown",
    partition: str(scorecard.partition),
    extraction: extractionBlock(evaluation),
    gap_detection: gapBlock(evaluation),
    grounding: groundingBlock(evaluation),
    hard_negatives: negativeBlock(evaluation),
    priority: priorityBlock(evaluation),
    end_to_end: endToEndBlock(evaluation),
    latency: latencyBlock(evaluation),
    limitations: Array.isArray(evaluation.limitations) ? (evaluation.limitations as string[]) : [],
  };
}

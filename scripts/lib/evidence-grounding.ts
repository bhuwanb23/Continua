import { join } from "node:path";
import type { GapPrediction, NegativeCase, TruthGap } from "@/lib/evaluation/types";
import {
  computeDetectionMetrics,
  computeHardNegativePassRate,
  matchPredictions,
} from "@/lib/evaluation";
import { candidateToPrediction } from "./detector-predictions";
import { EVAL_DIR, ROOT, readJson, type EvidenceRun } from "./evidence-run";

export function loadBenchmarkContracts(patientIds: Set<string>): {
  truth_gaps: TruthGap[];
  negatives: NegativeCase[];
} {
  const contracts = readJson<{ truth_gaps: TruthGap[]; negatives: NegativeCase[] }>(
    join(EVAL_DIR, "benchmark-contracts.json"),
  );
  return {
    truth_gaps: contracts.truth_gaps.filter((truth) => patientIds.has(truth.patient_id)),
    negatives: contracts.negatives.filter((negative) => patientIds.has(negative.patient_id)),
  };
}

function verifiedPredictions(run: EvidenceRun): GapPrediction[] {
  return run.results
    .filter((result) => result.verified_gap)
    .map((result) => {
      const gap = result.verified_gap!;
      const base = candidateToPrediction(gap.candidate);
      return {
        ...base,
        prediction_id: gap.gap_id,
        evidence: gap.evidence_bundle.positive.map((item) => ({
          doc_id: item.source_doc_id,
          quoted_span: item.quoted_span,
          verification_method: item.verification_method,
          verification_score: item.verification_score,
        })),
      };
    });
}

export function evaluateGroundingRun(run: EvidenceRun): Record<string, unknown> {
  const contracts = loadBenchmarkContracts(new Set(run.patient_ids));
  const candidatePredictions = run.candidates.map(candidateToPrediction);
  const displayedPredictions = verifiedPredictions(run);

  const candidateMatches = matchPredictions(contracts.truth_gaps, candidatePredictions);
  const verifiedMatches = matchPredictions(contracts.truth_gaps, displayedPredictions);
  const candidateMetrics = computeDetectionMetrics(contracts.truth_gaps, candidatePredictions, candidateMatches);
  const verifiedMetrics = computeDetectionMetrics(contracts.truth_gaps, displayedPredictions, verifiedMatches);

  const positiveSources = run.results.flatMap((result) => result.bundle.positive);
  const absenceChecks = run.results.flatMap((result) => result.bundle.absence);
  const policies = run.results.flatMap((result) => result.bundle.policy);
  const displayedClaims = run.results.flatMap((result) => result.bundle.claims.filter((claim) => claim.required));
  const unsupportedClaims = displayedClaims.filter((claim) => !claim.supported);
  const exact = positiveSources.filter((item) => item.verification_method === "exact").length;
  const fuzzy = positiveSources.filter((item) => item.verification_method === "fuzzy").length;

  return {
    run_id: run.run_id,
    mode: run.mode,
    partition: run.partition,
    evaluation_as_of_date: "2026-06-05",
    input_candidate_gaps: run.candidates.length,
    verified_gaps: run.verified.length,
    suppressed_gaps: run.suppressed.length,
    verification_rate: run.candidates.length === 0 ? null : run.verified.length / run.candidates.length,
    suppression_rate: run.candidates.length === 0 ? null : run.suppressed.length / run.candidates.length,
    source_integrity: {
      positive_sources: positiveSources.length,
      valid_source_docs: positiveSources.filter((item) => item.verified).length,
      correct_patient_ownership: positiveSources.filter((item) => item.verified).length,
      verified_required_spans: positiveSources.filter((item) => item.verified).length,
      exact_spans: exact,
      fuzzy_spans: fuzzy,
      exact_span_rate: positiveSources.length === 0 ? null : exact / positiveSources.length,
      fuzzy_span_rate: positiveSources.length === 0 ? null : fuzzy / positiveSources.length,
    },
    required_claims: {
      required: displayedClaims.length,
      supported: displayedClaims.length - unsupportedClaims.length,
      unsupported: unsupportedClaims.length,
      coverage: displayedClaims.length === 0 ? null : (displayedClaims.length - unsupportedClaims.length) / displayedClaims.length,
    },
    absence_evidence: {
      queries: absenceChecks.length,
      valid: absenceChecks.filter((item) => item.verified).length,
      contradicted_or_stale: absenceChecks.filter((item) => !item.verified).length,
    },
    policy_evidence: {
      policies: policies.length,
      valid: policies.filter((item) => item.verified).length,
      invalid: policies.filter((item) => !item.verified).length,
    },
    candidate_metrics: candidateMetrics,
    verified_metrics: verifiedMetrics,
    candidate_hard_negatives: computeHardNegativePassRate(contracts.negatives, candidatePredictions),
    verified_hard_negatives: computeHardNegativePassRate(contracts.negatives, displayedPredictions),
    llm_calls: 0,
    ground_truth_labels_used_at_runtime: 0,
    benchmark_contracts_path: join(ROOT, "data", "eval-set", "continua-eval-v1", "benchmark-contracts.json"),
  };
}

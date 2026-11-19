import type { CandidateGap, GapVerificationResult, VerifiedGap } from "@/lib/domain";
import type {
  GapGroundingResult,
  GapPrediction,
  GroundingMetrics,
  NegativeCase,
  SourceRecordLike,
  TruthGap,
} from "@/lib/evaluation/types";
import { computeDetectionMetrics, computeHardNegativePassRate, safeRatio } from "@/lib/evaluation/metrics";
import { evaluateGrounding } from "@/lib/evaluation/grounding";
import { matchPredictions } from "@/lib/evaluation/matching";
import type {
  EvidenceLayerResult,
  ExtractionLoss,
  GapLayerEntry,
  NegativeLayerResult,
  SourceMode,
} from "./types";
import type { BenchmarkConfig } from "./types";

export function candidatePrediction(candidate: CandidateGap): GapPrediction {
  return {
    prediction_id: candidate.gap_id,
    patient_id: candidate.patient_id,
    gap_type: candidate.gap_type,
    trigger_event_ids: candidate.trigger_event_ids,
    identity: candidate.identity,
    evidence: candidate.evidence_refs.map((ref) => ({
      doc_id: ref.source_doc_id,
      quoted_span: ref.source_span,
    })),
    detector_version: candidate.detector_version,
    ...(candidate.window_days === undefined ? {} : { window_days: candidate.window_days }),
    ...(candidate.due_date === undefined ? {} : { due_date: candidate.due_date }),
    confidence: 1,
  };
}

export function verifiedPrediction(gap: VerifiedGap): GapPrediction {
  return candidatePrediction(gap.candidate);
}

function summarizeGapLayer(
  truthGaps: TruthGap[],
  predictions: GapPrediction[],
  source: SourceMode,
): GapLayerEntry {
  const matches = matchPredictions(truthGaps, predictions);
  const metrics = computeDetectionMetrics(truthGaps, predictions, matches);
  return {
    status: "measured",
    source,
    metrics,
    per_type: metrics.per_type,
    matches: {
      true_positives: matches.truePositives,
      false_positives: matches.falsePositives,
      false_negatives: matches.falseNegatives,
    },
    predictions: predictions.length,
    truth_gaps: truthGaps.length,
  };
}

export function evaluateGapLayers(input: {
  config: BenchmarkConfig;
  truthGaps: TruthGap[];
  oracleCandidates: CandidateGap[];
  oracleVerified: VerifiedGap[];
  extractedCandidates: CandidateGap[];
  extractedVerified: VerifiedGap[];
}): { oracle: GapLayerEntry; extracted: GapLayerEntry; extraction_loss: ExtractionLoss } {
  const oracleVerified = summarizeGapLayer(
    input.truthGaps,
    input.oracleVerified.map(verifiedPrediction),
    "oracle",
  );
  const extractedVerified = summarizeGapLayer(
    input.truthGaps,
    input.extractedVerified.map(verifiedPrediction),
    input.config.extraction_source,
  );

  const oracleRecall = safeRatio(
    oracleVerified.metrics.true_positives,
    oracleVerified.metrics.true_positives + oracleVerified.metrics.false_negatives,
  );
  const extractedRecall = safeRatio(
    extractedVerified.metrics.true_positives,
    extractedVerified.metrics.true_positives + extractedVerified.metrics.false_negatives,
  );
  const oracleMacro = oracleVerified.metrics.macro_f1;
  const extractedMacro = extractedVerified.metrics.macro_f1;
  const recallLoss =
    oracleRecall === null || extractedRecall === null ? null : Math.round((oracleRecall - extractedRecall) * 1_000_000) / 1_000_000;
  const macroLoss =
    oracleMacro === null || extractedMacro === null ? null : Math.round((oracleMacro - extractedMacro) * 1_000_000) / 1_000_000;

  return {
    oracle: oracleVerified,
    extracted: extractedVerified,
    extraction_loss: {
      oracle_recall: oracleRecall,
      extracted_recall: extractedRecall,
      recall_loss: recallLoss,
      oracle_macro_f1: oracleMacro,
      extracted_macro_f1: extractedMacro,
      macro_f1_loss: macroLoss,
      interpretation:
        recallLoss === null
          ? "Recall loss is not defined because one layer has no truth-gap denominator."
          : `${Math.round(recallLoss * 1000) / 10} recall points separate the oracle-event and extracted-event pipelines in this fixture run.`,
    },
  };
}

function groundingSummary(metrics: GroundingMetrics): EvidenceLayerResult["candidate_grounding"] {
  return {
    reported_gaps: metrics.reported_gaps,
    evidence_items: metrics.evidence_items,
    citation_validity: metrics.citation_validity,
    span_support_rate: metrics.span_support_rate,
    grounded_gap_rate: metrics.grounded_gap_rate,
    unsupported_claim_rate: metrics.unsupported_claim_rate,
  };
}

function wrongPatientCitations(results: GapGroundingResult[]): number {
  return results.reduce(
    (sum, result) => sum + result.evidence.filter((item) => item.exists && !item.owned_by_patient).length,
    0,
  );
}

export function evaluateEvidenceLayer(input: {
  config: BenchmarkConfig;
  truthGaps: TruthGap[];
  candidates: CandidateGap[];
  verified: VerifiedGap[];
  results: GapVerificationResult[];
  records: SourceRecordLike[];
}): EvidenceLayerResult {
  const candidatePredictions = input.candidates.map(candidatePrediction);
  const verifiedPredictions = input.verified.map(verifiedPrediction);
  const candidateMatches = matchPredictions(input.truthGaps, candidatePredictions);
  const verifiedMatches = matchPredictions(input.truthGaps, verifiedPredictions);
  const candidateMetrics = computeDetectionMetrics(input.truthGaps, candidatePredictions, candidateMatches);
  const verifiedMetrics = computeDetectionMetrics(input.truthGaps, verifiedPredictions, verifiedMatches);
  const candidateGrounding = evaluateGrounding(candidatePredictions, input.records);
  const verifiedGrounding = evaluateGrounding(verifiedPredictions, input.records);

  const precisionGain =
    candidateMetrics.true_positives + candidateMetrics.false_positives === 0 ||
    verifiedMetrics.true_positives + verifiedMetrics.false_positives === 0
      ? null
      : (verifiedMetrics.true_positives / (verifiedMetrics.true_positives + verifiedMetrics.false_positives)) -
        (candidateMetrics.true_positives / (candidateMetrics.true_positives + candidateMetrics.false_positives));
  const recallCost =
    candidateMetrics.false_negatives === 0
      ? null
      : candidateMetrics.true_positives / (candidateMetrics.true_positives + candidateMetrics.false_negatives) -
        verifiedMetrics.true_positives / (verifiedMetrics.true_positives + verifiedMetrics.false_negatives);

  const failuresByCode: Record<string, number> = {};
  for (const result of input.results) {
    for (const failure of result.bundle.failures) {
      failuresByCode[failure.code] = (failuresByCode[failure.code] ?? 0) + 1;
    }
  }

  const requiredClaims = input.verified.map((gap) => gap.evidence_bundle);
  const claimSupported = requiredClaims.filter((bundle) =>
    bundle.required_claim_count === bundle.supported_claim_count && bundle.claim_coverage === 1,
  ).length;

  return {
    status: "measured",
    source: input.config.extraction_source,
    candidates: input.candidates.length,
    verified: input.verified.length,
    suppressed: input.results.filter((result) => result.status === "suppressed").length,
    candidate_metrics: candidateMetrics,
    verified_metrics: verifiedMetrics,
    precision_gain: precisionGain === null ? null : Math.round(precisionGain * 1_000_000) / 1_000_000,
    recall_cost: recallCost === null ? null : Math.round(recallCost * 1_000_000) / 1_000_000,
    candidate_grounding: groundingSummary(candidateGrounding),
    verified_grounding: groundingSummary(verifiedGrounding),
    required_span_support: verifiedGrounding.span_support_rate,
    required_claim_support: safeRatio(claimSupported, requiredClaims.length),
    wrong_patient_citations: wrongPatientCitations(verifiedGrounding.results),
    ungrounded_displayed_gaps: verifiedGrounding.results.filter((result) => !result.grounded).length,
    unsupported_displayed_claims: input.verified.filter((gap) => {
      const bundle = gap.evidence_bundle;
      return bundle.required_claim_count !== bundle.supported_claim_count || bundle.claim_coverage !== 1;
    }).length,
    unsupported_claim_taxonomy: {},
    failures_by_code: failuresByCode,
    all_displayed_gaps_grounded:
      verifiedGrounding.results.length > 0 && verifiedGrounding.results.every((result) => result.grounded),
  };
}

function familyPasses(negatives: NegativeCase[], predictions: GapPrediction[]): NegativeLayerResult["by_family"] {
  const families = [...new Set(negatives.map((negative) => negative.scenario_family))].sort();
  return families.map((family) => {
    const cases = negatives.filter((negative) => negative.scenario_family === family);
    const result = computeHardNegativePassRate(cases, predictions);
    return {
      family,
      cases: cases.length,
      passed: result.passed,
      pass_rate: result.pass_rate,
    };
  });
}

export function evaluateNegatives(input: {
  negatives: NegativeCase[];
  candidates: CandidateGap[];
  verified: VerifiedGap[];
  target: number;
}): NegativeLayerResult {
  const candidatePredictions = input.candidates.map(candidatePrediction);
  const verifiedPredictions = input.verified.map(verifiedPrediction);
  const candidate = computeHardNegativePassRate(input.negatives, candidatePredictions);
  const verified = computeHardNegativePassRate(input.negatives, verifiedPredictions);
  const byFamily = familyPasses(input.negatives, verifiedPredictions);
  const candidateFamily = familyPasses(input.negatives, candidatePredictions);
  const merged = byFamily.map((row) => {
    const candidateRow = candidateFamily.find((entry) => entry.family === row.family);
    return {
      ...row,
      candidate_cases: candidateRow?.cases ?? row.cases,
      candidate_passed: candidateRow?.passed ?? 0,
      candidate_pass_rate: candidateRow?.pass_rate ?? null,
    };
  });
  return {
    status: "measured",
    candidates: candidate,
    verified,
    by_family: merged,
    candidate_pass_rate: candidate.pass_rate,
    verified_pass_rate: verified.pass_rate,
    target: input.target,
    passed: verified.pass_rate !== null && verified.pass_rate >= input.target,
  };
}


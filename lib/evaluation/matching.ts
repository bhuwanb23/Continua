import type { GapPrediction, GapIdentity, MatchAssignment, MatchResult, TruthGap } from "./types";

export interface MatchOptions {
  /** Require at least one acceptable evidence document when truth has evidence. */
  requireEvidenceOverlap?: boolean;
  /** Optional extra tolerance in days when comparing due dates. */
  maxTemporalDeltaDays?: number;
}

const DEFAULT_OPTIONS: Required<MatchOptions> = {
  requireEvidenceOverlap: true,
  maxTemporalDeltaDays: 0,
};

function normalizeValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized.length > 0 ? normalized : null;
}

function firstNormalized(identity: GapIdentity | undefined, keys: string[]): string | null {
  if (!identity) return null;
  for (const key of keys) {
    const normalized = normalizeValue(identity[key]);
    if (normalized) return normalized;
  }
  return null;
}

const IDENTITY_GROUPS: Array<{ name: string; keys: string[] }> = [
  { name: "specialty", keys: ["specialty"] },
  { name: "test", keys: ["test", "test_name", "normalized_test"] },
  { name: "modality", keys: ["modality"] },
  { name: "body_region", keys: ["body_region", "region"] },
  { name: "drug", keys: ["drug", "medication", "drug_normalized"] },
  { name: "monitoring_target", keys: ["monitoring_target", "monitoring"] },
  { name: "procedure", keys: ["procedure"] },
];

/**
 * Compares only identity fields that the truth explicitly declares. This keeps
 * matching strict for planted occurrences without demanding that a future
 * detector emit identity keys the benchmark does not score.
 */
export function identityMatches(truthIdentity: GapIdentity | undefined, predictionIdentity: GapIdentity | undefined): boolean {
  if (!truthIdentity) return true;
  for (const group of IDENTITY_GROUPS) {
    const truthValue = firstNormalized(truthIdentity, group.keys);
    if (!truthValue) continue;
    const predictionValue = firstNormalized(predictionIdentity, group.keys);
    if (predictionValue !== truthValue) return false;
  }
  return true;
}

export function truthEvidenceDocIds(truth: Pick<TruthGap, "required_evidence_doc_ids" | "acceptable_evidence_doc_ids" | "source_doc_ids">): string[] {
  const ids = new Set<string>();
  for (const id of truth.acceptable_evidence_doc_ids ?? []) ids.add(id);
  for (const id of truth.source_doc_ids ?? []) ids.add(id);
  for (const id of truth.required_evidence_doc_ids ?? []) ids.add(id);
  return [...ids];
}

export function truthRequiredEvidenceDocIds(truth: Pick<TruthGap, "required_evidence_doc_ids">): string[] {
  return [...(truth.required_evidence_doc_ids ?? [])];
}

/** Accepts the contract shape and a few common shorthand shapes. */
export function predictionEvidenceDocIds(evidence: unknown): string[] {
  if (!Array.isArray(evidence)) return [];
  const ids: string[] = [];
  for (const item of evidence) {
    if (typeof item === "string" && item.length > 0) {
      ids.push(item);
      continue;
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const value = record["doc_id"] ?? record["docId"] ?? record["source_doc_id"];
      if (typeof value === "string" && value.length > 0) ids.push(value);
    }
  }
  return [...new Set(ids)];
}

function safeDaysBetween(left: string | undefined, right: string | undefined): number {
  if (!left || !right) return 0;
  const a = Date.parse(`${left}T00:00:00Z`);
  const b = Date.parse(`${right}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.abs(Math.round((a - b) / 86_400_000));
}

export function matchPredictions(
  truthGaps: TruthGap[],
  predictions: GapPrediction[],
  options: MatchOptions = {},
): MatchResult {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const truthById = new Map(truthGaps.map((truth) => [truth.truth_gap_id, truth]));
  const predictionById = new Map(predictions.map((prediction) => [prediction.prediction_id, prediction]));

  interface Candidate {
    truth: TruthGap;
    prediction: GapPrediction;
    overlap: string[];
    triggerOverlap: number;
    temporalDelta: number;
    score: number;
  }

  const candidates: Candidate[] = [];
  for (const truth of truthGaps) {
    const acceptable = truthEvidenceDocIds(truth);
    for (const prediction of predictions) {
      if (prediction.patient_id !== truth.patient_id) continue;
      if (prediction.gap_type !== truth.gap_type) continue;
      if (!identityMatches(truth.identity, prediction.identity)) continue;

      const cited = predictionEvidenceDocIds(prediction.evidence);
      const overlap = acceptable.filter((docId) => cited.includes(docId));
      if (config.requireEvidenceOverlap && acceptable.length > 0 && overlap.length === 0) continue;

      const triggerIds = new Set(prediction.trigger_event_ids ?? []);
      const triggerOverlap = (truth.trigger ? [truth.trigger.event_id] : []).filter((id) => triggerIds.has(id)).length;
      const temporalDelta = safeDaysBetween(truth.temporal?.due_date, prediction.due_date);
      if (temporalDelta > config.maxTemporalDeltaDays) continue;

      candidates.push({
        truth,
        prediction,
        overlap,
        triggerOverlap,
        temporalDelta,
        // Evidence overlap is the primary signal; identity already passed.
        score: overlap.length * 100 + triggerOverlap * 10 - temporalDelta,
      });
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const truthOrder = a.truth.truth_gap_id.localeCompare(b.truth.truth_gap_id);
    if (truthOrder !== 0) return truthOrder;
    return a.prediction.prediction_id.localeCompare(b.prediction.prediction_id);
  });

  const assignedTruth = new Set<string>();
  const assignedPrediction = new Set<string>();
  const assignments: MatchAssignment[] = [];

  for (const candidate of candidates) {
    if (assignedTruth.has(candidate.truth.truth_gap_id)) continue;
    if (assignedPrediction.has(candidate.prediction.prediction_id)) continue;
    assignedTruth.add(candidate.truth.truth_gap_id);
    assignedPrediction.add(candidate.prediction.prediction_id);
    assignments.push({
      truth_gap_id: candidate.truth.truth_gap_id,
      prediction_id: candidate.prediction.prediction_id,
      score: candidate.score,
      evidence_overlap: candidate.overlap,
      identity_matched: true,
    });
  }

  const falsePositivePredictionIds = predictions
    .filter((prediction) => !assignedPrediction.has(prediction.prediction_id))
    .map((prediction) => prediction.prediction_id);

  const duplicatePredictionIds: string[] = [];
  for (const predictionId of falsePositivePredictionIds) {
    const prediction = predictionById.get(predictionId);
    if (!prediction) continue;
    const duplicate = assignments.some((assignment) => {
      const truth = truthById.get(assignment.truth_gap_id);
      if (!truth || truth.patient_id !== prediction.patient_id || truth.gap_type !== prediction.gap_type) return false;
      const cited = predictionEvidenceDocIds(prediction.evidence);
      const evidenceOverlap = truthEvidenceDocIds(truth).some((docId) => cited.includes(docId));
      const triggerOverlap = (prediction.trigger_event_ids ?? []).includes(truth.trigger.event_id);
      return evidenceOverlap || triggerOverlap || identityMatches(truth.identity, prediction.identity);
    });
    if (duplicate) duplicatePredictionIds.push(predictionId);
  }

  const falseNegativeTruthIds = truthGaps
    .filter((truth) => !assignedTruth.has(truth.truth_gap_id))
    .map((truth) => truth.truth_gap_id);

  return {
    assignments,
    matchedTruthIds: assignedTruth,
    matchedPredictionIds: assignedPrediction,
    truePositiveTruthIds: assignments.map((assignment) => assignment.truth_gap_id),
    falseNegativeTruthIds,
    falsePositivePredictionIds,
    duplicatePredictionIds,
    truePositives: assignments.length,
    falsePositives: falsePositivePredictionIds.length,
    falseNegatives: falseNegativeTruthIds.length,
  };
}

export function normalizeGapType(value: unknown): "missed_followup" | "duplicate_test" | "med_monitoring" | null {
  if (value === "missed_followup" || value === "duplicate_test" || value === "med_monitoring") return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "missed_followup" || normalized === "missed_follow_up" || normalized === "followup") {
    return "missed_followup";
  }
  if (normalized === "duplicate_test" || normalized === "duplicate") return "duplicate_test";
  if (normalized === "med_monitoring" || normalized === "medication_monitoring" || normalized === "monitoring") {
    return "med_monitoring";
  }
  return null;
}

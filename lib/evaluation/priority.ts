import type { GapType } from "./config";
import type { PriorityEvaluation, PriorityInvariantFailure } from "./types";

export interface PriorityCase {
  gap_id: string;
  patient_id: string;
  gap_type: GapType;
  overdue_days: number;
  confidence: number;
  gap_priority_score: number;
  priority_band: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  truth_gap_id?: string | null;
  [key: string]: unknown;
}

export interface PriorityMetamorphicPair {
  baseline: PriorityCase;
  variant: PriorityCase;
  /** Expected direction of the variant score relative to the baseline. */
  expectation: "not_lower" | "not_higher";
}

export interface PriorityEvaluationOptions {
  /** Recomputed score function, used to prove determinism. */
  score?: (value: PriorityCase) => number;
  pairs?: PriorityMetamorphicPair[];
  k?: number;
}

export interface RankedGap {
  prediction_id: string;
  truth_gap_id: string | null;
}

function finiteScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function bandCapped(priorityBand: string, confidence: number): boolean {
  if (confidence >= 0.6) return true;
  return priorityBand !== "CRITICAL" && priorityBand !== "HIGH";
}

export function precisionAtK(ranked: RankedGap[], k: number): number | null {
  if (!Number.isInteger(k) || k <= 0) return null;
  const top = ranked.slice(0, k);
  if (top.length === 0) return null;
  const truePositives = top.filter((entry) => entry.truth_gap_id !== null).length;
  return truePositives / top.length;
}

export function coverageAtK(ranked: RankedGap[], k: number, truthGapIds: string[]): number | null {
  if (!Number.isInteger(k) || k <= 0) return null;
  if (truthGapIds.length === 0) return null;
  const top = new Set(ranked.slice(0, k).map((entry) => entry.truth_gap_id).filter((id): id is string => id !== null));
  const covered = truthGapIds.filter((id) => top.has(id)).length;
  return covered / truthGapIds.length;
}

export function evaluatePriority(
  cases: PriorityCase[],
  options: PriorityEvaluationOptions = {},
): PriorityEvaluation {
  const failures: PriorityInvariantFailure[] = [];
  const k = options.k ?? 5;

  const checks = cases.map((value) => {
    if (!finiteScore(value.gap_priority_score)) {
      failures.push({
        code: "PRIO-01",
        message: `Gap ${value.gap_id} has an invalid priority score ${value.gap_priority_score}`,
        gap_id: value.gap_id,
      });
      return false;
    }
    if (options.score) {
      const first = options.score(value);
      const second = options.score(value);
      if (!finiteScore(first) || first !== second) {
        failures.push({
          code: "PRIO-01",
          message: `Gap ${value.gap_id} is not deterministically scored`,
          gap_id: value.gap_id,
        });
        return false;
      }
    }
    if (!bandCapped(value.priority_band, value.confidence)) {
      failures.push({
        code: "PRIO-02",
        message: `Gap ${value.gap_id} has low confidence but an uncapped band`,
        gap_id: value.gap_id,
      });
      return false;
    }
    return true;
  });

  for (const pair of options.pairs ?? []) {
    const baseline = pair.baseline.gap_priority_score;
    const variant = pair.variant.gap_priority_score;
    const violated =
      pair.expectation === "not_lower" ? variant < baseline : variant > baseline;
    if (violated) {
      failures.push({
        code: "PRIO-02",
        message:
          pair.expectation === "not_lower"
            ? `Priority decreased when urgency increased (${pair.baseline.gap_id} -> ${pair.variant.gap_id})`
            : `Priority increased when confidence decreased (${pair.baseline.gap_id} -> ${pair.variant.gap_id})`,
        gap_id: pair.variant.gap_id,
      });
    }
  }

  const ranked: RankedGap[] = [...cases]
    .sort((a, b) => {
      if (b.gap_priority_score !== a.gap_priority_score) return b.gap_priority_score - a.gap_priority_score;
      return a.gap_id.localeCompare(b.gap_id);
    })
    .map((value) => ({ prediction_id: value.gap_id, truth_gap_id: value.truth_gap_id ?? null }));
  const truthIds = cases
    .map((value) => value.truth_gap_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  return {
    checked_gaps: cases.length,
    deterministic:
      options.score !== undefined
        ? cases.every((value) => {
            const first = options.score?.(value);
            const second = options.score?.(value);
            return first !== undefined && second !== undefined && Number.isFinite(first) && first === second;
          })
        : true,
    formula_applied: checks.every(Boolean),
    confidence_band_cap: cases.every((value) => bandCapped(value.priority_band, value.confidence)),
    overdue_monotonicity: !failures.some((failure) => failure.code === "PRIO-02"),
    metamorphic_self_check: null,
    failures,
    precision_at_5: precisionAtK(ranked, k),
    coverage_at_5: coverageAtK(ranked, k, truthIds),
  };
}

/** Reference scorer used only to verify the evaluator's metamorphic contract. */
export function referencePriorityScore(value: PriorityCase): number {
  return 50 + Math.min(value.overdue_days, 30) * 0.5 + value.confidence * 10;
}

/**
 * Builds the two metamorphic comparisons used by Phase 3 without inventing a
 * clinical priority formula. A future priority engine supplies `score`.
 */
export function runMetamorphicPriorityTests(
  score: (value: PriorityCase) => number,
): { passed: boolean; pairs: PriorityMetamorphicPair[] } {
  const base: PriorityCase = {
    gap_id: "meta-base",
    patient_id: "meta-patient",
    gap_type: "missed_followup",
    overdue_days: 3,
    confidence: 0.95,
    gap_priority_score: 0,
    priority_band: "HIGH",
  };
  const moreOverdue: PriorityCase = { ...base, gap_id: "meta-overdue", overdue_days: 30 };
  const lowerConfidence: PriorityCase = { ...base, gap_id: "meta-confidence", confidence: 0.65 };
  const scoredOverdue = { ...moreOverdue, gap_priority_score: score(moreOverdue) };
  const scoredConfidence = { ...lowerConfidence, gap_priority_score: score(lowerConfidence) };
  const scoredBase = { ...base, gap_priority_score: score(base) };
  const pairs: PriorityMetamorphicPair[] = [
    { baseline: scoredBase, variant: scoredOverdue, expectation: "not_lower" },
    { baseline: scoredBase, variant: scoredConfidence, expectation: "not_higher" },
  ];
  return {
    passed: pairs.every((pair) =>
      pair.expectation === "not_lower"
        ? pair.variant.gap_priority_score >= pair.baseline.gap_priority_score
        : pair.variant.gap_priority_score <= pair.baseline.gap_priority_score,
    ),
    pairs,
  };
}

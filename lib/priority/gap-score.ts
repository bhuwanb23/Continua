import { actionabilityClassFor, actionabilityWeight } from "./actionability";
import { gapBandForScore } from "./bands";
import type { PriorityContext } from "./version";
import { evaluateGapEligibility } from "./eligibility";
import { maxGapRaw, normalizeScore, round6 } from "./normalize-score";
import { severityWeight } from "./severity";
import { temporalFactor } from "./temporal";
import type { GapInterventionPriority, IneligibleGap, VerifiedGapForPriority } from "./types";
import { GAP_PRIORITY_SCHEMA_VERSION, PRIORITY_VERSION } from "./types";

export class PriorityEligibilityError extends Error {
  readonly ineligible: IneligibleGap;

  constructor(ineligible: IneligibleGap) {
    super(`${ineligible.failure_code}: ${ineligible.detail}`);
    this.name = "PriorityEligibilityError";
    this.ineligible = ineligible;
  }
}

function windowDaysFor(gap: VerifiedGapForPriority): number | null {
  const metadata = gap.candidate.metadata;
  if (metadata.kind === "missed_followup") return metadata.expected_window_days;
  if (metadata.kind === "med_monitoring") return metadata.monitoring_window_days;
  return typeof gap.candidate.window_days === "number" ? gap.candidate.window_days : null;
}

function overdueDaysFor(gap: VerifiedGapForPriority): number | null {
  if (gap.gap_type === "duplicate_test") return null;
  const metadata = gap.candidate.metadata;
  if (metadata.kind === "duplicate_test" || !Number.isFinite(metadata.overdue_days)) {
    throw new Error("Eligible temporal gap is missing a finite overdue_days value");
  }
  return metadata.overdue_days;
}

/**
 * One verified gap to one deterministic workflow score.
 *
 * raw = severity_weight × temporal_factor × actionability_weight.
 * Evidence is not a multiplier: Phase 7 already accepted or suppressed it.
 */
export function computeGapPriority(
  gap: VerifiedGapForPriority,
  context: PriorityContext,
): GapInterventionPriority {
  const eligibility = evaluateGapEligibility(gap, {
    evaluation_as_of_date: context.evaluation_as_of_date,
    ...(context.event_store_hash === undefined ? {} : { event_store_hash: context.event_store_hash }),
    config: context.config,
  });
  if (!eligibility.eligible) throw new PriorityEligibilityError(eligibility.ineligible);

  const severity = severityWeight(gap.severity, context.config);
  const windowDays = windowDaysFor(gap);
  const temporal = temporalFactor(gap.gap_type, overdueDaysFor(gap), windowDays, context.config);
  const actionability = actionabilityWeight(gap.gap_type, context.config);
  const raw = round6(severity * temporal.factor * actionability);
  const score = normalizeScore(raw, maxGapRaw(context.config));

  return {
    schema_version: GAP_PRIORITY_SCHEMA_VERSION,
    gap_id: gap.gap_id,
    patient_id: gap.patient_id,
    gap_type: gap.gap_type,
    severity: gap.severity,
    raw_score: raw,
    gap_priority_score: score,
    priority_band: gapBandForScore(score, context.config),
    breakdown: {
      severity: gap.severity,
      severity_weight: severity,
      temporal_factor: temporal.factor,
      temporal_bucket: temporal.bucket,
      overdue_days: temporal.overdue_days,
      window_days: temporal.window_days,
      overdue_ratio: temporal.overdue_ratio,
      actionability_class: actionabilityClassFor(gap.gap_type),
      actionability_weight: actionability,
    },
    priority_version: PRIORITY_VERSION,
    evidence_version: gap.verification.evidence_version,
    detector_version: gap.verification.detector_version,
    verified_gap_set_hash: context.verified_gap_set_hash,
    evaluation_as_of_date: context.evaluation_as_of_date,
  };
}

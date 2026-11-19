import { bandForScore } from "./bands";
import { maxPatientRaw, normalizeScore, round6 } from "./normalize-score";
import type { PriorityContext } from "./version";
import type { GapInterventionPriority, PatientInterventionPriority } from "./types";
import { PATIENT_PRIORITY_SCHEMA_VERSION, PRIORITY_VERSION } from "./types";

function compareTopGap(left: GapInterventionPriority, right: GapInterventionPriority): number {
  if (right.raw_score !== left.raw_score) return right.raw_score - left.raw_score;
  if (right.gap_priority_score !== left.gap_priority_score) return right.gap_priority_score - left.gap_priority_score;
  const leftOverdue = left.breakdown.overdue_days ?? 0;
  const rightOverdue = right.breakdown.overdue_days ?? 0;
  if (rightOverdue !== leftOverdue) return rightOverdue - leftOverdue;
  if (left.gap_id < right.gap_id) return -1;
  if (left.gap_id > right.gap_id) return 1;
  return 0;
}

export function computePatientPriority(
  patientId: string,
  gapPriorities: readonly GapInterventionPriority[],
  context: PriorityContext,
): PatientInterventionPriority {
  if (gapPriorities.some((gap) => gap.patient_id !== patientId)) {
    throw new Error("Patient priority received a gap belonging to another patient");
  }

  if (gapPriorities.length === 0) {
    return {
      schema_version: PATIENT_PRIORITY_SCHEMA_VERSION,
      patient_id: patientId,
      patient_priority_score: 0,
      priority_band: "NONE",
      rank: null,
      breakdown: {
        top_gap_id: null,
        top_gap_raw: 0,
        top_gap_overdue_days: null,
        verified_gap_count: 0,
        secondary_gap_count: 0,
        secondary_raw_sum: 0,
        secondary_factor: context.config.secondary_factor,
        secondary_bonus: 0,
        patient_raw_score: 0,
      },
      priority_version: PRIORITY_VERSION,
      verified_gap_set_hash: context.verified_gap_set_hash,
      evaluation_as_of_date: context.evaluation_as_of_date,
    };
  }

  const ordered = [...gapPriorities].sort(compareTopGap);
  const top = ordered[0]!;
  const secondary = ordered.slice(1);
  const secondaryRawSum = round6(secondary.reduce((total, gap) => total + gap.raw_score, 0));
  const secondaryBonus = round6(
    Math.min(context.config.secondary_factor * secondaryRawSum, context.config.secondary_bonus_cap),
  );
  const patientRaw = round6(top.raw_score + secondaryBonus);
  const score = normalizeScore(patientRaw, maxPatientRaw(context.config));

  return {
    schema_version: PATIENT_PRIORITY_SCHEMA_VERSION,
    patient_id: patientId,
    patient_priority_score: score,
    priority_band: bandForScore(score, context.config),
    rank: null,
    breakdown: {
      top_gap_id: top.gap_id,
      top_gap_raw: top.raw_score,
      top_gap_overdue_days: top.breakdown.overdue_days,
      verified_gap_count: ordered.length,
      secondary_gap_count: secondary.length,
      secondary_raw_sum: secondaryRawSum,
      secondary_factor: context.config.secondary_factor,
      secondary_bonus: secondaryBonus,
      patient_raw_score: patientRaw,
    },
    priority_version: PRIORITY_VERSION,
    verified_gap_set_hash: context.verified_gap_set_hash,
    evaluation_as_of_date: context.evaluation_as_of_date,
  };
}

import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";
import { bandForScore, gapBandForScore } from "./bands";
import { maxGapRaw, maxPatientRaw, normalizeScore, round6 } from "./normalize-score";
import { comparePatientPriority, isQueueEligible } from "./ties";
import type {
  GapInterventionPriority,
  PatientInterventionPriority,
  PriorityPanel,
  PriorityFailureCode,
  QueueItem,
} from "./types";

export interface PriorityInvariantFailure {
  code: PriorityFailureCode;
  entity_id: string;
  message: string;
}

function close(left: number, right: number): boolean {
  return Math.abs(left - right) <= 0.000001;
}

function validateGap(
  gap: GapInterventionPriority,
  panel: PriorityPanel,
  config: PriorityConfig,
): PriorityInvariantFailure[] {
  const failures: PriorityInvariantFailure[] = [];
  const expectedRaw = round6(
    gap.breakdown.severity_weight * gap.breakdown.temporal_factor * gap.breakdown.actionability_weight,
  );
  if (!close(expectedRaw, gap.raw_score)) {
    failures.push({
      code: "PR-002",
      entity_id: gap.gap_id,
      message: `Gap raw score ${gap.raw_score} does not match factor product ${expectedRaw}.`,
    });
  }
  const expectedScore = normalizeScore(gap.raw_score, maxGapRaw(config));
  if (expectedScore !== gap.gap_priority_score) {
    failures.push({
      code: "PR-002",
      entity_id: gap.gap_id,
      message: `Gap display score ${gap.gap_priority_score} does not match theoretical normalization ${expectedScore}.`,
    });
  }
  if (gapBandForScore(gap.gap_priority_score, config) !== gap.priority_band) {
    failures.push({
      code: "PR-012",
      entity_id: gap.gap_id,
      message: `Gap score ${gap.gap_priority_score} and band ${gap.priority_band} disagree.`,
    });
  }
  if (
    gap.priority_version !== panel.priority_version ||
    gap.verified_gap_set_hash !== panel.verified_gap_set_hash ||
    gap.evaluation_as_of_date !== panel.evaluation_as_of_date
  ) {
    failures.push({
      code: "PR-011",
      entity_id: gap.gap_id,
      message: "Gap priority carries a stale or mismatched input-set identity.",
    });
  }
  return failures;
}

function validatePatient(
  patient: PatientInterventionPriority,
  gapPriorities: readonly GapInterventionPriority[],
  panel: PriorityPanel,
  config: PriorityConfig,
): PriorityInvariantFailure[] {
  const failures: PriorityInvariantFailure[] = [];
  const expectedBand = bandForScore(patient.patient_priority_score, config);
  if (expectedBand !== patient.priority_band) {
    failures.push({
      code: "PR-012",
      entity_id: patient.patient_id,
      message: `Patient score ${patient.patient_priority_score} and band ${patient.priority_band} disagree.`,
    });
  }
  if (patient.breakdown.secondary_bonus > config.secondary_bonus_cap + 0.000001) {
    failures.push({
      code: "PR-006",
      entity_id: patient.patient_id,
      message: "Secondary bonus exceeds the frozen cap.",
    });
  }
  if (!close(patient.breakdown.patient_raw_score, round6(patient.breakdown.top_gap_raw + patient.breakdown.secondary_bonus))) {
    failures.push({
      code: "PR-007",
      entity_id: patient.patient_id,
      message: "Patient raw score is not top gap plus bounded secondary bonus.",
    });
  }
  const expectedScore = normalizeScore(patient.breakdown.patient_raw_score, maxPatientRaw(config));
  if (expectedScore !== patient.patient_priority_score) {
    failures.push({
      code: "PR-007",
      entity_id: patient.patient_id,
      message: `Patient display score ${patient.patient_priority_score} does not match theoretical normalization ${expectedScore}.`,
    });
  }

  const patientGaps = gapPriorities.filter((gap) => gap.patient_id === patient.patient_id);
  if (patientGaps.length !== patient.breakdown.verified_gap_count) {
    failures.push({
      code: "PR-002",
      entity_id: patient.patient_id,
      message: "Verified gap count does not match the patient's gap priorities.",
    });
  }
  const maxRaw = patientGaps.reduce((max, gap) => Math.max(max, gap.raw_score), 0);
  if (!close(maxRaw, patient.breakdown.top_gap_raw)) {
    failures.push({
      code: "PR-002",
      entity_id: patient.patient_id,
      message: "Top gap raw score is not the maximum verified gap score.",
    });
  }
  const secondarySum = round6(
    patientGaps
      .filter((gap) => gap.gap_id !== patient.breakdown.top_gap_id)
      .reduce((total, gap) => total + gap.raw_score, 0),
  );
  if (!close(secondarySum, patient.breakdown.secondary_raw_sum)) {
    failures.push({
      code: "PR-006",
      entity_id: patient.patient_id,
      message: "Secondary raw sum does not match the remaining verified gaps.",
    });
  }
  if (isQueueEligible(patient) && patient.rank === null) {
    failures.push({
      code: "PR-008",
      entity_id: patient.patient_id,
      message: "Queue-eligible patient has no deterministic rank.",
    });
  }
  if (!isQueueEligible(patient) && patient.rank !== null) {
    failures.push({
      code: "PR-001",
      entity_id: patient.patient_id,
      message: "Unranked patient with no verified gap received a queue rank.",
    });
  }
  if (
    patient.priority_version !== panel.priority_version ||
    patient.verified_gap_set_hash !== panel.verified_gap_set_hash ||
    patient.evaluation_as_of_date !== panel.evaluation_as_of_date
  ) {
    failures.push({
      code: "PR-011",
      entity_id: patient.patient_id,
      message: "Patient priority carries a stale or mismatched input-set identity.",
    });
  }
  return failures;
}

export function validatePriorityPanel(
  panel: PriorityPanel,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): PriorityInvariantFailure[] {
  const failures: PriorityInvariantFailure[] = [];
  const gapIds = new Set<string>();
  for (const gap of panel.gap_priorities) {
    if (gapIds.has(gap.gap_id)) {
      failures.push({ code: "PR-002", entity_id: gap.gap_id, message: "Duplicate gap priority." });
    }
    gapIds.add(gap.gap_id);
    failures.push(...validateGap(gap, panel, config));
  }

  for (const patient of panel.patient_priorities) {
    failures.push(...validatePatient(patient, panel.gap_priorities, panel, config));
  }

  const ranked = panel.patient_priorities.filter(isQueueEligible);
  if (ranked.length !== panel.ranked_patient_count) {
    failures.push({
      code: "PR-008",
      entity_id: "panel",
      message: "Ranked patient count does not match queue-eligible patients.",
    });
  }
  const sorted = [...ranked].sort(comparePatientPriority);
  for (const [index, patient] of sorted.entries()) {
    if (patient.rank !== index + 1) {
      failures.push({
        code: "PR-008",
        entity_id: patient.patient_id,
        message: `Expected rank ${index + 1}, received ${String(patient.rank)}.`,
      });
      break;
    }
  }

  return failures;
}

export function validateQueue(
  queue: readonly QueueItem[],
  panel: PriorityPanel,
  k: number,
): PriorityInvariantFailure[] {
  const failures: PriorityInvariantFailure[] = [];
  if (queue.length > k) {
    failures.push({ code: "PR-002", entity_id: "queue", message: "Queue exceeds the requested K." });
  }
  const expected = panel.patient_priorities.filter(isQueueEligible).slice(0, k);
  for (const [index, item] of queue.entries()) {
    if (item.rank !== index + 1) {
      failures.push({
        code: "PR-008",
        entity_id: item.patient_id,
        message: `Queue rank ${item.rank} is not contiguous.`,
      });
    }
    if (expected[index]?.patient_id !== item.patient_id) {
      failures.push({
        code: "PR-002",
        entity_id: item.patient_id,
        message: "Queue order does not match the deterministic ranked panel.",
      });
    }
    const gap = panel.gap_priorities.find((priority) => priority.gap_id === item.top_gap.gap_id);
    if (!gap) {
      failures.push({
        code: "PR-001",
        entity_id: item.patient_id,
        message: "Queue item top gap is not in the verified priority set.",
      });
    }
    if (!item.explanation.arithmetic.includes("gap raw =") || !item.explanation.arithmetic.includes("patient raw =")) {
      failures.push({
        code: "PR-002",
        entity_id: item.patient_id,
        message: "Queue explanation does not expose the arithmetic.",
      });
    }
    if (item.explanation.other_verified_issues !== Math.max(0, item.verified_gap_count - 1)) {
      failures.push({
        code: "PR-002",
        entity_id: item.patient_id,
        message: "Queue explanation secondary count is wrong.",
      });
    }
  }
  return failures;
}

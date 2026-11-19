import { DETECTOR_VERSION, EVIDENCE_SCHEMA_VERSION } from "@/lib/domain";
import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";
import { filterEligibleGaps } from "./eligibility";
import { computeGapPriority } from "./gap-score";
import { computePatientPriority } from "./patient-score";
import { rankPatientPriorities } from "./rank";
import { comparePatientPriority, isQueueEligible } from "./ties";
import type {
  GapInterventionPriority,
  IneligibleGap,
  PatientInterventionPriority,
  PriorityPanel,
} from "./types";
import { PRIORITY_PANEL_SCHEMA_VERSION, PRIORITY_VERSION } from "./types";
import { createPriorityContext, hashVerifiedGapSet } from "./version";

export interface BuildPriorityPanelInput {
  patient_ids: readonly string[];
  gaps: readonly unknown[];
  evaluation_as_of_date: string;
  event_store_hash?: string;
  config?: PriorityConfig;
}

function compareIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function compareGaps(left: GapInterventionPriority, right: GapInterventionPriority): number {
  const patientOrder = compareIds(left.patient_id, right.patient_id);
  if (patientOrder !== 0) return patientOrder;
  return compareIds(left.gap_id, right.gap_id);
}

function assertUniqueGapIds(gaps: readonly { gap_id: string }[]): void {
  const seen = new Set<string>();
  for (const gap of gaps) {
    if (seen.has(gap.gap_id)) throw new Error(`Duplicate verified gap id in priority input: ${gap.gap_id}`);
    seen.add(gap.gap_id);
  }
}

export function computePanelPriorities(input: BuildPriorityPanelInput): PriorityPanel {
  const config = input.config ?? DEFAULT_PRIORITY_CONFIG;
  const patientIds = [...new Set(input.patient_ids)].sort(compareIds);
  if (patientIds.length === 0) throw new Error("Priority panel requires at least one patient id");

  const filtered = filterEligibleGaps(input.gaps, {
    evaluation_as_of_date: input.evaluation_as_of_date,
    ...(input.event_store_hash === undefined ? {} : { event_store_hash: input.event_store_hash }),
    config,
  });
  assertUniqueGapIds(filtered.eligible);

  const patientSet = new Set(patientIds);
  const unknownPatient = filtered.eligible.find((gap) => !patientSet.has(gap.patient_id));
  if (unknownPatient) {
    throw new Error(`Eligible gap ${unknownPatient.gap_id} belongs to a patient outside the priority panel`);
  }

  const verifiedGapSetHash = hashVerifiedGapSet(filtered.eligible);
  const context = createPriorityContext(filtered.eligible, {
    evaluation_as_of_date: input.evaluation_as_of_date,
    ...(input.event_store_hash === undefined ? {} : { event_store_hash: input.event_store_hash }),
    verified_gap_set_hash: verifiedGapSetHash,
    config,
  });

  const gapPriorities = filtered.eligible
    .map((gap) => computeGapPriority(gap, context))
    .sort(compareGaps);

  const byPatient = new Map<string, GapInterventionPriority[]>();
  for (const gap of gapPriorities) {
    const list = byPatient.get(gap.patient_id) ?? [];
    list.push(gap);
    byPatient.set(gap.patient_id, list);
  }

  const allPatients = patientIds.map((patientId) =>
    computePatientPriority(patientId, byPatient.get(patientId) ?? [], context),
  );
  const ranked = rankPatientPriorities(allPatients);
  const rankedById = new Map(ranked.map((priority) => [priority.patient_id, priority]));
  const patientPriorities = allPatients
    .map((priority) => rankedById.get(priority.patient_id) ?? priority)
    .sort((left, right) => {
      const leftEligible = isQueueEligible(left);
      const rightEligible = isQueueEligible(right);
      if (leftEligible !== rightEligible) return leftEligible ? -1 : 1;
      if (leftEligible && rightEligible) return comparePatientPriority(left, right);
      return compareIds(left.patient_id, right.patient_id);
    });

  return {
    schema_version: PRIORITY_PANEL_SCHEMA_VERSION,
    priority_version: PRIORITY_VERSION,
    evidence_version: EVIDENCE_SCHEMA_VERSION,
    detector_version: DETECTOR_VERSION,
    verified_gap_set_hash: verifiedGapSetHash,
    evaluation_as_of_date: input.evaluation_as_of_date,
    gap_priorities: gapPriorities,
    patient_priorities: patientPriorities,
    ineligible_gaps: filtered.ineligible,
    ranked_patient_count: ranked.length,
  };
}

export function ineligibleGapCount(panel: PriorityPanel): number {
  return panel.ineligible_gaps.length;
}

export function ineligibleGapsByReason(panel: PriorityPanel): Map<string, IneligibleGap[]> {
  const grouped = new Map<string, IneligibleGap[]>();
  for (const gap of panel.ineligible_gaps) {
    const list = grouped.get(gap.reason) ?? [];
    list.push(gap);
    grouped.set(gap.reason, list);
  }
  return grouped;
}

export function patientPriorityById(
  panel: PriorityPanel,
  patientId: string,
): PatientInterventionPriority | null {
  return panel.patient_priorities.find((priority) => priority.patient_id === patientId) ?? null;
}

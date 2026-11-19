import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";
import { explainPatientPriority, queueHeadline } from "./explain";
import { selectTopK, DEFAULT_QUEUE_K } from "./top-k";
import type {
  GapInterventionPriority,
  PriorityPanel,
  QueueItem,
  VerifiedGapForPriority,
} from "./types";
import { PRIORITY_VERSION } from "./types";

export interface PatientDisplay {
  patient_id: string;
  display_name: string;
}

function displayNameFor(patientId: string, labels: ReadonlyMap<string, string>): string {
  return labels.get(patientId) ?? `Synthetic patient ${patientId.slice(0, 8)}`;
}

export function buildQueue(
  panel: PriorityPanel,
  verifiedGaps: readonly VerifiedGapForPriority[],
  patients: readonly PatientDisplay[],
  k: number = DEFAULT_QUEUE_K,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): QueueItem[] {
  const gapsById = new Map(verifiedGaps.map((gap) => [gap.gap_id, gap]));
  const prioritiesById = new Map(panel.gap_priorities.map((priority) => [priority.gap_id, priority]));
  const labels = new Map(patients.map((patient) => [patient.patient_id, patient.display_name]));

  return selectTopK(panel.patient_priorities, k).map((patient) => {
    if (patient.rank === null || patient.priority_band === "NONE") {
      throw new Error("Top-K selection returned a patient without a workflow rank");
    }
    const topGapId = patient.breakdown.top_gap_id;
    if (!topGapId) throw new Error("Ranked patient has no top verified gap");
    const gap = gapsById.get(topGapId);
    const gapPriority = prioritiesById.get(topGapId);
    if (!gap || !gapPriority) throw new Error(`Ranked top gap ${topGapId} is missing from the priority panel`);

    return {
      rank: patient.rank,
      patient_id: patient.patient_id,
      display_name: displayNameFor(patient.patient_id, labels),
      patient_priority_score: patient.patient_priority_score,
      priority_band: patient.priority_band,
      top_gap: {
        gap_id: gap.gap_id,
        gap_type: gap.gap_type,
        title: gap.title,
        severity: gap.severity,
        gap_priority_score: gapPriority.gap_priority_score,
        priority_band: gapPriority.priority_band,
      },
      verified_gap_count: patient.breakdown.verified_gap_count,
      headline: queueHeadline(gap, gapPriority),
      recommended_coordinator_action: gap.recommended_coordinator_action,
      priority_breakdown: patient.breakdown,
      explanation: explainPatientPriority(gap, gapPriority, patient, config),
      priority_version: PRIORITY_VERSION,
    };
  });
}

export function topGapPriority(
  panel: PriorityPanel,
  patientId: string,
): GapInterventionPriority | null {
  const patient = panel.patient_priorities.find((priority) => priority.patient_id === patientId);
  const topGapId = patient?.breakdown.top_gap_id;
  if (!topGapId) return null;
  return panel.gap_priorities.find((gap) => gap.gap_id === topGapId) ?? null;
}

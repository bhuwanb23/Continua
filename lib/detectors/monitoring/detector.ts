import type {
  CandidateGap,
  CanonicalClinicalEvent,
  DetectionContext,
  GapDetector,
  MedicationMonitoringCandidate,
} from "@/lib/domain";
import { classifyTemporalState, dueDate, isIsoDate, overdueDays } from "../common/dates";
import { dedupeCandidateGaps } from "../common/dedupe";
import { evidenceRefFor } from "../common/evidence";
import { groupEventsByPatient, medicationStartEvents, normalizedDrug } from "../common/events";
import { medicationMonitoringGapId } from "../common/ids";
import { medicationStoppedBeforeDue, monitoringCompleted } from "./completion";
import { MONITORING_DETECTOR, monitoringSeverity } from "./policy";
import { monitoringRegistryFor } from "./registry";

function candidateFor(
  start: ReturnType<typeof medicationStartEvents>[number],
  patientEvents: CanonicalClinicalEvent[],
  context: DetectionContext,
): MedicationMonitoringCandidate | null {
  const drug = normalizedDrug(start);
  if (!drug) return null;
  const entry = monitoringRegistryFor(drug);
  if (!entry) return null;

  const due = dueDate(start.date, entry.window_days);
  const asOf = context.evaluation_as_of_date;
  if (asOf <= due) return null;
  if (medicationStoppedBeforeDue(start, due, patientEvents)) return null;
  if (monitoringCompleted(start, due, patientEvents, entry)) return null;

  const overdue = overdueDays(due, asOf);
  return {
    schema_version: "candidate-gap-v1",
    gap_id: medicationMonitoringGapId(start.patient_id, start.event_id, entry.target),
    patient_id: start.patient_id,
    gap_type: "med_monitoring",
    detector_version: "gaps-v1",
    policy_version: context.policy_version,
    ...(context.event_store_hash ? { event_store_hash: context.event_store_hash } : {}),
    severity: monitoringSeverity(overdue),
    identity: { drug, monitoring_target: entry.target, event_ids: [start.event_id] },
    trigger_event_ids: [start.event_id],
    evidence_refs: [evidenceRefFor(start)],
    window_days: entry.window_days,
    due_date: due,
    temporal_state: classifyTemporalState(due, asOf),
    metadata: {
      kind: "med_monitoring",
      medication: drug,
      medication_start_event_id: start.event_id,
      medication_start_date: start.date,
      monitoring_target: entry.target,
      monitoring_window_days: entry.window_days,
      due_date: due,
      evaluation_as_of_date: asOf,
      overdue_days: overdue,
    },
    rationale: {
      rule: "medication_start_without_required_monitoring",
      facts: {
        medication: drug,
        medication_start_date: start.date,
        monitoring_target: entry.target,
        window_days: entry.window_days,
        due_date: due,
        evaluation_as_of_date: asOf,
        overdue_days: overdue,
      },
    },
    recommended_coordinator_action:
      "Verify monitoring status and coordinate follow-up if unresolved.",
  };
}

export class MonitoringDetector implements GapDetector {
  readonly name = "medication-monitoring";
  readonly version = MONITORING_DETECTOR.detector;

  detect(events: CanonicalClinicalEvent[], context: DetectionContext): CandidateGap[] {
    if (!isIsoDate(context.evaluation_as_of_date)) {
      throw new Error(`Invalid evaluation_as_of_date: ${context.evaluation_as_of_date}`);
    }

    const candidates: MedicationMonitoringCandidate[] = [];
    for (const patientEvents of groupEventsByPatient(events).values()) {
      for (const start of medicationStartEvents(patientEvents)) {
        const candidate = candidateFor(start, patientEvents, context);
        if (candidate) candidates.push(candidate);
      }
    }
    return dedupeCandidateGaps(candidates);
  }
}

export const monitoringDetector = new MonitoringDetector();

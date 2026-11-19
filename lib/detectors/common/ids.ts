import { deterministicId } from "@/lib/ids";

export function missedFollowupGapId(patientId: string, referralEventId: string, specialty: string): string {
  return deterministicId("candidate-gap-v1", "missed_followup", patientId, referralEventId, specialty);
}

export function duplicateTestGapId(patientId: string, normalizedIdentity: string, firstEventId: string): string {
  return deterministicId("candidate-gap-v1", "duplicate_test", patientId, normalizedIdentity, firstEventId);
}

export function medicationMonitoringGapId(patientId: string, startEventId: string, monitoringTarget: string): string {
  return deterministicId("candidate-gap-v1", "med_monitoring", patientId, startEventId, monitoringTarget);
}

import type { CanonicalClinicalEvent, Patient, SourceRecord, VerifiedGap } from "@/lib/domain";
import type { GapInterventionPriority, PatientInterventionPriority } from "@/lib/priority/types";

export interface DemoCacheIndexes {
  patientById: Map<string, Patient>;
  recordsByPatient: Map<string, SourceRecord[]>;
  recordById: Map<string, SourceRecord>;
  deepDiveByGap: Map<string, Record<string, unknown>>;
  timelineByPatient: Map<string, CanonicalClinicalEvent[]>;
  gapsByPatient: Map<string, VerifiedGap[]>;
  gapById: Map<string, VerifiedGap>;
  evidenceByGap: Map<string, VerifiedGap["evidence_bundle"]>;
  priorityByPatient: Map<string, PatientInterventionPriority>;
  priorityByGap: Map<string, GapInterventionPriority>;
}

export function buildDemoCacheIndexes(input: {
  patients: Patient[];
  records: SourceRecord[];
  timelines: Array<{ patient_id: string; events: CanonicalClinicalEvent[] }>;
  verifiedGaps: VerifiedGap[];
  gapPriorities: GapInterventionPriority[];
  patientPriorities: PatientInterventionPriority[];
  deepDives?: Array<Record<string, unknown> & { gap_id: string }>;
}): DemoCacheIndexes {
  const patientById = new Map(input.patients.map((patient) => [patient.patient_id, patient]));
  const recordsByPatient = new Map<string, SourceRecord[]>();
  const recordById = new Map<string, SourceRecord>();
  for (const record of input.records) {
    const list = recordsByPatient.get(record.patient_id) ?? [];
    list.push(record);
    recordsByPatient.set(record.patient_id, list);
    recordById.set(record.source_doc_id, record);
  }
  const deepDiveByGap = new Map((input.deepDives ?? []).map((deepDive) => [deepDive.gap_id, deepDive]));
  const timelineByPatient = new Map(input.timelines.map((timeline) => [timeline.patient_id, timeline.events]));
  const gapsByPatient = new Map<string, VerifiedGap[]>();
  const gapById = new Map<string, VerifiedGap>();
  const evidenceByGap = new Map<string, VerifiedGap["evidence_bundle"]>();
  for (const gap of input.verifiedGaps) {
    const list = gapsByPatient.get(gap.patient_id) ?? [];
    list.push(gap);
    gapsByPatient.set(gap.patient_id, list);
    gapById.set(gap.gap_id, gap);
    evidenceByGap.set(gap.gap_id, gap.evidence_bundle);
  }
  const priorityByPatient = new Map(input.patientPriorities.map((priority) => [priority.patient_id, priority]));
  const priorityByGap = new Map(input.gapPriorities.map((priority) => [priority.gap_id, priority]));
  return {
    patientById,
    recordsByPatient,
    recordById,
    deepDiveByGap,
    timelineByPatient,
    gapsByPatient,
    gapById,
    evidenceByGap,
    priorityByPatient,
    priorityByGap,
  };
}

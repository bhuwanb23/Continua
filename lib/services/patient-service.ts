import { ApiError } from "@/lib/api/errors";
import { priorityLabel } from "@/lib/api/display";
import type { PatientListResponse, PatientResponse } from "@/lib/api/dto";
import { notFound } from "@/lib/api/handler";
import type { PatientListQuery } from "@/lib/api/schemas";
import type { Patient, VerifiedGap } from "@/lib/domain";
import type { PatientInterventionPriority } from "@/lib/priority/types";
import { demoRepository } from "./context";

export type PatientListItem = PatientListResponse["patients"][number];
export type PatientDetail = PatientResponse["patient"];

interface PatientView {
  patient: Patient;
  priority: PatientInterventionPriority;
  gaps: VerifiedGap[];
}

async function patientViews(requestId: string): Promise<Map<string, PatientView>> {
  const repository = demoRepository();
  const [patients, priorities, gaps] = await Promise.all([
    repository.patients.list(),
    repository.priorities.listPatientPriorities(),
    repository.verifiedGaps.listAll(),
  ]);
  const priorityByPatient = new Map(priorities.map((priority) => [priority.patient_id, priority]));
  const gapsByPatient = new Map<string, VerifiedGap[]>();
  for (const gap of gaps) {
    const list = gapsByPatient.get(gap.patient_id) ?? [];
    list.push(gap);
    gapsByPatient.set(gap.patient_id, list);
  }
  const views = new Map<string, PatientView>();
  for (const patient of patients) {
    const priority = priorityByPatient.get(patient.patient_id);
    if (!priority) {
      throw new ApiError("data_integrity_error", "Cached patient priority is missing.", 500, requestId);
    }
    views.set(patient.patient_id, {
      patient,
      priority,
      gaps: gapsByPatient.get(patient.patient_id) ?? [],
    });
  }
  return views;
}

function toListItem(view: PatientView, gapById: Map<string, VerifiedGap>): PatientListItem {
  const { patient, priority, gaps } = view;
  const topGap = priority.breakdown.top_gap_id ? gapById.get(priority.breakdown.top_gap_id) : undefined;
  return {
    patient_id: patient.patient_id,
    display_name: patient.name,
    age: patient.age,
    sex: patient.sex,
    primary_condition: patient.primary_diagnosis,
    last_contact_date: patient.last_contact_date,
    verified_gap_count: gaps.length,
    patient_priority_score: priority.patient_priority_score,
    priority_band: priority.priority_band,
    priority_label: priorityLabel(priority.priority_band),
    top_gap_type: topGap ? topGap.gap_type : null,
  };
}

export async function listPatients(
  panelId: string,
  query: PatientListQuery,
  requestId: string,
): Promise<Omit<PatientListResponse, "meta" | "disclaimer">> {
  const views = await patientViews(requestId);
  const gapById = new Map<string, VerifiedGap>();
  for (const view of views.values()) {
    for (const gap of view.gaps) gapById.set(gap.gap_id, gap);
  }

  const needle = query.query?.toLowerCase();
  const filtered = [...views.values()].filter((view) => {
    if (needle && !view.patient.name.toLowerCase().includes(needle)) return false;
    if (query.gap_type && !view.gaps.some((gap) => gap.gap_type === query.gap_type)) return false;
    if (query.priority_band && view.priority.priority_band !== query.priority_band) return false;
    return true;
  });

  filtered.sort((left, right) => {
    if (query.sort === "name") {
      const byName = left.patient.name.localeCompare(right.patient.name);
      if (byName !== 0) return byName;
    } else if (query.sort === "last_contact") {
      const byContact = right.patient.last_contact_date.localeCompare(left.patient.last_contact_date);
      if (byContact !== 0) return byContact;
    } else {
      const leftRank = left.priority.rank ?? Number.MAX_SAFE_INTEGER;
      const rightRank = right.priority.rank ?? Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) return leftRank - rightRank;
    }
    return left.patient.patient_id.localeCompare(right.patient.patient_id);
  });

  const page = filtered.slice(query.offset, query.offset + query.limit);
  return {
    panel_id: panelId,
    patients: page.map((view) => toListItem(view, gapById)),
    total: filtered.length,
    limit: query.limit,
    offset: query.offset,
  };
}

export async function getPatient(patientId: string, requestId: string): Promise<PatientDetail> {
  const repository = demoRepository();
  const patient = await repository.patients.getById(patientId);
  if (!patient) throw notFound("patient_not_found", "Patient not found.", requestId);
  const [priority, gaps] = await Promise.all([
    repository.priorities.getPatientPriority(patientId),
    repository.verifiedGaps.listByPatient(patientId),
  ]);
  if (!priority) {
    throw new ApiError("data_integrity_error", "Cached patient priority is missing.", 500, requestId);
  }
  return {
    patient_id: patient.patient_id,
    display_name: patient.name,
    age: patient.age,
    sex: patient.sex,
    primary_condition: patient.primary_diagnosis,
    last_contact_date: patient.last_contact_date,
    patient_priority_score: priority.patient_priority_score,
    priority_band: priority.priority_band,
    priority_label: priorityLabel(priority.priority_band),
    priority_rank: priority.rank,
    verified_gap_count: gaps.length,
    priority_breakdown: {
      top_gap_raw_score: priority.breakdown.top_gap_raw,
      top_gap_overdue_days: priority.breakdown.top_gap_overdue_days,
      secondary_gap_count: priority.breakdown.secondary_gap_count,
      secondary_bonus: priority.breakdown.secondary_bonus,
      patient_raw_score: priority.breakdown.patient_raw_score,
    },
  };
}

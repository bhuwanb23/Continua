import type { CanonicalClinicalEvent, ConsultEvent, FollowupEvent, LabResultEvent, ImagingEvent, MedicationStartEvent, ReferralEvent } from "@/lib/domain";
import { normalizeBodyRegion, normalizeImagingModality, normalizeLab, normalizeMedication, normalizeSpecialty } from "@/lib/normalization";

export function groupEventsByPatient(
  events: CanonicalClinicalEvent[],
): Map<string, CanonicalClinicalEvent[]> {
  const groups = new Map<string, CanonicalClinicalEvent[]>();
  for (const event of events) {
    const list = groups.get(event.patient_id) ?? [];
    list.push(event);
    groups.set(event.patient_id, list);
  }
  return groups;
}

export function referralEvents(events: CanonicalClinicalEvent[]): ReferralEvent[] {
  return events.filter((event): event is ReferralEvent => event.event_type === "referral");
}

export function consultEvents(events: CanonicalClinicalEvent[]): ConsultEvent[] {
  return events.filter((event): event is ConsultEvent => event.event_type === "consult");
}

export function followupEvents(events: CanonicalClinicalEvent[]): FollowupEvent[] {
  return events.filter((event): event is FollowupEvent => event.event_type === "followup");
}

export function labEvents(events: CanonicalClinicalEvent[]): LabResultEvent[] {
  return events.filter((event): event is LabResultEvent => event.event_type === "lab_result");
}

export function imagingEvents(events: CanonicalClinicalEvent[]): ImagingEvent[] {
  return events.filter((event): event is ImagingEvent => event.event_type === "imaging");
}

export function medicationStartEvents(events: CanonicalClinicalEvent[]): MedicationStartEvent[] {
  return events.filter((event): event is MedicationStartEvent => event.event_type === "medication_start");
}

export function normalizedSpecialty(event: ReferralEvent | ConsultEvent | FollowupEvent): string | null {
  const typed = event.typed as unknown as Record<string, unknown>;
  const direct = typed["specialty_normalized"];
  if (typeof direct === "string") return normalizeSpecialty(direct) ?? direct.trim().toLowerCase();
  const raw = typed["specialty_raw"] ?? typed["specialty"];
  return typeof raw === "string" ? normalizeSpecialty(raw) : null;
}

export function normalizedLabCode(event: LabResultEvent): string | null {
  const typed = event.typed;
  return normalizeLab(typed.test_name_raw) ?? normalizeLab(typed.test_code_normalized) ?? typed.test_code_normalized.trim().toLowerCase();
}

export function normalizedImagingIdentity(event: ImagingEvent): string | null {
  const modality = normalizeImagingModality(event.typed.modality_raw) ?? event.typed.modality_normalized;
  const region =
    normalizeBodyRegion(event.typed.body_region_raw) ??
    event.typed.body_region_normalized?.trim().toLowerCase() ??
    null;
  return modality && region ? `${modality}:${region}` : null;
}

export function normalizedDrug(event: MedicationStartEvent): string | null {
  return normalizeMedication(event.typed.drug_raw) ?? event.typed.drug_normalized.trim().toLowerCase();
}

export function isExplicitSeries(event: CanonicalClinicalEvent): boolean {
  const typed = event.typed as unknown as Record<string, unknown>;
  return typed["series_status"] === "explicit_series";
}

export function completionSatisfied(event: ConsultEvent | FollowupEvent): boolean {
  if (event.event_type === "consult") return event.typed.completion_status === "completed";
  return event.typed.status === "completed";
}

export function qualifyingMode(event: ConsultEvent | FollowupEvent): boolean {
  return event.typed.mode === "in_person" || event.typed.mode === "telehealth" || event.typed.mode === "phone";
}

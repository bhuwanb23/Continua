import type {
  AbsenceSearchDefinition,
  CanonicalClinicalEvent,
  ConsultEvent,
  FollowupEvent,
  ImagingEvent,
  LabResultEvent,
  MedicationStopEvent,
} from "@/lib/domain";
import { normalizeBodyRegion, normalizeImagingModality, normalizeLab, normalizeMedication, normalizeSpecialty } from "@/lib/normalization";
import type { EvidenceFailure } from "./internal-types";
import { absenceDefinitionKey } from "./ids";

function normalizedSpecialty(event: ConsultEvent | FollowupEvent): string | null {
  const typed = event.typed as unknown as Record<string, unknown>;
  const direct = typed["specialty_normalized"];
  if (typeof direct === "string") return normalizeSpecialty(direct) ?? direct.trim().toLowerCase();
  const raw = typed["specialty_raw"] ?? typed["specialty"];
  return typeof raw === "string" ? normalizeSpecialty(raw) : null;
}

function completed(event: ConsultEvent | FollowupEvent): boolean {
  if (event.event_type === "consult") return event.typed.completion_status === "completed";
  return event.typed.status === "completed";
}

function labIdentity(event: LabResultEvent): string | null {
  return normalizeLab(event.typed.test_name_raw) ?? normalizeLab(event.typed.test_code_normalized) ?? event.typed.test_code_normalized.trim().toLowerCase();
}

function imagingIdentity(event: ImagingEvent): string | null {
  const modality = normalizeImagingModality(event.typed.modality_raw) ?? event.typed.modality_normalized;
  const region = normalizeBodyRegion(event.typed.body_region_raw) ?? event.typed.body_region_normalized?.trim().toLowerCase();
  return modality && region ? `${modality}:${region}` : null;
}

function matchesIdentity(event: CanonicalClinicalEvent, identity: string): boolean {
  if (identity.startsWith("specialty:")) {
    const specialty = identity.slice("specialty:".length);
    if (event.event_type !== "consult" && event.event_type !== "followup") return false;
    return normalizedSpecialty(event) === specialty && completed(event);
  }
  if (identity.startsWith("lab_code:")) {
    if (event.event_type !== "lab_result") return false;
    const codes = new Set(identity.slice("lab_code:".length).split("|"));
    const code = labIdentity(event);
    return Boolean(code && codes.has(code));
  }
  if (identity.startsWith("series:")) {
    if (event.event_type === "lab_result") {
      const expected = identity.slice("series:lab:".length);
      return identity.startsWith("series:lab:") && labIdentity(event) === expected && event.typed.series_status === "explicit_series";
    }
    if (event.event_type === "imaging") {
      const expected = identity.slice("series:imaging:".length);
      return identity.startsWith("series:imaging:") && imagingIdentity(event) === expected && event.typed.series_status === "explicit_series";
    }
    return false;
  }
  if (identity.startsWith("drug:")) {
    if (event.event_type !== "medication_stop") return false;
    const expected = identity.slice("drug:".length);
    return normalizeMedication((event as MedicationStopEvent).typed.drug_raw) === expected;
  }
  return false;
}

export function runAbsenceQuery(
  definition: AbsenceSearchDefinition,
  patientId: string,
  events: CanonicalClinicalEvent[],
): string[] {
  return events
    .filter(
      (event) =>
        event.patient_id === patientId &&
        definition.event_types.includes(event.event_type) &&
        event.date >= definition.start_date &&
        event.date <= definition.end_date &&
        matchesIdentity(event, definition.normalized_identity),
    )
    .map((event) => event.event_id)
    .sort();
}

export type AbsenceVerification =
  | { ok: true; matching_event_ids: string[] }
  | { ok: false; failure: EvidenceFailure; matching_event_ids: string[] };

const KNOWN_EVENT_TYPES = new Set([
  "referral",
  "consult",
  "followup",
  "lab_result",
  "imaging",
  "medication_start",
  "medication_stop",
  "surgery",
]);

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function verifyAbsenceDefinition(
  definition: AbsenceSearchDefinition,
  patientId: string,
  events: CanonicalClinicalEvent[],
  evaluationAsOfDate: string,
  expected: boolean,
): AbsenceVerification {
  if (
    definition.event_types.length === 0 ||
    definition.event_types.some((type) => !KNOWN_EVENT_TYPES.has(type)) ||
    definition.normalized_identity.trim().length === 0 ||
    !validDate(definition.start_date) ||
    !validDate(definition.end_date) ||
    definition.start_date > definition.end_date ||
    definition.end_date > evaluationAsOfDate
  ) {
    return {
      ok: false,
      matching_event_ids: [],
      failure: {
        code: "EV-008",
        stage: "absence",
        message: "Absence query is malformed or extends beyond the evaluation date.",
      },
    };
  }

  const matching = runAbsenceQuery(definition, patientId, events);
  if (expected && matching.length > 0) {
    return {
      ok: false,
      matching_event_ids: matching,
      failure: {
        code: "EV-009",
        stage: "absence",
        message: "Absence claim is contradicted by matching events in the current event store.",
        ...(matching[0] ? { event_id: matching[0] } : {}),
      },
    };
  }
  if (!expected && matching.length === 0) {
    return {
      ok: false,
      matching_event_ids: matching,
      failure: {
        code: "EV-009",
        stage: "absence",
        message: "Required structural event was not found in the current event store.",
      },
    };
  }
  return { ok: true, matching_event_ids: matching };
}

export function sameAbsenceDefinition(left: AbsenceSearchDefinition, right: AbsenceSearchDefinition): boolean {
  return absenceDefinitionKey(left) === absenceDefinitionKey(right);
}

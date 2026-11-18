import type { CanonicalClinicalEvent, ClinicalEvent, ClinicalEventRejection, SourceRecord } from "@/lib/domain";
import { NORMALIZATION_VERSION } from "@/lib/normalization";
import { identifyClinicalEvent } from "./identify";
import { legacyEventToCanonical } from "./legacy-adapter";
import { normalizeClinicalEvent } from "./normalize";
import { rejectClinicalEvent } from "./rejection";
import { validateClinicalEvent, type ClinicalEventValidationContext } from "./validate";

export * from "./fingerprint";
export * from "./identify";
export * from "./legacy-adapter";
export * from "./normalize";
export * from "./rejection";
export * from "./serialize";
export * from "./sort";
export * from "./validate";

export interface CanonicalizeContext extends ClinicalEventValidationContext {
  extractor_version?: string;
}

export interface CanonicalizeResult {
  accepted: CanonicalClinicalEvent | null;
  rejection: ClinicalEventRejection | null;
}

function looksLegacy(candidate: ClinicalEvent): candidate is Exclude<ClinicalEvent, CanonicalClinicalEvent> {
  return !("schema_version" in candidate);
}

export function canonicalizeClinicalEvent(
  candidate: unknown,
  context: CanonicalizeContext,
  sourceLocalIndex = 0,
): CanonicalizeResult {
  if (!candidate || typeof candidate !== "object") {
    return {
      accepted: null,
      rejection: rejectClinicalEvent("CE-001", "Candidate must be an object.", candidate),
    };
  }

  const possible = candidate as ClinicalEvent;
  const canonical = looksLegacy(possible) ? legacyEventToCanonical(possible) : (possible as CanonicalClinicalEvent);
  const normalized = normalizeClinicalEvent(canonical);
  if (!normalized.event_id) {
    normalized.event_id = identifyClinicalEvent({
      patient_id: normalized.patient_id,
      source_doc_id: normalized.source.source_doc_id,
      event_type: normalized.event_type,
      date: normalized.date,
      source_local_index: sourceLocalIndex,
    });
  }
  normalized.normalization_version = context.normalization_version ?? NORMALIZATION_VERSION;
  normalized.extraction_confidence = normalized.extraction_confidence ?? 0;
  const result = validateClinicalEvent(normalized, context);
  if (result.accepted && !result.accepted.event_id) {
    result.accepted.event_id = identifyClinicalEvent({
      patient_id: result.accepted.patient_id,
      source_doc_id: result.accepted.source.source_doc_id,
      event_type: result.accepted.event_type,
      date: result.accepted.date,
      source_local_index: sourceLocalIndex,
    });
  }
  return result;
}

export function canonicalizeClinicalEvents(
  candidates: unknown[],
  context: CanonicalizeContext,
): { accepted: CanonicalClinicalEvent[]; rejected: ClinicalEventRejection[] } {
  const accepted: CanonicalClinicalEvent[] = [];
  const rejected: ClinicalEventRejection[] = [];
  candidates.forEach((candidate, index) => {
    const result = canonicalizeClinicalEvent(candidate, context, index);
    if (result.accepted) accepted.push(result.accepted);
    if (result.rejection) rejected.push(result.rejection);
  });
  return { accepted, rejected };
}

export function canonicalEventsForPatient(
  candidates: unknown[],
  patientId: string,
  records: SourceRecord[],
): { accepted: CanonicalClinicalEvent[]; rejected: ClinicalEventRejection[] } {
  return canonicalizeClinicalEvents(candidates, { patient_id: patientId, records });
}

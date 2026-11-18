import type { CanonicalClinicalEvent, ClinicalEvent, ClinicalEventRejection, SourceRecord } from "@/lib/domain";
import { NORMALIZATION_VERSION } from "@/lib/normalization";
import { verifySourceSpan } from "@/lib/evidence/span-match";
import { identifyClinicalEvent } from "./identify";
import { legacyEventToCanonical } from "./legacy-adapter";
import { NormalizationFailure, normalizeClinicalEvent } from "./normalize";
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

function looksLegacy(candidate: Record<string, unknown>): boolean {
  return !("schema_version" in candidate);
}

function sourceIdentity(event: CanonicalClinicalEvent, fallback: number): string {
  if (event.source.span_start !== undefined || event.source.span_end !== undefined) {
    return `offset:${event.source.span_start ?? "none"}:${event.source.span_end ?? "none"}`;
  }
  return `span:${event.source.source_span.trim().toLowerCase() || fallback}`;
}

function hasLegacyRequiredFields(candidate: Record<string, unknown>): boolean {
  const required = [
    "event_id",
    "patient_id",
    "event_type",
    "date",
    "description",
    "provider",
    "provider_type",
    "source_doc_id",
    "source_span",
    "confidence",
    "series_status",
  ];
  if (required.some((key) => candidate[key] === undefined || candidate[key] === null)) return false;
  const typed = candidate.typed && typeof candidate.typed === "object"
    ? (candidate.typed as Record<string, unknown>)
    : {};
  const eventType = String(candidate.event_type);
  const hasString = (...keys: string[]) =>
    keys.some((key) => typeof typed[key] === "string" && String(typed[key]).trim().length > 0);
  if (eventType === "referral" || eventType === "consult") {
    return hasString("specialty") || typeof candidate.specialty === "string";
  }
  if (eventType === "lab_result") return hasString("test_name_raw", "test_name_normalized");
  if (eventType === "imaging") return hasString("modality", "modality_normalized", "body_region");
  if (eventType === "medication_start" || eventType === "medication_stop") {
    return hasString("drug_raw", "drug_normalized");
  }
  if (eventType === "surgery") return hasString("procedure", "procedure_normalized");
  return true;
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

  try {
    const possible = candidate as Record<string, unknown>;
    if (looksLegacy(possible) && !hasLegacyRequiredFields(possible)) {
      return {
        accepted: null,
        rejection: rejectClinicalEvent("CE-001", "Legacy candidate is missing required event fields.", candidate),
      };
    }
    const canonical = looksLegacy(possible)
      ? legacyEventToCanonical(possible as unknown as Exclude<ClinicalEvent, CanonicalClinicalEvent>)
      : (possible as unknown as CanonicalClinicalEvent);
    const normalized = normalizeClinicalEvent(canonical);
    if (!normalized.event_id) {
      normalized.event_id = identifyClinicalEvent({
        patient_id: normalized.patient_id,
        source_doc_id: normalized.source.source_doc_id,
        event_type: normalized.event_type,
        date: normalized.date,
        source_local_identity: sourceIdentity(normalized, sourceLocalIndex),
      });
    }
    if (!normalized.normalization_version && looksLegacy(possible)) {
      normalized.normalization_version = context.normalization_version ?? NORMALIZATION_VERSION;
    }
    const sourceRecord = context.records.find(
      (record) => record.source_doc_id === normalized.source.source_doc_id,
    );
    if (looksLegacy(possible) && sourceRecord) {
      const verification = verifySourceSpan(normalized.source.source_span, sourceRecord.text);
      normalized.source = {
        ...normalized.source,
        verification_method: verification.method === "none" ? "fuzzy" : verification.method,
        verification_score: verification.score,
      };
    }
    return validateClinicalEvent(normalized, context);
  } catch (error) {
    if (error instanceof NormalizationFailure) {
      return {
        accepted: null,
        rejection: rejectClinicalEvent("CE-009", error.message, candidate, "normalization"),
      };
    }
    return {
      accepted: null,
      rejection: rejectClinicalEvent("CE-001", "Candidate could not be adapted into the ClinicalEvent v1 envelope.", candidate),
    };
  }
}

export function canonicalizeClinicalEvents(
  candidates: unknown[],
  context: CanonicalizeContext,
): { accepted: CanonicalClinicalEvent[]; rejected: ClinicalEventRejection[] } {
  const accepted: CanonicalClinicalEvent[] = [];
  const rejected: ClinicalEventRejection[] = [];
  const acceptedIds = new Set<string>();
  candidates.forEach((candidate, index) => {
    const result = canonicalizeClinicalEvent(candidate, context, index);
    if (result.accepted) {
      if (acceptedIds.has(result.accepted.event_id)) {
        rejected.push(
          rejectClinicalEvent(
            "CE-010",
            "Candidate resolves to an already accepted event identity.",
            candidate,
            "identity",
          ),
        );
        return;
      }
      acceptedIds.add(result.accepted.event_id);
      accepted.push(result.accepted);
    }
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

import type { CanonicalClinicalEvent, ClinicalEventRejection } from "@/lib/domain";
import { ClinicalEventSchema } from "@/lib/schemas";
import { EVALUATION_AS_OF_DATE, NORMALIZATION_VERSION } from "@/lib/domain/versions";
import { isIsoDate, daysBetween } from "@/lib/evaluation/temporal";
import { verifyProvenance } from "@/lib/provenance";
import { rejectClinicalEvent } from "./rejection";

export interface ClinicalEventValidationContext {
  patient_id: string;
  records: import("@/lib/domain").SourceRecord[];
  evaluation_as_of_date?: string;
  normalization_version?: string;
}

export interface ClinicalEventValidationResult {
  accepted: CanonicalClinicalEvent | null;
  rejection: ClinicalEventRejection | null;
}

function rejectionForSchema(candidate: unknown, issue: string): ClinicalEventRejection {
  const normalizationVersion =
    candidate && typeof candidate === "object"
      ? (candidate as { normalization_version?: unknown }).normalization_version
      : undefined;
  if (normalizationVersion !== undefined && normalizationVersion !== NORMALIZATION_VERSION) {
    return rejectClinicalEvent("CE-009", "Unsupported normalization version.", candidate, "normalization");
  }
  const eventType =
    candidate && typeof candidate === "object" && "event_type" in candidate
      ? (candidate as { event_type?: unknown }).event_type
      : undefined;
  const code = eventType && !["referral", "consult", "followup", "lab_result", "imaging", "medication_start", "medication_stop", "surgery"].includes(String(eventType))
    ? "CE-002"
    : "CE-001";
  return rejectClinicalEvent(code, issue, candidate);
}

export function validateClinicalEvent(
  candidate: unknown,
  context: ClinicalEventValidationContext,
): ClinicalEventValidationResult {
  const parsed = ClinicalEventSchema.safeParse(candidate);
  if (!parsed.success) {
    return { accepted: null, rejection: rejectionForSchema(candidate, parsed.error.issues.map((issue) => issue.message).join("; ")) };
  }

  const event = parsed.data as CanonicalClinicalEvent;
  const provenance = verifyProvenance(
    {
      source_doc_id: event.source.source_doc_id,
      patient_id: event.patient_id,
      source_span: event.source.source_span,
      ...(event.source.span_start !== undefined ? { span_start: event.source.span_start } : {}),
      ...(event.source.span_end !== undefined ? { span_end: event.source.span_end } : {}),
    },
    { patient_id: context.patient_id, records: context.records },
  );
  if (!provenance.ok) {
    return {
      accepted: null,
      rejection: rejectClinicalEvent(provenance.code, provenance.reason, candidate),
    };
  }

  if (
    event.source.verification_method !== provenance.source.verification_method ||
    (event.source.verification_method === "fuzzy" && event.source.verification_score < 0.85)
  ) {
    return {
      accepted: null,
      rejection: rejectClinicalEvent("CE-006", "Source verification metadata does not match the source text.", candidate),
    };
  }

  if (!isIsoDate(event.date)) {
    return { accepted: null, rejection: rejectClinicalEvent("CE-003", "Event date is not a valid calendar date.", candidate) };
  }
  if (event.date_precision === "month" && !event.date.endsWith("-01")) {
    return { accepted: null, rejection: rejectClinicalEvent("CE-003", "Month-precision dates must be stored on day 01.", candidate) };
  }
  const asOf = context.evaluation_as_of_date ?? EVALUATION_AS_OF_DATE;
  if (!isIsoDate(asOf) || daysBetween(asOf, event.date) > 1) {
    return { accepted: null, rejection: rejectClinicalEvent("CE-003", "Event date is beyond the allowed evaluation horizon.", candidate) };
  }

  if (event.normalization_version !== (context.normalization_version ?? NORMALIZATION_VERSION)) {
    return { accepted: null, rejection: rejectClinicalEvent("CE-009", "Unsupported normalization version.", candidate, "normalization") };
  }
  if (!Number.isFinite(event.extraction_confidence) || event.extraction_confidence < 0 || event.extraction_confidence > 1) {
    return { accepted: null, rejection: rejectClinicalEvent("CE-007", "Extraction confidence must be between 0 and 1.", candidate) };
  }

  const verifiedEvent: CanonicalClinicalEvent = {
    ...event,
    source: provenance.source,
  };
  return { accepted: verifiedEvent, rejection: null };
}

import type { CanonicalClinicalEvent } from "@/lib/domain";

function value(event: CanonicalClinicalEvent, key: string): string {
  const typed = event.typed as unknown as Record<string, unknown>;
  return String(typed[key] ?? "");
}

export function eventFingerprint(event: CanonicalClinicalEvent): string {
  const parts = [event.patient_id, event.event_type, event.date];
  if (event.event_type === "referral" || event.event_type === "consult") {
    parts.push(value(event, "specialty_normalized"));
  } else if (event.event_type === "lab_result") {
    parts.push(value(event, "test_code_normalized"), value(event, "value"));
  } else if (event.event_type === "imaging") {
    parts.push(value(event, "modality_normalized"), value(event, "body_region_normalized"));
  } else if (event.event_type === "medication_start" || event.event_type === "medication_stop") {
    parts.push(value(event, "drug_normalized"));
  } else if (event.event_type === "surgery") {
    parts.push(value(event, "procedure_normalized"), value(event, "site"));
  } else if (event.event_type === "followup") {
    parts.push(value(event, "topic"), value(event, "specialty_normalized"));
  }
  return parts.join("|").toLowerCase();
}

export interface EventGroup {
  fingerprint: string;
  representative_event: CanonicalClinicalEvent;
  supporting_event_ids: string[];
  supporting_source_doc_ids: string[];
}

export function groupEvents(events: CanonicalClinicalEvent[]): EventGroup[] {
  const groups = new Map<string, EventGroup>();
  for (const event of events) {
    const fingerprint = eventFingerprint(event);
    const existing = groups.get(fingerprint);
    if (existing) {
      existing.supporting_event_ids.push(event.event_id);
      if (!existing.supporting_source_doc_ids.includes(event.source.source_doc_id)) {
        existing.supporting_source_doc_ids.push(event.source.source_doc_id);
      }
      continue;
    }
    groups.set(fingerprint, {
      fingerprint,
      representative_event: event,
      supporting_event_ids: [event.event_id],
      supporting_source_doc_ids: [event.source.source_doc_id],
    });
  }
  return [...groups.values()];
}

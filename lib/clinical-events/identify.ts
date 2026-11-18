import { deterministicId } from "@/lib/ids";
import type { CanonicalClinicalEvent } from "@/lib/domain";

export interface EventIdentityInput {
  patient_id: string;
  source_doc_id: string;
  event_type: string;
  date: string;
  source_local_index?: number;
}

export function identifyClinicalEvent(input: EventIdentityInput): string {
  return deterministicId(
    "clinical-event-v1",
    input.patient_id,
    input.source_doc_id,
    input.event_type,
    input.date,
    String(input.source_local_index ?? 0),
  );
}

export function withStableEventId(event: CanonicalClinicalEvent, sourceLocalIndex = 0): CanonicalClinicalEvent {
  return {
    ...event,
    event_id: identifyClinicalEvent({
      patient_id: event.patient_id,
      source_doc_id: event.source.source_doc_id,
      event_type: event.event_type,
      date: event.date,
      source_local_index: sourceLocalIndex,
    }),
  };
}

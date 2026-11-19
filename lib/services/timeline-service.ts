import type { TimelineResponse } from "@/lib/api/dto";
import { notFound } from "@/lib/api/handler";
import { sortClinicalEvents } from "@/lib/clinical-events/sort";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { demoRepository } from "./context";

export type TimelineEventDto = TimelineResponse["events"][number];

function toEventDto(event: CanonicalClinicalEvent): TimelineEventDto {
  return {
    event_id: event.event_id,
    date: event.date,
    date_precision: event.date_precision,
    event_type: event.event_type,
    description: event.description,
    provider: event.provider_display ?? null,
    provider_type: event.provider_type ?? null,
    source_doc_id: event.source.source_doc_id,
    display: toDisplayFields(event.typed),
  };
}

/** Typed clinical fields only; no extraction metadata, prompts, or provenance spans. */
function toDisplayFields(typed: CanonicalClinicalEvent["typed"]): TimelineEventDto["display"] {
  const out: TimelineEventDto["display"] = {};
  for (const [key, value] of Object.entries(typed as unknown as Record<string, unknown>)) {
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      out[key] = value as string | number | boolean | null;
    }
  }
  return out;
}

export async function getTimeline(
  patientId: string,
  requestId: string,
): Promise<Omit<TimelineResponse, "meta" | "disclaimer">> {
  const repository = demoRepository();
  const patient = await repository.patients.getById(patientId);
  if (!patient) throw notFound("patient_not_found", "Patient not found.", requestId);
  const events = sortClinicalEvents(await repository.timelines.listByPatient(patientId));
  return { patient_id: patientId, events: events.map(toEventDto) };
}

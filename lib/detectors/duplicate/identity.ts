import type { CanonicalClinicalEvent, ImagingEvent, LabResultEvent } from "@/lib/domain";
import { imagingEvents, isExplicitSeries, labEvents, normalizedImagingIdentity, normalizedLabCode, groupEventsByPatient } from "../common/events";

export interface DiagnosticOccurrence {
  diagnostic_kind: "lab" | "imaging";
  normalized_identity: string;
  event: LabResultEvent | ImagingEvent;
  event_ids: string[];
  source_doc_ids: string[];
  date: string;
  explicit_series: boolean;
}

interface IdentityGroup {
  diagnostic_kind: "lab" | "imaging";
  normalized_identity: string;
  events: Array<LabResultEvent | ImagingEvent>;
}

function occurrenceKey(event: LabResultEvent | ImagingEvent): string {
  if (event.event_type === "lab_result") {
    const value = event.typed.value === undefined || event.typed.value === null ? "" : String(event.typed.value);
    return `lab|${event.date}|${event.typed.test_code_normalized}|${value}|${event.typed.unit ?? ""}`;
  }
  return `imaging|${event.date}|${event.typed.modality_normalized}|${event.typed.body_region_normalized ?? event.typed.body_region_raw}`;
}

function identityFor(event: LabResultEvent | ImagingEvent): IdentityGroup | null {
  if (event.event_type === "lab_result") {
    const code = normalizedLabCode(event);
    return code ? { diagnostic_kind: "lab", normalized_identity: `lab:${code}`, events: [event] } : null;
  }
  const identity = normalizedImagingIdentity(event);
  return identity ? { diagnostic_kind: "imaging", normalized_identity: `imaging:${identity}`, events: [event] } : null;
}

export function diagnosticOccurrencesForPatient(events: CanonicalClinicalEvent[]): DiagnosticOccurrence[] {
  const groups = new Map<string, IdentityGroup>();
  for (const event of [...labEvents(events), ...imagingEvents(events)]) {
    const identity = identityFor(event);
    if (!identity) continue;
    const existing = groups.get(identity.normalized_identity);
    if (existing) existing.events.push(event);
    else groups.set(identity.normalized_identity, identity);
  }

  const occurrences: DiagnosticOccurrence[] = [];
  for (const group of groups.values()) {
    const byOccurrence = new Map<string, Array<LabResultEvent | ImagingEvent>>();
    for (const event of group.events) {
      const key = occurrenceKey(event);
      const list = byOccurrence.get(key) ?? [];
      list.push(event);
      byOccurrence.set(key, list);
    }

    for (const occurrenceEvents of byOccurrence.values()) {
      const sorted = [...occurrenceEvents].sort((left, right) => left.event_id.localeCompare(right.event_id));
      const representative = sorted[0];
      if (!representative) continue;
      occurrences.push({
        diagnostic_kind: group.diagnostic_kind,
        normalized_identity: group.normalized_identity,
        event: representative,
        event_ids: sorted.map((event) => event.event_id),
        source_doc_ids: [...new Set(sorted.map((event) => event.source.source_doc_id))].sort(),
        date: representative.date,
        explicit_series: sorted.some(isExplicitSeries),
      });
    }
  }

  return occurrences.sort((left, right) => {
    const identityOrder = left.normalized_identity.localeCompare(right.normalized_identity);
    if (identityOrder !== 0) return identityOrder;
    const dateOrder = left.date.localeCompare(right.date);
    if (dateOrder !== 0) return dateOrder;
    return left.event.event_id.localeCompare(right.event.event_id);
  });
}

export function diagnosticOccurrencesByPatient(
  events: CanonicalClinicalEvent[],
): Map<string, DiagnosticOccurrence[]> {
  const output = new Map<string, DiagnosticOccurrence[]>();
  for (const [patientId, patientEvents] of groupEventsByPatient(events)) {
    output.set(patientId, diagnosticOccurrencesForPatient(patientEvents));
  }
  return output;
}

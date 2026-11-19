import type { CanonicalClinicalEvent, EvidenceRef } from "@/lib/domain";

export function evidenceRefFor(event: CanonicalClinicalEvent): EvidenceRef {
  return {
    event_id: event.event_id,
    source_doc_id: event.source.source_doc_id,
    source_span: event.source.source_span,
  };
}

export function evidenceRefsFor(events: CanonicalClinicalEvent[]): EvidenceRef[] {
  const seen = new Set<string>();
  const refs: EvidenceRef[] = [];
  for (const event of events) {
    const key = `${event.event_id}:${event.source.source_doc_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push(evidenceRefFor(event));
  }
  return refs;
}

export function uniqueSourceDocIds(refs: EvidenceRef[]): string[] {
  return [...new Set(refs.map((ref) => ref.source_doc_id))].sort();
}

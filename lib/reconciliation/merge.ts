import type { CanonicalClinicalEvent } from "@/lib/domain";

export type DocumentDateLookup = (sourceDocId: string) => string | undefined;

/**
 * Representative of a merged occurrence: earliest source document date,
 * tie-break source_doc_id, then event_id. Falls back to the event date when
 * the source document is not in context.
 */
export function selectRepresentative(
  events: CanonicalClinicalEvent[],
  documentDateOf: DocumentDateLookup,
): CanonicalClinicalEvent {
  const ordered = [...events].sort((left, right) => {
    const leftDate = documentDateOf(left.source.source_doc_id) ?? left.date;
    const rightDate = documentDateOf(right.source.source_doc_id) ?? right.date;
    const dateOrder = leftDate.localeCompare(rightDate);
    if (dateOrder !== 0) return dateOrder;
    const docOrder = left.source.source_doc_id.localeCompare(right.source.source_doc_id);
    if (docOrder !== 0) return docOrder;
    return left.event_id.localeCompare(right.event_id);
  });
  const representative = ordered[0];
  if (!representative) throw new Error("selectRepresentative requires at least one event");
  return representative;
}
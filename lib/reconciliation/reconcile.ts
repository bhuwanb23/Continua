import type { CanonicalClinicalEvent, EventSource, SourceRecord } from "@/lib/domain";
import { sortClinicalEvents } from "@/lib/clinical-events/sort";
import { groupByFingerprint } from "./fingerprint";
import { mentionContextOf, typedIdentity } from "./mention-context";
import { selectRepresentative } from "./merge";

export const RECONCILIATION_VERSION = "reconciliation-v1";

export interface MergedDuplicate {
  event_id: string;
  retained_event_id: string;
  fingerprint: string;
  source_doc_id: string;
}

export interface AttachedProvenance {
  event_id: string;
  retained_event_id: string;
  fingerprint: string;
  source: EventSource;
}

export interface RetainedHistorical {
  event_id: string;
  fingerprint: string;
  source_doc_id: string;
}

export interface ReconciliationLedger {
  reconciliation_version: string;
  merged_duplicates: MergedDuplicate[];
  attached_provenance: AttachedProvenance[];
  retained_historical: RetainedHistorical[];
}

export interface ReconciliationResult {
  events: CanonicalClinicalEvent[];
  ledger: ReconciliationLedger;
}

/**
 * Cross-document occurrence reconciliation (rules frozen in
 * docs/extraction/extraction-design.md). Merges only on identical
 * fingerprints; historical mentions attach provenance instead of creating
 * occurrences; similarity alone never merges. Output is deterministic
 * regardless of input order.
 */
export function reconcileClinicalEvents(
  events: CanonicalClinicalEvent[],
  records: SourceRecord[] = [],
): ReconciliationResult {
  const docDates = new Map(records.map((record) => [record.source_doc_id, record.date]));
  const documentDateOf = (sourceDocId: string) => docDates.get(sourceDocId);

  const retained: CanonicalClinicalEvent[] = [];
  const ledger: ReconciliationLedger = {
    reconciliation_version: RECONCILIATION_VERSION,
    merged_duplicates: [],
    attached_provenance: [],
    retained_historical: [],
  };

  for (const group of groupByFingerprint(events)) {
    const byContext = { contemporaneous: [] as CanonicalClinicalEvent[], unknown: [] as CanonicalClinicalEvent[], historical: [] as CanonicalClinicalEvent[] };
    for (const event of group.events) {
      const context = mentionContextOf(event);
      if (context === "contemporaneous") byContext.contemporaneous.push(event);
      else if (context === "historical_reference") byContext.historical.push(event);
      else byContext.unknown.push(event);
    }

    const occurrences: CanonicalClinicalEvent[] = [];

    if (byContext.contemporaneous.length > 0) {
      const representative = selectRepresentative(byContext.contemporaneous, documentDateOf);
      occurrences.push(representative);
      for (const event of byContext.contemporaneous) {
        if (event.event_id === representative.event_id) continue;
        ledger.merged_duplicates.push({
          event_id: event.event_id,
          retained_event_id: representative.event_id,
          fingerprint: group.fingerprint,
          source_doc_id: event.source.source_doc_id,
        });
      }
    }

    const unknownOrdered = [...byContext.unknown].sort((left, right) => left.event_id.localeCompare(right.event_id));
    for (const event of unknownOrdered) {
      const identical = occurrences.find((occurrence) => typedIdentity(occurrence) === typedIdentity(event));
      if (identical) {
        ledger.merged_duplicates.push({
          event_id: event.event_id,
          retained_event_id: identical.event_id,
          fingerprint: group.fingerprint,
          source_doc_id: event.source.source_doc_id,
        });
      } else {
        occurrences.push(event);
      }
    }

    const historicalOrdered = [...byContext.historical].sort((left, right) => left.event_id.localeCompare(right.event_id));
    for (const event of historicalOrdered) {
      const match =
        occurrences.find((occurrence) => typedIdentity(occurrence) === typedIdentity(event)) ?? occurrences[0];
      if (match) {
        ledger.attached_provenance.push({
          event_id: event.event_id,
          retained_event_id: match.event_id,
          fingerprint: group.fingerprint,
          source: event.source,
        });
      } else {
        const retainedHistorical: CanonicalClinicalEvent = { ...event, mention_context: "historical_reference" };
        occurrences.push(retainedHistorical);
        ledger.retained_historical.push({
          event_id: event.event_id,
          fingerprint: group.fingerprint,
          source_doc_id: event.source.source_doc_id,
        });
      }
    }

    retained.push(...occurrences);
  }

  ledger.merged_duplicates.sort((left, right) => left.event_id.localeCompare(right.event_id));
  ledger.attached_provenance.sort((left, right) => left.event_id.localeCompare(right.event_id));
  ledger.retained_historical.sort((left, right) => left.event_id.localeCompare(right.event_id));

  return { events: sortClinicalEvents(retained), ledger };
}
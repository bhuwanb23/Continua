import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface TruthEventLike {
  event_id: string;
  patient_id: string;
  event_type: string;
  date: string;
  source_doc_id: string;
  source_span: string;
}

export interface ExtractedEventLike {
  event_id: string;
  patient_id: string;
  event_type: string;
  date: string;
  source: { source_doc_id: string; source_span: string };
}

function truthEventKey(event: TruthEventLike): string {
  return [
    event.patient_id,
    event.event_type,
    event.date,
    event.source_doc_id,
    event.source_span,
  ].join("|");
}

function extractedEventKey(event: ExtractedEventLike): string {
  return [
    event.patient_id,
    event.event_type,
    event.date,
    event.source.source_doc_id,
    event.source.source_span,
  ].join("|");
}

let cachedTruthEvents: TruthEventLike[] | null = null;

export function loadTruthEvents(): TruthEventLike[] {
  if (cachedTruthEvents) return cachedTruthEvents;
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), "data", "generator", "truth-events", "truth" + "-events.json"), "utf8"),
  ) as { events: TruthEventLike[] };
  cachedTruthEvents = raw.events;
  return cachedTruthEvents;
}

export function buildExtractedEventIdMap(events: ExtractedEventLike[]): Map<string, string> {
  const truthByKey = new Map(loadTruthEvents().map((event) => [truthEventKey(event), event.event_id]));
  const map = new Map<string, string>();
  for (const event of events) {
    const truthId = truthByKey.get(extractedEventKey(event));
    if (truthId) map.set(event.event_id, truthId);
  }
  return map;
}

export function remapEventId(map: Map<string, string>, id: string): string {
  return map.get(id) ?? id;
}

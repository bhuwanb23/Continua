import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type {
  CandidateGap,
  CanonicalClinicalEvent,
  GapVerificationResult,
  SourceRecord,
} from "@/lib/domain";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import {
  createEvidenceVerificationContext,
  verifyCandidateGaps,
  type EvidenceVerificationContext,
} from "@/lib/evidence";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), path), "utf8")) as T;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export interface MariaEvidenceSetup {
  events: CanonicalClinicalEvent[];
  records: SourceRecord[];
  context: EvidenceVerificationContext;
  candidates: CandidateGap[];
  results: GapVerificationResult[];
}

export function mariaEvidenceSetup(): MariaEvidenceSetup {
  const events = readJson<{ events: CanonicalClinicalEvent[] }>(
    "data/fixtures/maria-canonical-events.json",
  ).events;
  const patientId = events[0]?.patient_id;
  if (!patientId) throw new Error("Maria fixture has no patient id");
  const records = readJson<{ records: SourceRecord[] }>(
    "data/synthetic/continua-synth-v1/records.json",
  ).records;
  const eventStoreHash = hashClinicalEvents(events);
  const candidates = detectCandidateGaps(
    events,
    createDetectionContext("2026-06-05", { event_store_hash: eventStoreHash }),
  );
  const context = createEvidenceVerificationContext(events, records, {
    event_store_hash: eventStoreHash,
  });
  return {
    events,
    records,
    context,
    candidates,
    results: verifyCandidateGaps(candidates, context),
  };
}

export function findCandidate<T extends CandidateGap["gap_type"]>(
  candidates: CandidateGap[],
  type: T,
): Extract<CandidateGap, { gap_type: T }> {
  const candidate = candidates.find((item) => item.gap_type === type);
  if (!candidate) throw new Error(`Missing candidate type ${type}`);
  return candidate as Extract<CandidateGap, { gap_type: T }>;
}

export function refreshCandidateHash(candidate: CandidateGap, events: CanonicalClinicalEvent[]): CandidateGap {
  candidate.event_store_hash = hashClinicalEvents(events);
  return candidate;
}

export function sourceRecordForEvent(
  event: CanonicalClinicalEvent,
  overrides: Partial<SourceRecord> = {},
): SourceRecord {
  return {
    source_doc_id: event.source.source_doc_id,
    fixture_key: `test-${event.event_id}`,
    patient_id: event.patient_id,
    doc_type: "other",
    provider: "Test Provider",
    provider_type: event.provider_type,
    date: event.date,
    text: event.source.source_span,
    content_hash: sha256(event.source.source_span),
    dataset_version: "continua-synth-v1",
    generator_version: "test",
    synthetic: true,
    ...overrides,
  };
}

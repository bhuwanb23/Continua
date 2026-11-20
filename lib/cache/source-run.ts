import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  CanonicalClinicalEvent,
  LegacyClinicalEvent,
  SourceRecord,
  VerifiedGap,
} from "@/lib/domain";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { createEvidenceVerificationContext, verifyCandidateGaps } from "@/lib/evidence";
import { extractPanel } from "@/lib/extraction/batch";
import { FixtureDocumentExtractor } from "@/lib/extraction/fixture-extractor";
import { buildQueue, computePanelPriorities } from "@/lib/priority";
import type { GapInterventionPriority, PatientInterventionPriority, QueueItem } from "@/lib/priority/types";
import { buildExtractedEventIdMap } from "@/lib/benchmark/event-identity";
import { truthEventsToCandidates } from "../../scripts/lib/truth-candidates";

export const DEMO_CACHE_EVALUATION_DATE = "2026-06-05";

export interface DemoSourcePatient {
  patient_id: string;
  fixture_key: string;
  display_name: string;
  demo_age: number;
  sex: "F" | "M" | "X";
  primary_condition: string;
  last_contact_date: string;
}

export interface DemoSourceRun {
  patients: DemoSourcePatient[];
  records: SourceRecord[];
  events: CanonicalClinicalEvent[];
  eventStoreHash: string;
  verifiedGaps: VerifiedGap[];
  patientPriorities: PatientInterventionPriority[];
  gapPriorities: GapInterventionPriority[];
  queue: QueueItem[];
  verifiedGapSetHash: string;
  suppressedCount: number;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/**
 * Deterministic offline build of the demo intelligence snapshot.
 *
 * Extraction is the frozen fixture-replay extractor (`extractor-v1`); no LLM or
 * network is contacted. The derived artifacts come from the same detector,
 * evidence, and priority code that `continua-benchmark-v1` qualified.
 */
export async function executeDemoSourceRun(): Promise<DemoSourceRun> {
  const root = process.cwd();
  const patients = readJson<{ patients: DemoSourcePatient[] }>(
    join(root, "data", "synthetic", "continua-synth-v1", "patients.json"),
  ).patients;
  const records = readJson<{ records: SourceRecord[] }>(
    join(root, "data", "synthetic", "continua-synth-v1", "records.json"),
  ).records;
  const truth = readJson<{ events: LegacyClinicalEvent[] }>(
    join(root, "data", "generator", "truth-events", "truth-events.json"),
  ).events;

  const conversion = truthEventsToCandidates(truth);
  const extractor = new FixtureDocumentExtractor(conversion.fixtures);
  const panel = patients.map((patient) => ({
    patient_id: patient.patient_id,
    records: records.filter((record) => record.patient_id === patient.patient_id),
  }));
  const results = await extractPanel(extractor, panel, { patientConcurrency: 2 });
  const failed = results.filter((result) => result.status !== "COMPLETE");
  if (failed.length > 0) {
    throw new Error(
      `Demo cache build requires a COMPLETE extraction for every patient; ${failed.length} patient(s) were incomplete.`,
    );
  }

  const events = results.flatMap((result) => result.store.accepted);
  const eventStoreHash = hashClinicalEvents(events);

  // Align extracted event ids with the canonical identity used by the evidence layer.
  const eventIdMap = buildExtractedEventIdMap(events as never);
  const remappedEvents = events.map((event) => ({
    ...event,
    event_id: eventIdMap.get(event.event_id) ?? event.event_id,
  })) as CanonicalClinicalEvent[];

  const candidates = detectCandidateGaps(remappedEvents, {
    ...createDetectionContext(DEMO_CACHE_EVALUATION_DATE, { event_store_hash: eventStoreHash }),
    patient_completeness: "COMPLETE",
  });
  const context = createEvidenceVerificationContext(remappedEvents, records, {
    evaluation_as_of_date: DEMO_CACHE_EVALUATION_DATE,
    event_store_hash: eventStoreHash,
    patient_completeness: "COMPLETE",
  });
  const verification = verifyCandidateGaps(candidates, context);
  const verifiedGaps = verification
    .map((result) => result.verified_gap)
    .filter((gap): gap is VerifiedGap => gap !== null);

  const priorityPanel = computePanelPriorities({
    patient_ids: patients.map((patient) => patient.patient_id),
    gaps: verifiedGaps,
    evaluation_as_of_date: DEMO_CACHE_EVALUATION_DATE,
    event_store_hash: eventStoreHash,
  });
  const queue = buildQueue(
    priorityPanel,
    verifiedGaps,
    patients.map((patient) => ({ patient_id: patient.patient_id, display_name: patient.display_name })),
    5,
  );

  return {
    patients,
    records,
    events: remappedEvents,
    eventStoreHash,
    verifiedGaps,
    patientPriorities: priorityPanel.patient_priorities,
    gapPriorities: priorityPanel.gap_priorities,
    queue,
    verifiedGapSetHash: priorityPanel.verified_gap_set_hash,
    suppressedCount: verification.filter((result) => result.status === "suppressed").length,
  };
}

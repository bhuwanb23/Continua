import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { canonicalizeClinicalEvents, hashClinicalEvents, sortClinicalEvents } from "@/lib/clinical-events";
import type { ExtractionGoldEvent } from "@/lib/evaluation/types";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const truthPath = join(root, "data", "generator", "truth-events", "truth-events.json");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function asLegacyEvent(event: Record<string, unknown>): LegacyClinicalEvent {
  return event as unknown as LegacyClinicalEvent;
}

function goldEventIds(gold: ExtractionGoldEvent[]): Set<string> {
  return new Set(gold.map((event) => event.event_id));
}

function writeMariaFixture(
  patients: Array<{ patient_id: string; fixture_key: string }>,
  records: SourceRecord[],
  events: LegacyClinicalEvent[],
): void {
  const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
  if (!maria) throw new Error("Maria is missing from the synthetic panel");
  const result = canonicalizeClinicalEvents(
    events.filter((event) => event.patient_id === maria.patient_id),
    {
      patient_id: maria.patient_id,
      records: records.filter((record) => record.patient_id === maria.patient_id),
      extractor_version: "truth-events-v1",
    },
  );
  if (result.rejected.length > 0) {
    throw new Error(`Maria canonical fixture rejected ${result.rejected.length} events`);
  }
  const output = {
    schema_version: "clinical-event-v1",
    patient_id: maria.patient_id,
    fixture_key: maria.fixture_key,
    metadata: {
      clinical_event_schema: "clinical-event-v1",
      normalization_version: "normalization-v1",
      extractor_version: "truth-events-v1",
    },
    events: sortClinicalEvents(result.accepted),
    event_hash: hashClinicalEvents(result.accepted),
  };
  mkdirSync(join(root, "data", "fixtures"), { recursive: true });
  writeFileSync(join(root, "data", "fixtures", "maria-canonical-events.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
}

function main(): void {
  const patients = readJson<{ patients: Array<{ patient_id: string; fixture_key: string }> }>(
    join(datasetDir, "patients.json"),
  ).patients;
  const records = readJson<{ records: SourceRecord[] }>(join(datasetDir, "records.json")).records;
  const truthEvents = readJson<{ events: Record<string, unknown>[] }>(truthPath).events.map(asLegacyEvent);
  const contracts = readJson<{ extraction_gold: ExtractionGoldEvent[] }>(
    join(evalDir, "benchmark-contracts.json"),
  );

  const byPatient = new Map<string, LegacyClinicalEvent[]>();
  for (const event of truthEvents) {
    const list = byPatient.get(event.patient_id) ?? [];
    list.push(event);
    byPatient.set(event.patient_id, list);
  }

  const accepted = [];
  const rejected = [];
  for (const [patientId, events] of byPatient) {
    const result = canonicalizeClinicalEvents(events, {
      patient_id: patientId,
      records: records.filter((record) => record.patient_id === patientId),
      extractor_version: "truth-events-v1",
    });
    accepted.push(...result.accepted);
    rejected.push(...result.rejected);
  }

  const goldIds = goldEventIds(contracts.extraction_gold);
  const goldAccepted = accepted.filter((event) => goldIds.has(event.event_id));
  const report = {
    status: rejected.length === 0 && goldAccepted.length === contracts.extraction_gold.length ? "PASS" : "FAIL",
    schema_version: "clinical-event-v1",
    normalization_version: "normalization-v1",
    truth_events: truthEvents.length,
    accepted_events: accepted.length,
    rejected_events: rejected.length,
    extraction_gold_events: contracts.extraction_gold.length,
    extraction_gold_representable: goldAccepted.length,
    rejection_counts: rejected.reduce<Record<string, number>>((counts, rejection) => {
      counts[rejection.code] = (counts[rejection.code] ?? 0) + 1;
      return counts;
    }, {}),
    event_hash: hashClinicalEvents(accepted),
    rejected,
  };

  mkdirSync(join(root, "artifacts", "clinical-events"), { recursive: true });
  writeFileSync(
    join(root, "artifacts", "clinical-events", "validation-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  writeMariaFixture(patients, records, truthEvents);

  console.log(`ClinicalEvent validation ${report.status}.`);
  console.log(`  accepted: ${report.accepted_events}/${report.truth_events}`);
  console.log(`  extraction gold: ${report.extraction_gold_representable}/${report.extraction_gold_events}`);
  console.log(`  rejected: ${report.rejected_events}`);
  console.log(`  event hash: ${report.event_hash}`);
  if (report.status !== "PASS") process.exit(1);
}

main();

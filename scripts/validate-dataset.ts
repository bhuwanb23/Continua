import { readFileSync } from "node:fs";
import { join } from "node:path";
import { deriveGaps } from "@/lib/generator/truth-check";
import { generateDataset } from "@/lib/generator";
import { isIsoDate } from "@/lib/generator/dates";
import { EVALUATION_AS_OF_DATE, GAP_TARGETS, HARD_NEGATIVE_FAMILIES } from "@/lib/generator/config";
import type {
  DatasetRecord,
  ExtractionGoldEvent,
  GapTruth,
  NegativeTruth,
  SyntheticPatient,
  SyntheticProvider,
  TruthEvent,
} from "@/lib/generator/types";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");

const failures: string[] = [];
function fail(message: string): void {
  failures.push(message);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

const patientsFile = readJson<{ dataset_version: string; synthetic: boolean; patients: SyntheticPatient[] }>(
  join(datasetDir, "patients.json"),
);
const providersFile = readJson<{ dataset_version: string; synthetic: boolean; providers: SyntheticProvider[] }>(
  join(datasetDir, "providers.json"),
);
const recordsFile = readJson<{ dataset_version: string; synthetic: boolean; records: DatasetRecord[] }>(
  join(datasetDir, "records.json"),
);
const truthFile = readJson<{ events: TruthEvent[] }>(join(root, "data", "generator", "truth-events", "truth-events.json"));
const groundTruthFile = readJson<{ evaluation_as_of_date: string; gaps: GapTruth[] }>(
  join(evalDir, "ground_truth.json"),
);
const negativeFile = readJson<{ negatives: NegativeTruth[] }>(join(evalDir, "negative_manifest.json"));
const goldFile = readJson<{ patient_count: number; events: ExtractionGoldEvent[] }>(
  join(evalDir, "extraction_gold.json"),
);
const manifest = readJson<Record<string, unknown>>(join(datasetDir, "manifest.json"));

const patients = patientsFile.patients;
const providers = providersFile.providers;
const records = recordsFile.records;
const events = truthFile.events;
const gaps = groundTruthFile.gaps;
const negatives = negativeFile.negatives;
const gold = goldFile.events;

// Structural
if (patients.length !== 80) fail(`patient count ${patients.length} != 80`);
if (records.length < 400 || records.length > 600) fail(`document count ${records.length} outside 400-600`);
if (providers.length < 20 || providers.length > 30) fail(`provider count ${providers.length} outside 20-30`);

const patientIds = new Set(patients.map((patient) => patient.patient_id));
const providerIds = new Set(providers.map((provider) => provider.provider_id));
const recordIds = new Set(records.map((record) => record.source_doc_id));
const eventIds = new Set(events.map((event) => event.event_id));

if (patientIds.size !== patients.length) fail("duplicate patient ids");
if (providerIds.size !== providers.length) fail("duplicate provider ids");
if (recordIds.size !== records.length) fail("duplicate document ids");
if (eventIds.size !== events.length) fail("duplicate event ids");

for (const record of records) {
  if (!patientIds.has(record.patient_id)) fail(`document ${record.fixture_key} references unknown patient`);
  if (!isIsoDate(record.date)) fail(`document ${record.fixture_key} has invalid date ${record.date}`);
  if (record.synthetic !== true) fail(`document ${record.fixture_key} is not synthetic`);
  if (record.dataset_version !== "continua-synth-v1") fail(`document ${record.fixture_key} has wrong dataset version`);
  if (!record.template_id || !record.content_hash) fail(`document ${record.fixture_key} is missing provenance`);
  if (record.date > EVALUATION_AS_OF_DATE && !record.date_precision) {
    fail(`document ${record.fixture_key} is after the evaluation date without a precision marker`);
  }
}

const recordById = new Map(records.map((record) => [record.source_doc_id, record]));
for (const event of events) {
  if (!patientIds.has(event.patient_id)) fail(`event ${event.event_id} references unknown patient`);
  if (!recordIds.has(event.source_doc_id)) fail(`event ${event.event_id} references unknown document`);
  if (!isIsoDate(event.date)) fail(`event ${event.event_id} has invalid date`);
  const record = recordById.get(event.source_doc_id);
  if (record && !record.text.includes(event.source_span)) {
    fail(`event ${event.event_id} span is not a verbatim substring of its document`);
  }
}

// Truth
const eventById = new Map(events.map((event) => [event.event_id, event]));
const allowedGapTypes = new Set(["missed_followup", "duplicate_test", "med_monitoring"]);
for (const gap of gaps) {
  if (!allowedGapTypes.has(gap.gap_type)) fail(`ground truth has unsupported gap type ${gap.gap_type}`);
  if (!patientIds.has(gap.patient_id)) fail(`ground truth gap references unknown patient`);
  if (!eventIds.has(gap.trigger_event_id)) fail(`ground truth gap references unknown trigger event`);
  for (const docId of gap.source_doc_ids) {
    if (!recordIds.has(docId)) fail(`ground truth gap references unknown document ${docId}`);
  }
  if (gap.evaluation_as_of_date !== EVALUATION_AS_OF_DATE) fail(`ground truth gap has wrong evaluation date`);
}

const derived = deriveGaps(events);
const derivedKeys = new Set(
  derived.map((gap) => {
    const event = eventById.get(gap.trigger_event_id);
    return `${event?.patient_id ?? "?"}:${gap.gap_type}:${gap.trigger_event_id}`;
  }),
);
const plantedKeys = new Set(gaps.map((gap) => `${gap.patient_id}:${gap.gap_type}:${gap.trigger_event_id}`));
for (const key of plantedKeys) if (!derivedKeys.has(key)) fail(`planted gap not derivable: ${key}`);
for (const key of derivedKeys) if (!plantedKeys.has(key)) fail(`unplanted derived gap: ${key}`);

// Distribution
const positivePatients = new Set(gaps.map((gap) => gap.patient_id)).size;
const negativePatients = patients.length - positivePatients;
if (positivePatients < 35 || positivePatients > 45) fail(`positive patients ${positivePatients} outside 35-45`);
if (negativePatients < 35 || negativePatients > 45) fail(`negative patients ${negativePatients} outside 35-45`);
if (gaps.length < 60 || gaps.length > 80) fail(`gap count ${gaps.length} outside 60-80`);
for (const [type, expected] of Object.entries(GAP_TARGETS)) {
  const actual = gaps.filter((gap) => gap.gap_type === type).length;
  if (actual !== expected) fail(`gap type ${type}: ${actual} != ${expected}`);
}

// Negatives
const families = new Set(negatives.map((entry) => entry.scenario_id));
for (const family of HARD_NEGATIVE_FAMILIES) {
  if (!["HN-02", "HN-11"].includes(family) && !families.has(family as NegativeTruth["scenario_id"])) {
    fail(`hard-negative family ${family} is not represented`);
  }
}
for (const entry of negatives) {
  if (entry.expected !== "no_gap") fail(`negative ${entry.scenario_id} does not expect no_gap`);
  if (!patientIds.has(entry.patient_id)) fail(`negative ${entry.scenario_id} references unknown patient`);
}
if (families.size < 10) fail(`only ${families.size} negative families represented`);

// Maria
const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
if (!maria) {
  fail("Maria golden-case patient is missing");
} else {
  const mariaGaps = gaps.filter((gap) => gap.patient_id === maria.patient_id);
  if (mariaGaps.length !== 3) fail(`Maria has ${mariaGaps.length} planted gaps, expected 3`);
  const types = new Set(mariaGaps.map((gap) => gap.gap_type));
  for (const type of allowedGapTypes) if (!types.has(type as GapTruth["gap_type"])) fail(`Maria is missing ${type}`);
  for (const gap of mariaGaps) {
    const trigger = eventById.get(gap.trigger_event_id);
    if (trigger?.typed["drug_normalized"] === "tamoxifen") fail("Maria has a tamoxifen monitoring gap");
  }
  const unexpectedScenario = mariaGaps.find((gap) => !["T02", "T04", "T06"].includes(gap.scenario_id));
  if (unexpectedScenario) fail(`Maria has an unexpected scenario ${unexpectedScenario.scenario_id}`);
}

// Extraction gold
if (goldFile.patient_count !== 12) fail(`extraction gold patient count ${goldFile.patient_count} != 12`);
if (gold.length < 100 || gold.length > 150) fail(`extraction gold events ${gold.length} outside 100-150`);
for (const event of gold) {
  if (!patientIds.has(event.patient_id)) fail(`gold event references unknown patient`);
  if (!recordIds.has(event.source_doc_id)) fail(`gold event references unknown document`);
  if (!eventIds.has(event.event_id)) fail(`gold event ${event.event_id} does not exist in truth events`);
}

// Manifest and reproducibility
if (manifest["patient_count"] !== patients.length) fail("manifest patient_count mismatch");
if (manifest["document_count"] !== records.length) fail("manifest document_count mismatch");
if (manifest["provider_count"] !== providers.length) fail("manifest provider_count mismatch");
if (manifest["total_gaps"] !== gaps.length) fail("manifest total_gaps mismatch");
if (manifest["content_hash"] === undefined) fail("manifest is missing content_hash");

const regenerated = generateDataset();
if (regenerated.manifest.content_hash !== manifest["content_hash"]) {
  fail("regenerating with the same seed produced a different content hash");
}

if (failures.length > 0) {
  console.error("Dataset validation failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `Dataset validation passed: ${patients.length} patients, ${records.length} documents, ${providers.length} providers, ${gaps.length} gaps, ${negatives.length} negatives, ${gold.length} gold events.`,
);

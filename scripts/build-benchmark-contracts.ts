import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deterministicId } from "@/lib/ids";
import {
  BENCHMARK_FROZEN_AT,
  BENCHMARK_FREEZE_STAMP,
  DATASET_VERSION,
  EVALUATION_AS_OF_DATE,
  EVAL_VERSION,
  GAP_TYPES,
  MATCHING_RULE_VERSION,
  MATCHING_SEMANTICS,
  type Difficulty,
  type GapType,
} from "@/lib/evaluation/config";
import { dueDate, overdueDays } from "@/lib/evaluation/temporal";
import type {
  BenchmarkContracts,
  BenchmarkManifest,
  ExtractionGoldEvent,
  GapIdentity,
  NegativeCase,
  PartitionContract,
  PartitionsFile,
  TruthGap,
} from "@/lib/evaluation/types";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const truthDir = join(root, "data", "generator", "truth-events");

interface Patient {
  patient_id: string;
  fixture_key: string;
  cohort: string;
  difficulty: Difficulty;
}

interface RecordFile {
  source_doc_id: string;
  patient_id: string;
  text: string;
  duplicate_of?: string;
}

interface TruthEvent {
  event_id: string;
  patient_id: string;
  event_type: string;
  date: string;
  source_doc_id: string;
  specialty: string | null;
  typed: Record<string, unknown>;
  date_precision: "day" | "month";
}

interface PhaseTwoGap {
  gap_truth_id: string;
  patient_id: string;
  gap_type: GapType;
  trigger_event_id: string;
  source_doc_ids: string[];
  expected_window_days: number;
  evaluation_as_of_date: string;
  scenario_id: string;
}

interface PhaseTwoNegative {
  patient_id: string;
  scenario_id: string;
  detector: GapType | "all";
  expected: "no_gap";
  reason: string;
}

interface PhaseTwoGold {
  event_id: string;
  patient_id: string;
  event_type: string;
  date: string;
  normalized_entity: string | null;
  provider: string;
  source_doc_id: string;
  source_span: string;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function value(event: TruthEvent, key: string): unknown {
  return event.typed[key];
}

function stringValue(event: TruthEvent, key: string): string | null {
  const raw = value(event, key);
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

function numberValue(event: TruthEvent, key: string): number | null {
  const raw = value(event, key);
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

function testKey(event: TruthEvent): string | null {
  if (event.event_type === "lab_result") {
    return stringValue(event, "test_name_normalized") ?? stringValue(event, "test_name_raw")?.toLowerCase() ?? null;
  }
  if (event.event_type === "imaging") {
    const modality = stringValue(event, "modality")?.toLowerCase();
    const region = stringValue(event, "body_region")?.toLowerCase();
    return modality && region ? `${modality}:${region}` : null;
  }
  return null;
}

function monitoringTarget(drug: string): string {
  if (drug === "metformin") return "a1c_or_bmp";
  if (drug === "warfarin") return "inr";
  return "oncology_consult";
}

function gapIdentity(gap: PhaseTwoGap, trigger: TruthEvent, events: TruthEvent[]): GapIdentity {
  if (gap.gap_type === "missed_followup") {
    return { specialty: stringValue(trigger, "specialty") ?? trigger.specialty ?? "unknown" };
  }
  if (gap.gap_type === "med_monitoring") {
    const drug = (stringValue(trigger, "drug_normalized") ?? stringValue(trigger, "drug_raw") ?? "unknown").toLowerCase();
    return { drug, monitoring_target: monitoringTarget(drug), event_ids: [trigger.event_id] };
  }

  const relevant = events.filter((event) => gap.source_doc_ids.includes(event.source_doc_id));
  const key = relevant.map(testKey).find((candidate): candidate is string => Boolean(candidate)) ?? "unknown";
  const eventIds = relevant.map((event) => event.event_id).sort();
  if (key.includes(":")) {
    const parts = key.split(":");
    const modality = parts[0] ?? "unknown";
    const bodyRegion = parts[1] ?? "unknown";
    return { modality, body_region: bodyRegion, event_ids: eventIds.length > 0 ? eventIds : [trigger.event_id] };
  }
  return { test: key, event_ids: eventIds.length > 0 ? eventIds : [trigger.event_id] };
}

function rationale(gap: PhaseTwoGap, trigger: TruthEvent, identity: GapIdentity, due: string): string {
  if (gap.gap_type === "missed_followup") {
    return `A ${identity.specialty} referral dated ${trigger.date} had a ${gap.expected_window_days}-day window ending ${due}; no qualifying ${identity.specialty} encounter occurred before the evaluation clock.`;
  }
  if (gap.gap_type === "duplicate_test") {
    const label = identity.test ?? `${identity.modality} ${identity.body_region}`;
    return `A repeat ${label} occurred within the frozen ${gap.expected_window_days}-day duplicate window without an explicit series status.`;
  }
  return `${identity.drug} started on ${trigger.date} required ${identity.monitoring_target} monitoring within ${gap.expected_window_days} days; no qualifying result was recorded by ${due}.`;
}

const patients = readJson<{ patients: Patient[] }>(join(datasetDir, "patients.json")).patients;
const records = readJson<{ records: RecordFile[] }>(join(datasetDir, "records.json")).records;
const generatedManifest = readJson<{ provider_count: number; document_count: number }>(join(datasetDir, "manifest.json"));
const events = readJson<{ events: TruthEvent[] }>(join(truthDir, "truth-events.json")).events;
const phaseTwoGaps = readJson<{ gaps: PhaseTwoGap[] }>(join(evalDir, "ground_truth.json")).gaps;
const phaseTwoNegatives = readJson<{ negatives: PhaseTwoNegative[] }>(join(evalDir, "negative_manifest.json")).negatives;
const phaseTwoGold = readJson<{ patient_count: number; events: PhaseTwoGold[] }>(join(evalDir, "extraction_gold.json"));

const patientsById = new Map(patients.map((patient) => [patient.patient_id, patient]));
const eventsById = new Map(events.map((event) => [event.event_id, event]));
const recordsById = new Map(records.map((record) => [record.source_doc_id, record]));

const truthGaps: TruthGap[] = phaseTwoGaps
  .map((gap) => {
    const patient = patientsById.get(gap.patient_id);
    const trigger = eventsById.get(gap.trigger_event_id);
    if (!patient || !trigger) throw new Error(`Missing patient or trigger for gap ${gap.gap_truth_id}`);
    const identity = gapIdentity(gap, trigger, events);
    const due = dueDate(trigger.date, gap.expected_window_days);
    const sourceDocIds = [...new Set(gap.source_doc_ids)].sort();
    return {
      truth_gap_id: gap.gap_truth_id,
      gap_truth_id: gap.gap_truth_id,
      patient_id: gap.patient_id,
      patient_fixture_key: patient.fixture_key,
      gap_type: gap.gap_type,
      trigger: {
        event_id: trigger.event_id,
        event_type: trigger.event_type,
        date: trigger.date,
      },
      trigger_event_id: trigger.event_id,
      identity,
      temporal: {
        window_days: gap.expected_window_days,
        due_date: due,
        evaluation_as_of_date: EVALUATION_AS_OF_DATE,
        overdue_days: overdueDays(due, EVALUATION_AS_OF_DATE),
      },
      expected_window_days: gap.expected_window_days,
      required_evidence_doc_ids: [trigger.source_doc_id],
      acceptable_evidence_doc_ids: sourceDocIds,
      source_doc_ids: sourceDocIds,
      scenario_id: gap.scenario_id,
      difficulty: patient.difficulty,
      rationale: rationale(gap, trigger, identity, due),
      dataset_version: DATASET_VERSION,
      eval_version: EVAL_VERSION,
    } satisfies TruthGap;
  })
  .sort((a, b) => a.truth_gap_id.localeCompare(b.truth_gap_id));

const FAMILY_NAMES: Record<string, string> = {
  "HN-01": "completed_referral",
  "HN-03": "referral_inside_window",
  "HN-04": "telehealth_completion",
  "HN-05": "explicit_series",
  "HN-06": "repeated_lab_outside_window",
  "HN-07": "imaging_different_region",
  "HN-08": "med_stopped_early",
  "HN-09": "alias_covered_monitoring",
  "HN-10": "boundary_monitoring",
  "HN-12": "duplicated_document",
  "HN-13": "partial_date",
  "HN-14": "missing_provider",
  "HN-15": "completed_status",
};

function relevantForNegative(negative: PhaseTwoNegative): TruthEvent[] {
  const patientEvents = events.filter((event) => event.patient_id === negative.patient_id);
  if (negative.detector === "duplicate_test") {
    return patientEvents.filter((event) => event.event_type === "lab_result" || event.event_type === "imaging");
  }
  if (negative.detector === "med_monitoring") {
    return patientEvents.filter((event) =>
      ["medication_start", "medication_stop", "lab_result"].includes(event.event_type),
    );
  }
  if (negative.detector === "missed_followup") {
    return patientEvents.filter((event) => ["referral", "consult", "followup"].includes(event.event_type));
  }
  return patientEvents;
}

const negatives: NegativeCase[] = phaseTwoNegatives
  .map((negative) => {
    const patient = patientsById.get(negative.patient_id);
    if (!patient) throw new Error(`Missing patient for negative ${negative.scenario_id}`);
    const relevantEvents = relevantForNegative(negative);
    const relevantDocIds = new Set(relevantEvents.map((event) => event.source_doc_id));
    for (const record of records) {
      if (record.patient_id === negative.patient_id && record.duplicate_of && relevantDocIds.has(record.duplicate_of)) {
        relevantDocIds.add(record.source_doc_id);
      }
    }
    return {
      negative_id: deterministicId("negative", negative.patient_id, negative.scenario_id, negative.detector),
      patient_id: negative.patient_id,
      patient_fixture_key: patient.fixture_key,
      detector_target: negative.detector,
      detector: negative.detector,
      scenario_family: FAMILY_NAMES[negative.scenario_id] ?? negative.scenario_id.toLowerCase(),
      scenario_id: negative.scenario_id,
      relevant_event_ids: [...new Set(relevantEvents.map((event) => event.event_id))].sort(),
      relevant_doc_ids: [...relevantDocIds].sort(),
      expected_result: "NO_GAP",
      expected: "no_gap",
      reason: negative.reason,
      difficulty: patient.difficulty,
      dataset_version: DATASET_VERSION,
      eval_version: EVAL_VERSION,
    } satisfies NegativeCase;
  })
  .sort((a, b) => a.negative_id.localeCompare(b.negative_id));

function normalizedFields(event: TruthEvent): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  const candidates: Array<[string, string]> = [
    ["specialty", "specialty"],
    ["status", "status"],
    ["test", "test_name_normalized"],
    ["drug", "drug_normalized"],
    ["modality", "modality"],
    ["body_region", "body_region"],
    ["procedure", "procedure"],
    ["site", "site"],
    ["series_status", "series_status"],
  ];
  for (const [key, source] of candidates) {
    const found = stringValue(event, source);
    if (found) output[key] = found;
  }
  const window = numberValue(event, "expected_window_days");
  if (window !== null) output["expected_window_days"] = window;
  return output;
}

const extractionGold: ExtractionGoldEvent[] = phaseTwoGold.events
  .map((gold) => {
    const patient = patientsById.get(gold.patient_id);
    const truth = eventsById.get(gold.event_id);
    const record = recordsById.get(gold.source_doc_id);
    if (!patient || !truth || !record) throw new Error(`Missing gold references for ${gold.event_id}`);
    return {
      gold_event_id: gold.event_id,
      event_id: gold.event_id,
      patient_id: gold.patient_id,
      source_doc_id: gold.source_doc_id,
      event_type: gold.event_type,
      date: gold.date,
      date_precision: truth.date_precision,
      normalized: normalizedFields(truth),
      normalized_entity: gold.normalized_entity,
      evidence: { source_span: gold.source_span, required: true },
      source_span: gold.source_span,
      provider: gold.provider,
      difficulty: patient.difficulty,
      dataset_version: DATASET_VERSION,
      eval_version: EVAL_VERSION,
    } satisfies ExtractionGoldEvent;
  })
  .sort((a, b) => a.gold_event_id.localeCompare(b.gold_event_id));

const contracts: BenchmarkContracts = {
  dataset_version: DATASET_VERSION,
  eval_version: EVAL_VERSION,
  evaluation_as_of_date: EVALUATION_AS_OF_DATE,
  generated_at: BENCHMARK_FROZEN_AT,
  source: "Derived from frozen Phase 2 labels without changing any planted-gap, negative, or gold label.",
  truth_gaps: truthGaps,
  negatives,
  extraction_gold: extractionGold,
};

// ------------------------------------------------------------------ partitions

const positivePatientIds = new Set(truthGaps.map((gap) => gap.patient_id));
const gapTypesByPatient = new Map<string, GapType[]>();
for (const gap of truthGaps) {
  const list = gapTypesByPatient.get(gap.patient_id) ?? [];
  list.push(gap.gap_type);
  gapTypesByPatient.set(gap.patient_id, list);
}

const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
if (!maria) throw new Error("Maria is missing from the frozen panel");

function positiveKey(patient: Patient): string {
  const types = [...new Set(gapTypesByPatient.get(patient.patient_id) ?? [])].sort();
  return `positive|${types.join("+")}|${patient.cohort}|${patient.difficulty}`;
}

function negativeKey(patient: Patient): string {
  const negative = negatives.find((entry) => entry.patient_id === patient.patient_id);
  return `negative|${negative?.scenario_family ?? "clean"}|${patient.difficulty}`;
}

function roundRobinPick(candidates: Patient[], count: number, keyFor: (patient: Patient) => string): Patient[] {
  const groups = new Map<string, Patient[]>();
  for (const patient of candidates) {
    const key = keyFor(patient);
    const group = groups.get(key) ?? [];
    group.push(patient);
    groups.set(key, group);
  }
  for (const group of groups.values()) group.sort((a, b) => a.fixture_key.localeCompare(b.fixture_key));
  const keys = [...groups.keys()].sort();
  const picked: Patient[] = [];
  let index = 0;
  while (picked.length < count) {
    let added = false;
    for (const key of keys) {
      if (picked.length >= count) break;
      const group = groups.get(key);
      const candidate = group?.[index];
      if (candidate) {
        picked.push(candidate);
        added = true;
      }
    }
    if (!added) break;
    index += 1;
  }
  return picked;
}

const positivePatients = patients.filter((patient) => positivePatientIds.has(patient.patient_id));
const negativePatients = patients.filter((patient) => !positivePatientIds.has(patient.patient_id));
const positiveDevTarget = 11;
const negativeDevTarget = 9;
const devIds = new Set<string>([maria.patient_id]);

// Pick in one round-robin pass per class so cohort, difficulty, gap-type
// signature, and negative-family coverage are spread across the dev split.
for (const patient of roundRobinPick(
  positivePatients.filter((patient) => !devIds.has(patient.patient_id)),
  positiveDevTarget - 1,
  positiveKey,
)) {
  devIds.add(patient.patient_id);
}
for (const patient of roundRobinPick(negativePatients, negativeDevTarget, negativeKey)) {
  devIds.add(patient.patient_id);
}

const dev = [...devIds].sort((a, b) => {
  const left = patientsById.get(a)?.fixture_key ?? a;
  const right = patientsById.get(b)?.fixture_key ?? b;
  return left.localeCompare(right);
});
const final = patients
  .filter((patient) => !devIds.has(patient.patient_id))
  .map((patient) => patient.patient_id)
  .sort((a, b) => {
    const left = patientsById.get(a)?.fixture_key ?? a;
    const right = patientsById.get(b)?.fixture_key ?? b;
    return left.localeCompare(right);
  });

function partitionContract(name: "dev" | "final", ids: string[]): PartitionContract {
  const idSet = new Set(ids);
  const partitionPatients = patients.filter((patient) => idSet.has(patient.patient_id));
  const partitionGaps = truthGaps.filter((gap) => idSet.has(gap.patient_id));
  const positive = new Set(partitionGaps.map((gap) => gap.patient_id));
  const gapTypes = { missed_followup: 0, duplicate_test: 0, med_monitoring: 0 } as Record<GapType, number>;
  const difficulties: Record<Difficulty, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  const cohorts: Record<string, number> = {};
  for (const gap of partitionGaps) gapTypes[gap.gap_type] += 1;
  for (const patient of partitionPatients) {
    difficulties[patient.difficulty] += 1;
    cohorts[patient.cohort] = (cohorts[patient.cohort] ?? 0) + 1;
  }
  return {
    name,
    patient_ids: ids,
    patient_fixture_keys: partitionPatients.map((patient) => patient.fixture_key).sort(),
    counts: {
      patients: ids.length,
      positive_patients: positive.size,
      negative_patients: ids.length - positive.size,
      gaps: partitionGaps.length,
      gap_types: gapTypes,
      difficulties,
      cohorts,
    },
  };
}

const partitions: PartitionsFile = {
  dataset_version: DATASET_VERSION,
  eval_version: EVAL_VERSION,
  strategy: "deterministic stratified by patient: positivity, gap-type signature, cohort, difficulty, and negative family; Maria remains in dev",
  generated_at: BENCHMARK_FROZEN_AT,
  seed: 20261117,
  dev,
  final,
  assignment: Object.fromEntries([
    ...dev.map((id) => [id, "dev"] as const),
    ...final.map((id) => [id, "final"] as const),
  ]),
  partitions: {
    dev: partitionContract("dev", dev),
    final: partitionContract("final", final),
  },
  counts: {
    dev: dev.length,
    final: final.length,
    overlap: dev.filter((id) => final.includes(id)).length,
  },
};

const familyCounts = new Map<string, number>();
for (const negative of negatives) {
  familyCounts.set(negative.scenario_family, (familyCounts.get(negative.scenario_family) ?? 0) + 1);
}

const manifest: BenchmarkManifest = {
  dataset_version: DATASET_VERSION,
  eval_version: EVAL_VERSION,
  evaluation_as_of_date: EVALUATION_AS_OF_DATE,
  frozen_at: BENCHMARK_FROZEN_AT,
  status: "frozen",
  patient_count: patients.length,
  document_count: records.length,
  provider_count: generatedManifest.provider_count,
  positive_patients: positivePatientIds.size,
  negative_patients: patients.length - positivePatientIds.size,
  total_gaps: truthGaps.length,
  gap_counts: {
    missed_followup: truthGaps.filter((gap) => gap.gap_type === "missed_followup").length,
    duplicate_test: truthGaps.filter((gap) => gap.gap_type === "duplicate_test").length,
    med_monitoring: truthGaps.filter((gap) => gap.gap_type === "med_monitoring").length,
  },
  hard_negative: {
    scenario_count: negatives.length,
    family_count: familyCounts.size,
    families: [...familyCounts.keys()].sort(),
  },
  extraction_gold: {
    patient_count: new Set(extractionGold.map((event) => event.patient_id)).size,
    event_count: extractionGold.length,
  },
  partitions: {
    dev: dev.length,
    final: final.length,
    overlap: partitions.counts.overlap,
  },
  matching_rule: {
    version: MATCHING_RULE_VERSION,
    semantics: { ...MATCHING_SEMANTICS },
  },
  hashes: {
    ground_truth_sha256: "",
    negative_manifest_sha256: "",
    extraction_gold_sha256: "",
    partitions_sha256: "",
    benchmark_contracts_sha256: "",
    evaluation_config_sha256: "",
  },
  freeze: {
    stamp: BENCHMARK_FREEZE_STAMP,
    policy: "Any label, identity, partition, date, expected-outcome, matching-semantics, or metric-definition change requires continua-eval-v2.",
    frozen_at: BENCHMARK_FROZEN_AT,
    contract_source: contracts.source,
  },
};

writeJson(join(evalDir, "benchmark-contracts.json"), contracts);
writeJson(join(evalDir, "partitions.json"), partitions);
writeJson(join(evalDir, "benchmark-manifest.json"), manifest);

console.log(
  `Built Phase 3 contracts: ${truthGaps.length} gaps, ${negatives.length} negatives (${familyCounts.size} families), ${extractionGold.length} gold events, dev ${dev.length}/final ${final.length}.`,
);
for (const type of GAP_TYPES) {
  const devCount = partitions.partitions.dev.counts.gap_types[type];
  const finalCount = partitions.partitions.final.counts.gap_types[type];
  console.log(`  ${type}: dev ${devCount}, final ${finalCount}`);
}

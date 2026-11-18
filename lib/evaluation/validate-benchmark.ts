import {
  BENCHMARK_COUNTS,
  DATASET_VERSION,
  DIFFICULTIES,
  EVALUATION_AS_OF_DATE,
  EVAL_VERSION,
  GAP_TYPES,
  MATCHING_RULE_VERSION,
} from "./config";
import { dueDate, isIsoDate, overdueDays } from "./temporal";
import type {
  BenchmarkBundle,
  BenchmarkHashes,
  Difficulty,
  ExtractionGoldEvent,
  GapType,
  NegativeCase,
  TruthGap,
} from "./types";

export interface BenchmarkValidationOptions {
  expected?: typeof BENCHMARK_COUNTS;
  hashes?: BenchmarkHashes;
  /** Hash key to expected value. Scripts supply this after hashing files. */
  hashExpectations?: Record<string, string>;
}

export interface BenchmarkValidationResult {
  ok: boolean;
  failures: string[];
  warnings: string[];
  summary: {
    patients: number;
    documents: number;
    providers: number;
    truth_gaps: number;
    negatives: number;
    gold_events: number;
    dev_patients: number;
    final_patients: number;
    overlap: number;
    hard_negative_families: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function pushIf(failures: string[], condition: boolean, message: string): void {
  if (condition) failures.push(message);
}

function identitySignature(gap: TruthGap): string {
  const identity = gap.identity ?? {};
  const eventIds = [...(identity.event_ids ?? [])].sort().join(",");
  const parts = [
    gap.patient_id,
    gap.gap_type,
    identity.specialty ?? identity.test ?? identity.test_name ?? "",
    identity.modality ?? "",
    identity.body_region ?? "",
    identity.drug ?? identity.medication ?? "",
    identity.monitoring_target ?? "",
    eventIds || gap.trigger?.event_id || "",
  ];
  return parts.map((part) => String(part).trim().toLowerCase()).join("|");
}

function validateTruthGap(
  gap: TruthGap,
  patientsById: Map<string, { fixture_key: string }>,
  recordsById: Map<string, { patient_id: string; text: string }>,
  eventsById: Map<string, { patient_id: string; event_type: string; date: string }>,
  failures: string[],
): void {
  const label = `truth gap ${gap.truth_gap_id ?? "(missing id)"}`;
  pushIf(failures, !nonEmpty(gap.truth_gap_id), `${label} has no truth_gap_id`);
  pushIf(failures, !nonEmpty(gap.gap_truth_id), `${label} has no gap_truth_id`);
  pushIf(failures, gap.gap_truth_id !== gap.truth_gap_id, `${label} id aliases disagree`);
  pushIf(failures, !patientsById.has(gap.patient_id), `${label} references an unknown patient`);
  const patient = patientsById.get(gap.patient_id);
  pushIf(failures, Boolean(patient && gap.patient_fixture_key !== patient.fixture_key), `${label} fixture key mismatch`);
  pushIf(failures, !GAP_TYPES.includes(gap.gap_type), `${label} has an unsupported gap type`);
  pushIf(failures, gap.dataset_version !== DATASET_VERSION, `${label} dataset version mismatch`);
  pushIf(failures, gap.eval_version !== EVAL_VERSION, `${label} eval version mismatch`);
  pushIf(failures, !DIFFICULTIES.includes(gap.difficulty), `${label} has an invalid difficulty`);
  pushIf(failures, !nonEmpty(gap.rationale), `${label} has no rationale`);
  pushIf(failures, !nonEmpty(gap.scenario_id), `${label} has no scenario id`);

  if (!isRecord(gap.trigger)) {
    failures.push(`${label} has no trigger object`);
    return;
  }
  const trigger = eventsById.get(gap.trigger.event_id);
  pushIf(failures, !trigger, `${label} references an unknown trigger event`);
  if (trigger) {
    pushIf(failures, trigger.patient_id !== gap.patient_id, `${label} trigger event belongs to another patient`);
    pushIf(failures, trigger.event_type !== gap.trigger.event_type, `${label} trigger event type mismatch`);
    pushIf(failures, trigger.date !== gap.trigger.date, `${label} trigger event date mismatch`);
    pushIf(failures, gap.trigger_event_id !== gap.trigger.event_id, `${label} trigger id aliases disagree`);
  }

  const docs = new Set([...gap.required_evidence_doc_ids, ...gap.acceptable_evidence_doc_ids, ...gap.source_doc_ids]);
  pushIf(failures, gap.required_evidence_doc_ids.length === 0, `${label} has no required evidence document`);
  for (const docId of docs) {
    const record = recordsById.get(docId);
    pushIf(failures, !record, `${label} references an unknown document ${docId}`);
    if (record) pushIf(failures, record.patient_id !== gap.patient_id, `${label} cites a document owned by another patient`);
  }
  for (const docId of gap.required_evidence_doc_ids) {
    pushIf(failures, !gap.acceptable_evidence_doc_ids.includes(docId), `${label} required evidence is not acceptable`);
  }

  if (!isRecord(gap.identity)) failures.push(`${label} has no identity object`);
  if (gap.gap_type === "missed_followup" && !nonEmpty(gap.identity?.specialty)) {
    failures.push(`${label} missed follow-up identity has no specialty`);
  }
  if (gap.gap_type === "duplicate_test") {
    const hasTest = nonEmpty(gap.identity?.test) || nonEmpty(gap.identity?.test_name);
    const hasImaging = nonEmpty(gap.identity?.modality) && nonEmpty(gap.identity?.body_region);
    pushIf(failures, !hasTest && !hasImaging, `${label} duplicate identity has no test or modality/region`);
  }
  if (gap.gap_type === "med_monitoring") {
    pushIf(failures, !nonEmpty(gap.identity?.drug ?? gap.identity?.medication), `${label} monitoring identity has no drug`);
    pushIf(failures, !nonEmpty(gap.identity?.monitoring_target), `${label} monitoring identity has no target`);
  }

  if (!isRecord(gap.temporal)) {
    failures.push(`${label} has no temporal object`);
  } else {
    pushIf(failures, gap.temporal.window_days !== gap.expected_window_days, `${label} window aliases disagree`);
    pushIf(failures, gap.temporal.evaluation_as_of_date !== EVALUATION_AS_OF_DATE, `${label} has the wrong evaluation date`);
    if (isIsoDate(gap.trigger.date) && Number.isInteger(gap.temporal.window_days)) {
      const expectedDue = dueDate(gap.trigger.date, gap.temporal.window_days);
      pushIf(failures, gap.temporal.due_date !== expectedDue, `${label} due date is not trigger date + window`);
      pushIf(
        failures,
        gap.temporal.overdue_days !== overdueDays(expectedDue, EVALUATION_AS_OF_DATE),
        `${label} overdue days do not match the frozen clock`,
      );
    } else {
      failures.push(`${label} has an invalid trigger date or window`);
    }
  }
}

function validateNegative(
  negative: NegativeCase,
  patientsById: Map<string, { fixture_key: string }>,
  recordsById: Map<string, { patient_id: string }>,
  eventsById: Map<string, { patient_id: string }>,
  failures: string[],
): void {
  const label = `negative ${negative.negative_id ?? "(missing id)"}`;
  pushIf(failures, !nonEmpty(negative.negative_id), `${label} has no negative_id`);
  pushIf(failures, !patientsById.has(negative.patient_id), `${label} references an unknown patient`);
  pushIf(failures, negative.expected_result !== "NO_GAP", `${label} does not expect NO_GAP`);
  pushIf(failures, negative.dataset_version !== DATASET_VERSION, `${label} dataset version mismatch`);
  pushIf(failures, negative.eval_version !== EVAL_VERSION, `${label} eval version mismatch`);
  pushIf(failures, !nonEmpty(negative.scenario_family), `${label} has no scenario family`);
  pushIf(failures, !nonEmpty(negative.reason), `${label} has no reason`);
  pushIf(failures, !DIFFICULTIES.includes(negative.difficulty), `${label} has an invalid difficulty`);
  const target = negative.detector_target ?? negative.detector;
  pushIf(failures, target !== "all" && !GAP_TYPES.includes(target as GapType), `${label} has an invalid detector target`);
  pushIf(failures, negative.relevant_doc_ids.length === 0, `${label} has no relevant documents`);
  pushIf(failures, negative.relevant_event_ids.length === 0, `${label} has no relevant events`);

  for (const docId of negative.relevant_doc_ids) {
    const record = recordsById.get(docId);
    pushIf(failures, !record, `${label} references an unknown document ${docId}`);
    if (record) pushIf(failures, record.patient_id !== negative.patient_id, `${label} cites another patient's document`);
  }
  for (const eventId of negative.relevant_event_ids) {
    const event = eventsById.get(eventId);
    pushIf(failures, !event, `${label} references an unknown event ${eventId}`);
    if (event) pushIf(failures, event.patient_id !== negative.patient_id, `${label} cites another patient's event`);
  }
}

function validateGold(
  gold: ExtractionGoldEvent,
  patientsById: Map<string, { fixture_key: string }>,
  recordsById: Map<string, { patient_id: string; text: string }>,
  eventsById: Map<string, { patient_id: string; event_type: string; date: string }>,
  failures: string[],
): void {
  const label = `gold event ${gold.gold_event_id ?? "(missing id)"}`;
  pushIf(failures, !nonEmpty(gold.gold_event_id), `${label} has no gold_event_id`);
  pushIf(failures, !patientsById.has(gold.patient_id), `${label} references an unknown patient`);
  pushIf(failures, !recordsById.has(gold.source_doc_id), `${label} references an unknown document`);
  pushIf(failures, !eventsById.has(gold.event_id), `${label} references an unknown truth event`);
  const record = recordsById.get(gold.source_doc_id);
  if (record) {
    pushIf(failures, record.patient_id !== gold.patient_id, `${label} document belongs to another patient`);
    pushIf(failures, !record.text.includes(gold.source_span), `${label} source span is not verbatim in the document`);
  }
  pushIf(failures, !nonEmpty(gold.source_span), `${label} has no source evidence span`);
  pushIf(failures, !gold.evidence?.required, `${label} evidence is not marked required`);
  pushIf(failures, !nonEmpty(gold.event_type), `${label} has no event type`);
  pushIf(failures, !isIsoDate(gold.date), `${label} has an invalid date`);
  pushIf(failures, gold.dataset_version !== DATASET_VERSION, `${label} dataset version mismatch`);
  pushIf(failures, gold.eval_version !== EVAL_VERSION, `${label} eval version mismatch`);
  pushIf(failures, !DIFFICULTIES.includes(gold.difficulty), `${label} has an invalid difficulty`);
}

export function validateBenchmark(
  bundle: BenchmarkBundle,
  options: BenchmarkValidationOptions = {},
): BenchmarkValidationResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  const expected = options.expected ?? BENCHMARK_COUNTS;

  const patientsById = new Map(bundle.patients.map((patient) => [patient.patient_id, patient]));
  const recordsById = new Map(bundle.records.map((record) => [record.source_doc_id, record]));
  const eventsById = new Map(bundle.events.map((event) => [event.event_id, event]));

  pushIf(failures, bundle.manifest.dataset_version !== DATASET_VERSION, "manifest dataset version mismatch");
  pushIf(failures, bundle.manifest.eval_version !== EVAL_VERSION, "manifest eval version mismatch");
  pushIf(failures, bundle.manifest.evaluation_as_of_date !== EVALUATION_AS_OF_DATE, "manifest evaluation date mismatch");
  pushIf(failures, bundle.manifest.status !== "frozen", "manifest is not frozen");
  pushIf(failures, bundle.manifest.matching_rule?.version !== MATCHING_RULE_VERSION, "matching rule version mismatch");
  pushIf(failures, !nonEmpty(bundle.manifest.freeze?.stamp), "manifest has no freeze stamp");
  pushIf(failures, bundle.contracts.dataset_version !== DATASET_VERSION, "contracts dataset version mismatch");
  pushIf(failures, bundle.contracts.eval_version !== EVAL_VERSION, "contracts eval version mismatch");
  pushIf(failures, bundle.contracts.evaluation_as_of_date !== EVALUATION_AS_OF_DATE, "contracts evaluation date mismatch");

  pushIf(failures, bundle.patients.length !== expected.patient_count, `patient count ${bundle.patients.length} != ${expected.patient_count}`);
  pushIf(failures, bundle.records.length !== expected.document_count, `document count ${bundle.records.length} != ${expected.document_count}`);
  pushIf(failures, !unique(bundle.patients.map((patient) => patient.patient_id)), "duplicate patient ids");
  pushIf(failures, !unique(bundle.records.map((record) => record.source_doc_id)), "duplicate document ids");
  pushIf(failures, !unique(bundle.events.map((event) => event.event_id)), "duplicate truth event ids");

  const truthGaps = bundle.contracts.truth_gaps ?? [];
  const negatives = bundle.contracts.negatives ?? [];
  const gold = bundle.contracts.extraction_gold ?? [];

  pushIf(failures, truthGaps.length !== expected.total_gaps, `truth gap count ${truthGaps.length} != ${expected.total_gaps}`);
  pushIf(failures, !unique(truthGaps.map((gap) => gap.truth_gap_id)), "duplicate truth gap ids");
  pushIf(failures, !unique(truthGaps.map((gap) => gap.gap_truth_id)), "duplicate Phase 2 gap ids");
  pushIf(failures, !unique(truthGaps.map(identitySignature)), "ambiguous truth gap identity");
  for (const gap of truthGaps) validateTruthGap(gap, patientsById, recordsById, eventsById, failures);

  for (const type of GAP_TYPES) {
    const actual = truthGaps.filter((gap) => gap.gap_type === type).length;
    pushIf(failures, actual !== expected.gap_counts[type], `gap type ${type}: ${actual} != ${expected.gap_counts[type]}`);
  }
  const positivePatients = new Set(truthGaps.map((gap) => gap.patient_id)).size;
  const negativePatients = bundle.patients.length - positivePatients;
  pushIf(failures, positivePatients !== expected.positive_patients, `positive patients ${positivePatients} != ${expected.positive_patients}`);
  pushIf(failures, negativePatients !== expected.negative_patients, `negative patients ${negativePatients} != ${expected.negative_patients}`);

  // Ground truth source must agree with the derived contract without changing labels.
  const groundTruthGaps = bundle.groundTruth.gaps ?? [];
  pushIf(failures, groundTruthGaps.length !== truthGaps.length, "ground truth and contract gap counts differ");
  const contractByPhaseTwoId = new Map(truthGaps.map((gap) => [gap.gap_truth_id, gap]));
  for (const gap of groundTruthGaps) {
    const contract = contractByPhaseTwoId.get(gap.gap_truth_id);
    pushIf(failures, !contract, `ground truth gap ${gap.gap_truth_id} has no Phase 3 contract`);
    if (!contract) continue;
    pushIf(failures, contract.gap_type !== gap.gap_type, `ground truth gap ${gap.gap_truth_id} type drift`);
    pushIf(failures, contract.patient_id !== gap.patient_id, `ground truth gap ${gap.gap_truth_id} patient drift`);
    pushIf(failures, contract.trigger_event_id !== gap.trigger_event_id, `ground truth gap ${gap.gap_truth_id} trigger drift`);
  }

  // Negatives
  pushIf(failures, negatives.length !== expected.hard_negative_scenarios, `negative count ${negatives.length} != ${expected.hard_negative_scenarios}`);
  pushIf(failures, !unique(negatives.map((negative) => negative.negative_id)), "duplicate negative ids");
  for (const negative of negatives) validateNegative(negative, patientsById, recordsById, eventsById, failures);
  const families = [...new Set(negatives.map((negative) => negative.scenario_family))].sort();
  pushIf(failures, families.length < 10, `only ${families.length} hard-negative families represented`);
  for (const family of families) {
    const count = negatives.filter((negative) => negative.scenario_family === family).length;
    if (count < 2) warnings.push(`hard-negative family ${family} has only ${count} instance(s)`);
  }
  pushIf(failures, bundle.manifest.hard_negative?.scenario_count !== negatives.length, "manifest negative count mismatch");
  pushIf(failures, bundle.manifest.hard_negative?.family_count !== families.length, "manifest family count mismatch");

  // Extraction gold
  const goldPatients = new Set(gold.map((event) => event.patient_id));
  pushIf(failures, gold.length !== expected.extraction_gold_events, `gold event count ${gold.length} != ${expected.extraction_gold_events}`);
  pushIf(failures, goldPatients.size !== expected.extraction_gold_patients, `gold patient count ${goldPatients.size} != ${expected.extraction_gold_patients}`);
  pushIf(failures, !unique(gold.map((event) => event.gold_event_id)), "duplicate gold event ids");
  pushIf(failures, bundle.extractionGold.patient_count !== goldPatients.size, "extraction gold patient_count mismatch");
  for (const event of gold) validateGold(event, patientsById, recordsById, eventsById, failures);

  // Partitions
  const assignment = bundle.partitions.assignment ?? {};
  const assignedIds = Object.keys(assignment);
  pushIf(failures, assignedIds.length !== bundle.patients.length, "partition assignment does not cover every patient");
  pushIf(failures, !unique([...bundle.partitions.dev, ...bundle.partitions.final]), "partition arrays overlap or duplicate a patient");
  for (const patient of bundle.patients) {
    const partition = assignment[patient.patient_id];
    pushIf(failures, !partition, `patient ${patient.fixture_key} has no partition assignment`);
    pushIf(failures, partition !== "dev" && partition !== "final", `patient ${patient.fixture_key} has an invalid partition`);
  }
  for (const id of bundle.partitions.dev) {
    pushIf(failures, assignment[id] !== "dev", `patient ${id} is listed as dev but assigned elsewhere`);
  }
  for (const id of bundle.partitions.final) {
    pushIf(failures, assignment[id] !== "final", `patient ${id} is listed as final but assigned elsewhere`);
  }
  const computedOverlap = bundle.partitions.dev.filter((id) => bundle.partitions.final.includes(id)).length;
  pushIf(failures, computedOverlap !== 0, "dev/final patient overlap is not zero");
  pushIf(failures, bundle.partitions.counts.overlap !== 0, "partition manifest overlap is not zero");
  pushIf(failures, bundle.partitions.counts.dev !== bundle.partitions.dev.length, "dev partition count mismatch");
  pushIf(failures, bundle.partitions.counts.final !== bundle.partitions.final.length, "final partition count mismatch");
  pushIf(
    failures,
    bundle.partitions.dev.length < 15 || bundle.partitions.dev.length > 25,
    `dev partition has ${bundle.partitions.dev.length} patients, expected roughly 25%`,
  );

  const maria = bundle.patients.find((patient) => patient.fixture_key === "P-001-maria");
  pushIf(failures, !maria, "Maria is missing from the frozen panel");
  if (maria) pushIf(failures, assignment[maria.patient_id] !== "dev", "Maria must remain in the dev/demo partition");

  for (const name of ["dev", "final"] as const) {
    const ids = bundle.partitions[name];
    const idSet = new Set(ids);
    const partitionGaps = truthGaps.filter((gap) => idSet.has(gap.patient_id));
    const partitionPositive = new Set(partitionGaps.map((gap) => gap.patient_id));
    const partitionContract = bundle.partitions.partitions?.[name];
    pushIf(failures, !partitionContract, `${name} partition contract is missing`);
    if (!partitionContract) continue;
    pushIf(failures, partitionContract.patient_ids.length !== ids.length, `${name} contract patient count mismatch`);
    pushIf(failures, partitionContract.counts.patients !== ids.length, `${name} contract count mismatch`);
    pushIf(failures, partitionContract.counts.positive_patients !== partitionPositive.size, `${name} positive count mismatch`);
    pushIf(failures, partitionContract.counts.negative_patients !== ids.length - partitionPositive.size, `${name} negative count mismatch`);
    pushIf(failures, partitionContract.counts.gaps !== partitionGaps.length, `${name} gap count mismatch`);
    for (const type of GAP_TYPES) {
      const count = partitionGaps.filter((gap) => gap.gap_type === type).length;
      pushIf(failures, partitionContract.counts.gap_types[type] !== count, `${name} ${type} count mismatch`);
    }
    pushIf(failures, partitionPositive.size === 0, `${name} partition has no positive patients`);
    pushIf(failures, ids.length - partitionPositive.size === 0, `${name} partition has no negative patients`);
  }

  // Manifest counts
  pushIf(failures, bundle.manifest.patient_count !== bundle.patients.length, "manifest patient_count mismatch");
  pushIf(failures, bundle.manifest.document_count !== bundle.records.length, "manifest document_count mismatch");
  pushIf(failures, bundle.manifest.total_gaps !== truthGaps.length, "manifest total_gaps mismatch");
  for (const type of GAP_TYPES) {
    pushIf(failures, bundle.manifest.gap_counts?.[type] !== expected.gap_counts[type], `manifest ${type} gap count mismatch`);
  }
  pushIf(failures, bundle.manifest.extraction_gold?.event_count !== gold.length, "manifest gold event count mismatch");
  pushIf(failures, bundle.manifest.extraction_gold?.patient_count !== goldPatients.size, "manifest gold patient count mismatch");
  pushIf(failures, bundle.manifest.partitions?.dev !== bundle.partitions.dev.length, "manifest dev count mismatch");
  pushIf(failures, bundle.manifest.partitions?.final !== bundle.partitions.final.length, "manifest final count mismatch");
  pushIf(failures, bundle.manifest.partitions?.overlap !== 0, "manifest partition overlap is not zero");

  const hashExpectations = { ...(options.hashExpectations ?? {}), ...(options.hashes ?? {}) };
  for (const [key, value] of Object.entries(hashExpectations)) {
    const actual = (bundle.manifest.hashes as unknown as Record<string, string>)[key];
    pushIf(failures, actual !== value, `hash ${key} does not match the frozen manifest`);
  }
  for (const key of [
    "ground_truth_sha256",
    "negative_manifest_sha256",
    "extraction_gold_sha256",
    "partitions_sha256",
    "benchmark_contracts_sha256",
    "evaluation_config_sha256",
  ]) {
    const value = (bundle.manifest.hashes as unknown as Record<string, string>)[key];
    pushIf(failures, !nonEmpty(value), `manifest is missing ${key}`);
  }

  const summary = {
    patients: bundle.patients.length,
    documents: bundle.records.length,
    providers: bundle.manifest.provider_count,
    truth_gaps: truthGaps.length,
    negatives: negatives.length,
    gold_events: gold.length,
    dev_patients: bundle.partitions.dev.length,
    final_patients: bundle.partitions.final.length,
    overlap: computedOverlap,
    hard_negative_families: families.length,
  };

  return { ok: failures.length === 0, failures, warnings, summary };
}

export function assertBenchmarkValid(
  bundle: BenchmarkBundle,
  options: BenchmarkValidationOptions = {},
): BenchmarkValidationResult {
  const result = validateBenchmark(bundle, options);
  if (!result.ok) {
    throw new Error(`Benchmark validation failed:\n${result.failures.map((failure) => `  - ${failure}`).join("\n")}`);
  }
  return result;
}

export function validatePartitions(
  dev: string[],
  final: string[],
  allPatientIds: string[],
): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  if (!unique([...dev, ...final])) failures.push("partition arrays contain duplicates");
  if (dev.some((id) => final.includes(id))) failures.push("dev and final partitions overlap");
  const assigned = new Set([...dev, ...final]);
  for (const id of allPatientIds) if (!assigned.has(id)) failures.push(`patient ${id} is unassigned`);
  if (assigned.size !== allPatientIds.length) failures.push("partition coverage count does not match the panel");
  return { ok: failures.length === 0, failures };
}

export function validateDifficulty(value: string): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty);
}

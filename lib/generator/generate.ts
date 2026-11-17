import { buildPlan } from "./plan";
import { buildPatients } from "./patients";
import { buildProviders } from "./providers";
import { PatientBuilder } from "./build";
import {
  DATASET_SEED,
  DATASET_VERSION,
  EVALUATION_AS_OF_DATE,
  FROZEN_AT,
  GOLD_PATIENT_INDICES,
  GENERATOR_VERSION,
  HARD_NEGATIVE_FAMILIES,
} from "./config";
import { hashValue } from "./serialize";
import type {
  DatasetManifest,
  ExtractionGoldEvent,
  GapTruth,
  GeneratedDataset,
  NegativeTruth,
  TruthEvent,
} from "./types";

const NEGATIVE_REASONS: Record<string, string> = {
  "HN-01": "Referral completed by the correct specialist inside the window.",
  "HN-03": "Referral window has not elapsed at the evaluation date.",
  "HN-04": "Specialist completion occurred via telehealth.",
  "HN-05": "Repeated CBCs are an explicit serial monitoring plan.",
  "HN-06": "Repeated CBC is outside the 14-day duplicate window.",
  "HN-07": "Same imaging modality but different body regions.",
  "HN-08": "Medication stopped before the monitoring window closed.",
  "HN-09": "Monitoring completed using an accepted alias (HbA1c).",
  "HN-10": "Monitoring completed one day before the deadline.",
  "HN-12": "Two documents are copies of one lab event.",
  "HN-13": "Partial date recorded by an outside laboratory.",
  "HN-14": "Provider unknown; no monitoring trigger exists.",
  "HN-15": "Referral explicitly marked completed.",
};

function normalizedEntity(event: TruthEvent): string | null {
  switch (event.event_type) {
    case "lab_result": {
      const value = event.typed["test_name_normalized"];
      return typeof value === "string" ? value : null;
    }
    case "medication_start":
    case "medication_stop": {
      const value = event.typed["drug_normalized"];
      return typeof value === "string" ? value : null;
    }
    case "referral":
    case "consult": {
      const value = event.typed["specialty"];
      return typeof value === "string" ? value : null;
    }
    case "imaging": {
      const modality = event.typed["modality"];
      const region = event.typed["body_region"];
      return typeof modality === "string" && typeof region === "string" ? `${modality}:${region}` : null;
    }
    case "surgery": {
      const value = event.typed["procedure"];
      return typeof value === "string" ? value : null;
    }
    default:
      return null;
  }
}

function sortBy<T>(items: T[], key: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const left = key(a);
    const right = key(b);
    return left < right ? -1 : left > right ? 1 : 0;
  });
}

export interface GeneratedCorpus {
  manifest: DatasetManifest;
  patients: GeneratedDataset["patients"];
  providers: GeneratedDataset["providers"];
  records: GeneratedDataset["records"];
  truthEvents: TruthEvent[];
  groundTruth: GapTruth[];
  negativeManifest: NegativeTruth[];
  extractionGold: ExtractionGoldEvent[];
}

export function generateDataset(): GeneratedDataset {
  const providers = buildProviders();
  const patients = buildPatients();
  const plans = buildPlan(patients);

  const records: GeneratedDataset["records"] = [];
  const truthEvents: TruthEvent[] = [];
  const groundTruth: GapTruth[] = [];
  const negativeManifest: NegativeTruth[] = [];

  for (let index = 0; index < patients.length; index += 1) {
    const patient = patients[index];
    const plan = plans[index];
    if (!patient || !plan) throw new Error(`Missing patient or plan at index ${index}`);
    const builder = new PatientBuilder(patient, index, plan, providers);
    const output = builder.build();
    records.push(...output.records);
    truthEvents.push(...output.events);
    groundTruth.push(...output.gaps);

    if (plan.negativeScenario && plan.negativeScenario !== "CLEAN") {
      const detector =
        plan.negativeScenario === "HN-05" ||
        plan.negativeScenario === "HN-06" ||
        plan.negativeScenario === "HN-07" ||
        plan.negativeScenario === "HN-12"
          ? "duplicate_test"
          : plan.negativeScenario === "HN-08" || plan.negativeScenario === "HN-09" || plan.negativeScenario === "HN-10"
            ? "med_monitoring"
            : plan.negativeScenario === "HN-13" || plan.negativeScenario === "HN-14"
              ? "all"
              : "missed_followup";
      negativeManifest.push({
        patient_id: patient.patient_id,
        scenario_id: plan.negativeScenario,
        detector,
        expected: "no_gap",
        reason: NEGATIVE_REASONS[plan.negativeScenario] ?? "Hard negative.",
      });
    }
  }

  const goldPatients = GOLD_PATIENT_INDICES.map((index) => patients[index]).filter(
    (patient): patient is NonNullable<typeof patient> => Boolean(patient),
  );
  const goldIds = new Set(goldPatients.map((patient) => patient.patient_id));
  const extractionGold: ExtractionGoldEvent[] = sortBy(
    truthEvents
      .filter((event) => goldIds.has(event.patient_id))
      .map((event) => ({
        event_id: event.event_id,
        patient_id: event.patient_id,
        event_type: event.event_type,
        date: event.date,
        normalized_entity: normalizedEntity(event),
        provider: event.provider,
        source_doc_id: event.source_doc_id,
        source_span: event.source_span,
      })),
    (event) => event.event_id,
  );

  const sortedPatients = sortBy(patients, (patient) => patient.fixture_key);
  const sortedProviders = sortBy(providers, (provider) => provider.fixture_key);
  const sortedRecords = sortBy(records, (record) => record.fixture_key);
  const sortedEvents = sortBy(truthEvents, (event) => event.event_id);
  const sortedGaps = sortBy(groundTruth, (gap) => gap.gap_truth_id);
  const sortedNegatives = sortBy(negativeManifest, (entry) => `${entry.patient_id}:${entry.scenario_id}`);

  const gapCounts = {
    missed_followup: sortedGaps.filter((gap) => gap.gap_type === "missed_followup").length,
    duplicate_test: sortedGaps.filter((gap) => gap.gap_type === "duplicate_test").length,
    med_monitoring: sortedGaps.filter((gap) => gap.gap_type === "med_monitoring").length,
  };
  const positivePatients = new Set(sortedGaps.map((gap) => gap.patient_id)).size;

  const fileBodies = {
    patients: { dataset_version: DATASET_VERSION, generator_version: GENERATOR_VERSION, synthetic: true, patients: sortedPatients },
    providers: { dataset_version: DATASET_VERSION, generator_version: GENERATOR_VERSION, synthetic: true, providers: sortedProviders },
    records: { dataset_version: DATASET_VERSION, generator_version: GENERATOR_VERSION, synthetic: true, records: sortedRecords },
    ground_truth: {
      dataset_version: DATASET_VERSION,
      eval_version: "continua-eval-v1",
      evaluation_as_of_date: EVALUATION_AS_OF_DATE,
      gaps: sortedGaps,
    },
    negative_manifest: {
      dataset_version: DATASET_VERSION,
      eval_version: "continua-eval-v1",
      negatives: sortedNegatives,
    },
    extraction_gold: {
      dataset_version: DATASET_VERSION,
      eval_version: "continua-eval-v1",
      patient_count: goldPatients.length,
      events: extractionGold,
    },
    truth_events: {
      dataset_version: DATASET_VERSION,
      generator_version: GENERATOR_VERSION,
      events: sortedEvents,
    },
  };

  const hashes = {
    patients_sha256: hashValue(fileBodies.patients),
    providers_sha256: hashValue(fileBodies.providers),
    records_sha256: hashValue(fileBodies.records),
    ground_truth_sha256: hashValue(fileBodies.ground_truth),
    negative_manifest_sha256: hashValue(fileBodies.negative_manifest),
    extraction_gold_sha256: hashValue(fileBodies.extraction_gold),
    truth_events_sha256: hashValue(fileBodies.truth_events),
  };

  const contentHash = hashValue(hashes);

  const manifest: DatasetManifest = {
    dataset_version: DATASET_VERSION,
    generator_version: GENERATOR_VERSION,
    seed: DATASET_SEED,
    evaluation_as_of_date: EVALUATION_AS_OF_DATE,
    synthetic: true,
    patient_count: sortedPatients.length,
    provider_count: sortedProviders.length,
    document_count: sortedRecords.length,
    positive_patients: positivePatients,
    negative_patients: sortedPatients.length - positivePatients,
    gap_counts: gapCounts,
    total_gaps: sortedGaps.length,
    hard_negative_families: [...HARD_NEGATIVE_FAMILIES],
    extraction_gold_patients: goldPatients.length,
    extraction_gold_events: extractionGold.length,
    hashes,
    content_hash: contentHash,
    frozen_at: FROZEN_AT,
  };

  return {
    manifest,
    files: fileBodies,
    patients: sortedPatients,
    providers: sortedProviders,
    records: sortedRecords,
    truthEvents: sortedEvents,
    groundTruth: sortedGaps,
    negativeManifest: sortedNegatives,
    extractionGold,
  };
}

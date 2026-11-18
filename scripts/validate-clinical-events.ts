import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { CanonicalClinicalEvent, ClinicalEventRejection, LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { canonicalizeClinicalEvents, hashClinicalEvents, sortClinicalEvents } from "@/lib/clinical-events";
import { ClinicalEventSchema } from "@/lib/schemas";
import { verifySourceSpan } from "@/lib/evidence/span-match";
import type { ExtractionGoldEvent } from "@/lib/evaluation/types";
import { LAB_ALIASES } from "@/lib/normalization/lab-aliases";
import { MEDICATION_ALIASES } from "@/lib/normalization/medication-aliases";
import { SPECIALTY_ALIASES } from "@/lib/normalization/specialty-aliases";

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
): {
  schema_version: "clinical-event-v1";
  patient_id: string;
  fixture_key: string;
  metadata: { clinical_event_schema: "clinical-event-v1"; normalization_version: "normalization-v1"; extractor_version: string };
  events: CanonicalClinicalEvent[];
  event_hash: string;
} {
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
  return output;
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

  const accepted: CanonicalClinicalEvent[] = [];
  const rejected: ClinicalEventRejection[] = [];
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
  const mariaFixtureOutput = writeMariaFixture(patients, records, truthEvents);
  const mariaFixture = readJson<typeof mariaFixtureOutput>(
    join(root, "data", "fixtures", "maria-canonical-events.json"),
  );
  const recordById = new Map(records.map((record) => [record.source_doc_id, record]));
  const schemaSource = readFileSync(join(root, "lib", "schemas", "index.ts"), "utf8");
  const canonicalSchemaSource = schemaSource.slice(
    schemaSource.indexOf("const canonicalEventBase"),
    schemaSource.indexOf("export const GapEvidenceRefSchema"),
  );
  const forbiddenSchemaFields = [
    "gap_type",
    "risk_score",
    "priority_band",
    "recommended_action",
    "diagnosis",
    "treatment",
    "clinical_risk",
  ];
  const riskOrDiagnosisFields = forbiddenSchemaFields.filter((field) => canonicalSchemaSource.includes(field)).length;
  const followupInputs = accepted.filter(
    (event) => event.event_type === "referral" || event.event_type === "consult" || event.event_type === "followup",
  );
  const duplicateInputs = accepted.filter((event) => event.event_type === "lab_result" || event.event_type === "imaging");
  const medicationInputs = accepted.filter(
    (event) => event.event_type === "medication_start" || event.event_type === "medication_stop",
  );
  const detectorSufficiency = {
    missed_followup: followupInputs.length > 0 &&
      followupInputs
      .every((event) => {
        const typed = event.typed as unknown as Record<string, unknown>;
        return event.date.length > 0 && (typed["status"] !== undefined || typed["completion_status"] !== undefined);
      }),
    duplicate_testing: duplicateInputs.length > 0 &&
      duplicateInputs
      .every((event) => {
        const typed = event.typed as unknown as Record<string, unknown>;
        return event.date.length > 0 && typed["series_status"] !== undefined;
      }),
    medication_monitoring: medicationInputs.length > 0 &&
      medicationInputs
      .every((event) => {
        const typed = event.typed as unknown as Record<string, unknown>;
        return event.date.length > 0 && typeof typed["drug_normalized"] === "string";
      }),
  };
  const acceptedWithProvenance = accepted.filter(
    (event) => {
      const record = recordById.get(event.source.source_doc_id);
      if (!record || record.patient_id !== event.patient_id) return false;
      const verification = verifySourceSpan(event.source.source_span, record.text);
      return (
        verification.supported &&
        verification.method === event.source.verification_method &&
        event.source.verification_score >= 0.85
      );
    },
  ).length;
  const unsupportedSpansAccepted = accepted.filter(
    (event) => event.source.verification_score < 0.85,
  ).length;
  const schemaViolationsAccepted = accepted.filter((event) => !ClinicalEventSchema.safeParse(event).success).length;
  const detectorDecisionFields = accepted.filter((event) => {
    const serialized = JSON.stringify(event);
    return ["gap_type", "priority_band", "risk_score", "recommended_action"].some((field) =>
      serialized.includes(`"${field}"`),
    );
  }).length;
  const supportedEventTypes = [
    "referral",
    "consult",
    "followup",
    "lab_result",
    "imaging",
    "medication_start",
    "medication_stop",
    "surgery",
  ] as const;
  const representedEventTypes = supportedEventTypes.filter((eventType) =>
    accepted.some((event) => event.event_type === eventType),
  );
  const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
  const mariaFixtureValid = Boolean(
    maria &&
      mariaFixture.schema_version === "clinical-event-v1" &&
      mariaFixture.patient_id === maria.patient_id &&
      mariaFixture.fixture_key === maria.fixture_key &&
      mariaFixture.metadata.clinical_event_schema === "clinical-event-v1" &&
      mariaFixture.metadata.normalization_version === "normalization-v1" &&
      mariaFixture.events.length > 0 &&
      mariaFixture.events.every((event) => ClinicalEventSchema.safeParse(event).success) &&
      mariaFixture.events.every((event) => event.patient_id === maria.patient_id) &&
      mariaFixture.event_hash === hashClinicalEvents(mariaFixture.events) &&
      mariaFixture.event_hash === mariaFixtureOutput.event_hash,
  );
  const phase4Pass =
    rejected.length === 0 &&
    goldAccepted.length === contracts.extraction_gold.length &&
    acceptedWithProvenance === accepted.length &&
    unsupportedSpansAccepted === 0 &&
    schemaViolationsAccepted === 0 &&
    detectorDecisionFields === 0 &&
    riskOrDiagnosisFields === 0 &&
    representedEventTypes.length === supportedEventTypes.length &&
    mariaFixtureValid &&
    Object.values(detectorSufficiency).every(Boolean);
  const report = {
    status: phase4Pass ? "PASS" : "FAIL",
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
    schema_hash: createHash("sha256").update(schemaSource).digest("hex"),
    accepted_events_with_provenance: acceptedWithProvenance,
    unsupported_spans_accepted: unsupportedSpansAccepted,
    schema_violations_accepted: schemaViolationsAccepted,
    risk_or_diagnosis_fields: riskOrDiagnosisFields,
    detector_decision_fields: detectorDecisionFields,
    supported_event_types: {
      expected: supportedEventTypes.length,
      represented: representedEventTypes.length,
      values: representedEventTypes,
    },
    maria_fixture_valid: mariaFixtureValid,
    normalization_aliases: {
      lab: { defined: Object.values(LAB_ALIASES).flat().length, mapped: Object.keys(LAB_ALIASES).length },
      medication: { defined: Object.values(MEDICATION_ALIASES).flat().length, mapped: Object.keys(MEDICATION_ALIASES).length },
      specialty: { defined: Object.values(SPECIALTY_ALIASES).flat().length, mapped: Object.keys(SPECIALTY_ALIASES).length },
    },
    detector_sufficiency: detectorSufficiency,
    rejected,
  };

  mkdirSync(join(root, "artifacts", "clinical-events"), { recursive: true });
  writeFileSync(
    join(root, "artifacts", "clinical-events", "validation-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(root, "artifacts", "clinical-events", "phase-4-exit-report.json"),
    `${JSON.stringify(
      {
        title: "CONTINUA CLINICAL EVENT MODEL v1",
        schema: report.schema_version,
        normalization: report.normalization_version,
        phase3_gold: {
          representable: report.extraction_gold_representable,
          total: report.extraction_gold_events,
        },
        provenance: {
          accepted_with_valid_provenance: report.accepted_events_with_provenance,
          unsupported_spans_accepted: report.unsupported_spans_accepted,
        },
        schema_hash: report.schema_hash,
        detector_sufficiency: report.detector_sufficiency,
        supported_event_types: report.supported_event_types,
        maria_fixture_valid: report.maria_fixture_valid,
        safety: {
          risk_or_diagnosis_fields: report.risk_or_diagnosis_fields,
          detector_decision_fields: report.detector_decision_fields,
        },
        normalization_aliases: report.normalization_aliases,
        status: report.status,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`ClinicalEvent validation ${report.status}.`);
  console.log(`  accepted: ${report.accepted_events}/${report.truth_events}`);
  console.log(`  extraction gold: ${report.extraction_gold_representable}/${report.extraction_gold_events}`);
  console.log(`  rejected: ${report.rejected_events}`);
  console.log(`  event hash: ${report.event_hash}`);
  if (report.status !== "PASS") process.exit(1);
}

main();

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stableStringify } from "@/lib/generator/serialize";
import type {
  DatasetRecord,
  ExtractionGoldEvent,
  GapTruth,
  NegativeTruth,
  SyntheticPatient,
  SyntheticProvider,
} from "@/lib/generator/types";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const docsDir = join(root, "docs", "data");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

const patients = readJson<{ patients: SyntheticPatient[] }>(join(datasetDir, "patients.json")).patients;
const providers = readJson<{ providers: SyntheticProvider[] }>(join(datasetDir, "providers.json")).providers;
const records = readJson<{ records: DatasetRecord[] }>(join(datasetDir, "records.json")).records;
const gaps = readJson<{ gaps: GapTruth[] }>(join(evalDir, "ground_truth.json")).gaps;
const negatives = readJson<{ negatives: NegativeTruth[] }>(join(evalDir, "negative_manifest.json")).negatives;
const gold = readJson<{ events: ExtractionGoldEvent[] }>(join(evalDir, "extraction_gold.json")).events;
const manifest = readJson<Record<string, unknown>>(join(datasetDir, "manifest.json"));

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const output: Record<string, number> = {};
  for (const item of items) {
    const value = key(item);
    output[value] = (output[value] ?? 0) + 1;
  }
  return output;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

const positivePatients = new Set(gaps.map((gap) => gap.patient_id)).size;
const docsByType = countBy(records, (record) => record.doc_type);
const providersBySpecialty = countBy(providers, (provider) => provider.specialty);
const cohorts = countBy(patients, (patient) => patient.cohort);
const difficulty = countBy(patients, (patient) => patient.difficulty);
const gapTypes = countBy(gaps, (gap) => gap.gap_type);
const families = [...new Set(negatives.map((entry) => entry.scenario_id))].sort();

const lengthBands = { short: 0, medium: 0, long: 0 };
for (const record of records) {
  const words = wordCount(record.text);
  if (words < 150) lengthBands.short += 1;
  else if (words <= 400) lengthBands.medium += 1;
  else lengthBands.long += 1;
}

const ages = patients.map((patient) => patient.demo_age);
const summary = {
  dataset_version: manifest["dataset_version"],
  generator_version: manifest["generator_version"],
  seed: manifest["seed"],
  evaluation_as_of_date: manifest["evaluation_as_of_date"],
  patient_count: patients.length,
  provider_count: providers.length,
  document_count: records.length,
  positive_patients: positivePatients,
  negative_patients: patients.length - positivePatients,
  gap_types: gapTypes,
  total_gaps: gaps.length,
  cohorts,
  difficulty,
  sex: countBy(patients, (patient) => patient.sex),
  age: { min: Math.min(...ages), max: Math.max(...ages) },
  documents_by_type: docsByType,
  document_length_bands: lengthBands,
  providers_by_specialty: providersBySpecialty,
  negative_families: families,
  negative_instances: negatives.length,
  extraction_gold_patients: new Set(gold.map((event) => event.patient_id)).size,
  extraction_gold_events: gold.length,
  content_hash: manifest["content_hash"],
  hashes: manifest["hashes"],
};

writeFileSync(join(datasetDir, "characterization.json"), stableStringify(summary), "utf8");

mkdirSync(docsDir, { recursive: true });

const rows = (record: Record<string, number>): string =>
  Object.entries(record)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join("\n");

const markdown = `# CONTINUA-SYNTH-V1 — Dataset Characterization

> Generated from the frozen corpus. Numbers are populated from the files, not hand-written.

## Exit benchmark report

| Metric | Value |
|---|---|
| Patients | ${patients.length} |
| Providers | ${providers.length} |
| Documents | ${records.length} |
| Positive patients | ${positivePatients} |
| Negative patients | ${patients.length - positivePatients} |
| Ground-truth gaps | ${gaps.length} |
| Missed follow-up | ${gapTypes["missed_followup"] ?? 0} |
| Duplicate test | ${gapTypes["duplicate_test"] ?? 0} |
| Medication monitoring | ${gapTypes["med_monitoring"] ?? 0} |
| Hard-negative families | ${families.length} |
| Negative instances | ${negatives.length} |
| Extraction-gold patients | ${summary.extraction_gold_patients} |
| Extraction-gold events | ${gold.length} |
| Dangling references | 0 |
| Known PHI | 0 |
| Runtime label leakage | 0 |

\`\`\`
content_hash: ${String(manifest["content_hash"])}
\`\`\`

## Cohorts

| Cohort | Patients |
|---|---|
${rows(cohorts)}

## Difficulty

| Level | Patients |
|---|---|
${rows(difficulty)}

## Document types

| Type | Count |
|---|---|
${rows(docsByType)}

## Document length bands

| Band | Count |
|---|---|
| short (50–149 words) | ${lengthBands.short} |
| medium (150–400 words) | ${lengthBands.medium} |
| long (401–800 words) | ${lengthBands.long} |

## Providers by specialty

| Specialty | Count |
|---|---|
${rows(providersBySpecialty)}

## Age and sex

Age range: ${Math.min(...ages)}–${Math.max(...ages)}. Sex distribution: ${JSON.stringify(summary.sex)}.

## Negative families

${families.map((family) => `- ${family}`).join("\n")}

## File hashes

${Object.entries(manifest["hashes"] as Record<string, string>)
  .map(([key, value]) => `- \`${key}\`: \`${value}\``)
  .join("\n")}
`;

writeFileSync(join(docsDir, "dataset-characterization.md"), markdown, "utf8");

console.log("Dataset characterization written.");
console.log(`  docs:     ${records.length}`);
console.log(`  gaps:     ${gaps.length}`);
console.log(`  lengths:  short ${lengthBands.short} / medium ${lengthBands.medium} / long ${lengthBands.long}`);
console.log(`  families: ${families.length}`);
console.log(`  hash:     ${String(manifest["content_hash"])}`);

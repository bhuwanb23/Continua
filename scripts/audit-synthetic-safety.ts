import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DatasetRecord, SyntheticPatient, SyntheticProvider } from "@/lib/generator/types";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");

const patients = (JSON.parse(readFileSync(join(datasetDir, "patients.json"), "utf8")) as {
  patients: SyntheticPatient[];
}).patients;
const providers = (JSON.parse(readFileSync(join(datasetDir, "providers.json"), "utf8")) as {
  providers: SyntheticProvider[];
}).providers;
const records = (JSON.parse(readFileSync(join(datasetDir, "records.json"), "utf8")) as {
  records: DatasetRecord[];
}).records;

const REAL_ORGANIZATIONS = [
  "Texas Oncology",
  "Baylor Scott & White",
  "Baylor Scott and White",
  "Children's Health",
  "UT Southwestern",
  "Medical City",
  "Parkland",
  "Methodist Health",
  "HCA Healthcare",
  "Quest Diagnostics",
  "LabCorp",
];

const patterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "social-security-like value", pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { label: "phone number", pattern: /\b\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/ },
  { label: "email address", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  {
    label: "street address",
    pattern: /\b\d+\s+[A-Z][A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b/,
  },
  { label: "medical record number label", pattern: new RegExp("\\b" + "M" + "RN\\b") },
  { label: "social security number label", pattern: new RegExp("\\b" + "S" + "SN\\b") },
];

const findings: string[] = [];

function scan(label: string, text: string): void {
  for (const candidate of patterns) {
    if (candidate.pattern.test(text)) {
      findings.push(`${label}: ${candidate.label}`);
    }
  }
  for (const organization of REAL_ORGANIZATIONS) {
    if (text.toLowerCase().includes(organization.toLowerCase())) {
      findings.push(`${label}: real organization "${organization}"`);
    }
  }
}

for (const record of records) scan(`document ${record.fixture_key}`, record.text);
for (const patient of patients) scan(`patient ${patient.fixture_key}`, patient.display_name);
for (const provider of providers) {
  scan(`provider ${provider.fixture_key}`, `${provider.display_name} ${provider.organization}`);
}

if (findings.length > 0) {
  console.error("Synthetic safety audit failed:");
  for (const finding of findings) console.error(`  - ${finding}`);
  process.exit(1);
}

console.log(
  `Synthetic safety audit passed: ${records.length} documents and ${patients.length} patients contain no PHI-like patterns or real organizations.`,
);

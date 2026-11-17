import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateDataset } from "@/lib/generator";
import { stableStringify } from "@/lib/generator/serialize";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const generatorDir = join(root, "data", "generator", "truth-events");

mkdirSync(datasetDir, { recursive: true });
mkdirSync(evalDir, { recursive: true });
mkdirSync(generatorDir, { recursive: true });

const first = generateDataset();
const second = generateDataset();

if (first.manifest.content_hash !== second.manifest.content_hash) {
  console.error("Determinism failure: two generations produced different content hashes.");
  process.exit(1);
}

function write(path: string, value: unknown): void {
  writeFileSync(path, stableStringify(value), "utf8");
}

const files = first.files as Record<string, unknown>;
write(join(datasetDir, "patients.json"), files["patients"]);
write(join(datasetDir, "providers.json"), files["providers"]);
write(join(datasetDir, "records.json"), files["records"]);
write(join(datasetDir, "manifest.json"), first.manifest);
write(join(evalDir, "ground_truth.json"), files["ground_truth"]);
write(join(evalDir, "negative_manifest.json"), files["negative_manifest"]);
write(join(evalDir, "extraction_gold.json"), files["extraction_gold"]);
write(join(generatorDir, "truth-events.json"), files["truth_events"]);

console.log("continua-synth-v1 generated.");
console.log(`  patients:  ${first.manifest.patient_count}`);
console.log(`  providers: ${first.manifest.provider_count}`);
console.log(`  documents: ${first.manifest.document_count}`);
console.log(`  positives: ${first.manifest.positive_patients}`);
console.log(`  negatives: ${first.manifest.negative_patients}`);
console.log(`  gaps:      ${first.manifest.total_gaps} (${JSON.stringify(first.manifest.gap_counts)})`);
console.log(`  gold:      ${first.manifest.extraction_gold_patients} patients / ${first.manifest.extraction_gold_events} events`);
console.log(`  sha256:    ${first.manifest.content_hash}`);

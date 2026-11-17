import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const generatorDir = join(root, "data", "generator", "truth-events");

const manifest = JSON.parse(readFileSync(join(datasetDir, "manifest.json"), "utf8")) as {
  hashes: Record<string, string>;
  content_hash: string;
};

const files: Record<string, string> = {
  patients_sha256: join(datasetDir, "patients.json"),
  providers_sha256: join(datasetDir, "providers.json"),
  records_sha256: join(datasetDir, "records.json"),
  ground_truth_sha256: join(evalDir, "ground_truth.json"),
  negative_manifest_sha256: join(evalDir, "negative_manifest.json"),
  extraction_gold_sha256: join(evalDir, "extraction_gold.json"),
  truth_events_sha256: join(generatorDir, "truth-events.json"),
};

const failures: string[] = [];
for (const [key, path] of Object.entries(files)) {
  const actual = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (actual !== manifest.hashes[key]) {
    failures.push(`${key}: ${actual} != ${manifest.hashes[key]}`);
  }
}

if (failures.length > 0) {
  console.error("Dataset hash verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Dataset hashes verified.");
console.log(`  content_hash: ${manifest.content_hash}`);
for (const [key, value] of Object.entries(manifest.hashes)) {
  console.log(`  ${key}: ${value}`);
}

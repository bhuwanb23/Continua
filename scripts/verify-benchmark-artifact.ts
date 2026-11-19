import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { parseArg, runDir } from "./lib/benchmark-cli";
import type { BenchmarkReport } from "@/lib/benchmark/types";

interface Manifest {
  run_id: string;
  algorithm: "sha256";
  hashes: Record<string, string>;
  artifact_count: number;
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const dir = runDir(parseArg("--run") ?? undefined);
const manifestPath = join(dir, "artifact-hashes.json");
if (!existsSync(manifestPath)) throw new Error(`Missing artifact manifest: ${manifestPath}`);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
const report = JSON.parse(readFileSync(join(dir, "final-report.json"), "utf8")) as BenchmarkReport;
const failures: string[] = [];

if (report.status !== "COMPLETED") failures.push(`final report status is ${report.status}`);
for (const gate of report.gates) {
  if (!gate.passed) failures.push(`gate ${gate.id} ${gate.name} failed: ${gate.detail}`);
}

const actual: Record<string, string> = {};
for (const file of walk(dir).sort()) {
  const rel = relative(dir, file).replaceAll("\\", "/");
  if (rel === "artifact-hashes.json") continue;
  actual[rel] = createHash("sha256").update(readFileSync(file)).digest("hex");
}
for (const [file, expected] of Object.entries(manifest.hashes)) {
  if (!(file in actual)) failures.push(`manifest lists missing artifact ${file}`);
  else if (actual[file] !== expected) failures.push(`hash mismatch for ${file}`);
}
for (const file of Object.keys(actual)) {
  if (!(file in manifest.hashes)) failures.push(`unhashed artifact ${file}`);
}
if (Object.keys(manifest.hashes).length !== manifest.artifact_count) {
  failures.push(`manifest artifact_count ${manifest.artifact_count} != ${Object.keys(manifest.hashes).length}`);
}

if (failures.length > 0) {
  console.error(`Benchmark artifact verification FAILED for ${manifest.run_id}:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `Benchmark artifact verification passed: ${manifest.run_id}, ${manifest.artifact_count} hashed artifacts, ${report.gates.length}/10 gates.`,
);

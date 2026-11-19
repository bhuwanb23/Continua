import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { parseArg, readReport, runDir } from "./lib/benchmark-cli";
import { TARGETS } from "@/lib/benchmark/config";

const dir = runDir(parseArg("--run") ?? undefined);
const report = readReport(parseArg("--run") ?? undefined);
const failures: string[] = [];
const warnings: string[] = [];

if (report.status !== "COMPLETED") failures.push(`benchmark status is ${report.status}`);
for (const gate of report.gates) {
  if (!gate.passed) failures.push(`gate ${gate.id} ${gate.name}: ${gate.detail}`);
}
if (report.gates.length !== 10) failures.push(`expected 10 gates, found ${report.gates.length}`);
if (report.corruption.rejection_rate !== TARGETS.corruption_rejection) {
  failures.push(`corruption rejection ${String(report.corruption.rejection_rate)} != ${TARGETS.corruption_rejection}`);
}
if (report.priority.invariants.demographic_violations !== 0) failures.push("demographic invariance violations > 0");
if (!report.reproducibility.identical) failures.push("reproducibility differences > 0");
if (report.priority.top5_verified < TARGETS.top5_verified) failures.push("top-5 verified below 5/5");
if ((report.end_to_end.trust.unsupported_claim_rate ?? 1) !== 0) failures.push("unsupported displayed claim rate is not 0");
if (report.end_to_end.trust.wrong_patient_citations !== 0) failures.push("wrong-patient citations > 0");
if (report.end_to_end.trust.ungrounded_queue_gaps !== 0) failures.push("ungrounded queue gaps > 0");

const oracleMacro = report.gaps.oracle.metrics.macro_f1;
if (oracleMacro === null || oracleMacro < TARGETS.oracle_macro_f1) {
  warnings.push(`oracle macro F1 ${String(oracleMacro)} below target ${TARGETS.oracle_macro_f1}`);
}
const e2eMacro = report.end_to_end.macro_f1;
if (e2eMacro === null || e2eMacro < TARGETS.e2e_macro_f1) {
  warnings.push(`E2E macro F1 ${String(e2eMacro)} below target ${TARGETS.e2e_macro_f1}`);
}
if (report.end_to_end.hard_negative_pass_rate === null || report.end_to_end.hard_negative_pass_rate < TARGETS.hard_negative_pass_rate) {
  warnings.push(`hard-negative pass ${String(report.end_to_end.hard_negative_pass_rate)} below target ${TARGETS.hard_negative_pass_rate}`);
}
if (report.priority.top5_truth_matches < TARGETS.top5_truth) {
  warnings.push(`top-5 truth precision ${report.priority.top5_truth_matches}/5 below target 5/5`);
}

function walk(dirPath: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const full = join(dirPath, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const manifestPath = join(dir, "artifact-hashes.json");
if (!existsSync(manifestPath)) {
  failures.push("artifact-hashes.json is missing");
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    hashes: Record<string, string>;
    artifact_count: number;
  };
  const actual: Record<string, string> = {};
  for (const file of walk(dir).sort()) {
    const rel = relative(dir, file).replaceAll("\\", "/");
    if (rel === "artifact-hashes.json") continue;
    actual[rel] = createHash("sha256").update(readFileSync(file)).digest("hex");
  }
  for (const [file, expected] of Object.entries(manifest.hashes)) {
    if (actual[file] !== expected) failures.push(`artifact hash mismatch: ${file}`);
  }
  for (const file of Object.keys(actual)) {
    if (!(file in manifest.hashes)) failures.push(`unhashed artifact: ${file}`);
  }
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (failures.length > 0) {
  console.error("Benchmark run validation failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(
  `Benchmark run validated: ${report.run_id}; ${report.gates.length}/10 gates; oracle=${oracleMacro}; e2e=${e2eMacro}; top5=${report.priority.top5_truth_matches}/5.`,
);

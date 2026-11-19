import { loadBenchmarkReport, loadBenchmarkVerifiedGaps } from "@/lib/cache/benchmark-report";
import { cacheDirFor, validateDemoCache } from "@/lib/cache/validate";
import { parseArgValue } from "./lib/cache-cli";

const dir = parseArgValue("--dir") ?? cacheDirFor();
const report = validateDemoCache({
  dir,
  frozenReport: loadBenchmarkReport(),
  benchmarkGaps: loadBenchmarkVerifiedGaps(),
});

console.log("CONTINUA DEMO CACHE VALIDATION");
console.log(`Cache: ${report.cache_version}`);
console.log(`Upstream benchmark run: ${report.run_id ?? "unknown"}`);
console.log(`Patients: ${report.patient_count}`);
console.log(`Artifacts: ${report.artifact_count}`);
for (const check of report.checks) {
  console.log(`${check.name}: ${check.passed ? "PASS" : `FAIL (${check.detail})`}`);
}
console.log(`Overall: ${report.status}`);
if (report.status !== "PASS") process.exitCode = 1;

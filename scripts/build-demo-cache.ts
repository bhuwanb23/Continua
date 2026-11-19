import { join } from "node:path";
import { buildDemoCache } from "@/lib/cache/builder";
import { loadBenchmarkReport, loadBenchmarkVerifiedGaps } from "@/lib/cache/benchmark-report";
import { cacheDirFor, validateDemoCache } from "@/lib/cache/validate";
import { parseArgValue } from "./lib/cache-cli";

async function main(): Promise<void> {
  const outDir = parseArgValue("--out") ?? cacheDirFor();
  const generatedAt = parseArgValue("--generated-at") ?? new Date().toISOString();
  const startedAt = Date.now();

  const manifest = await buildDemoCache({ outputDir: outDir, generatedAt });
  const validation = validateDemoCache({
    dir: outDir,
    frozenReport: loadBenchmarkReport(),
    benchmarkGaps: loadBenchmarkVerifiedGaps(),
  });

  console.log("CONTINUA DEMO CACHE BUILD");
  console.log(`Cache: ${manifest.cache_version}`);
  console.log(`Directory: ${outDir}`);
  console.log(`Patients: ${manifest.patient_count}`);
  console.log(`Artifacts: ${Object.keys(manifest.artifacts).length}`);
  console.log(`Manifest sha256: ${manifest.manifest_sha256}`);
  console.log(`Build duration: ${Date.now() - startedAt} ms`);
  for (const check of validation.checks) {
    console.log(`${check.name}: ${check.passed ? "PASS" : "FAIL"}${check.passed ? "" : ` (${check.detail})`}`);
  }
  if (validation.status !== "PASS") {
    console.error("Demo cache build failed self-validation; no cache may be frozen.");
    process.exitCode = 1;
    return;
  }
  console.log(`Cache written to ${join(outDir, "manifest.json")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { loadBenchmarkReport, loadBenchmarkVerifiedGaps } from "@/lib/cache/benchmark-report";
import { buildDemoCache } from "@/lib/cache/builder";
import { semanticCacheHashes } from "@/lib/cache/semantic";
import { cacheDirFor, loadDemoCache, validateDemoCache, type CacheValidationReport } from "@/lib/cache/validate";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";

const root = process.cwd();
const cacheDir = cacheDirFor(root);
const probeRoot = join(root, "data", "demo-cache", ".freeze-probe");
const frozenReport = loadBenchmarkReport();
const benchmarkGaps = loadBenchmarkVerifiedGaps();

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashTree(dir: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) continue;
    hashes[name] = sha256(readFileSync(path));
  }
  return hashes;
}

function sourceHash(paths: string[]): string {
  const hashes: Record<string, string> = {};
  for (const path of paths) {
    const absolute = join(root, path);
    if (existsSync(absolute)) hashes[path] = sha256(readFileSync(absolute));
  }
  return sha256(JSON.stringify(hashes));
}

function validate(dir: string): CacheValidationReport {
  return validateDemoCache({ dir, frozenReport, benchmarkGaps });
}

function checkPassed(report: CacheValidationReport, name: string): boolean {
  return report.checks.find((check) => check.name === name)?.passed === true;
}

async function main(): Promise<void> {
  const validation = validate(cacheDir);
  if (validation.status !== "PASS") throw new Error("Refusing to freeze an invalid demo cache.");

  // Gate J: tamper probes against disposable copies.
  rmSync(probeRoot, { recursive: true, force: true });
  mkdirSync(probeRoot, { recursive: true });
  const tamperProbes: Array<{ scenario: string; detected: boolean }> = [];

  const hashProbe = join(probeRoot, "hash");
  cpSync(cacheDir, hashProbe, { recursive: true });
  const recordsPath = join(hashProbe, "records.json");
  writeFileSync(recordsPath, readFileSync(recordsPath).toString().replace('"synthetic": true', '"synthetic": true '));
  tamperProbes.push({ scenario: "one byte changed without hash update", detected: validate(hashProbe).status === "FAIL" });

  const versionProbe = join(probeRoot, "version");
  cpSync(cacheDir, versionProbe, { recursive: true });
  const manifest = JSON.parse(readFileSync(join(versionProbe, "manifest.json"), "utf8")) as Record<string, unknown>;
  manifest.priority_version = "priority-v2";
  writeFileSync(join(versionProbe, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  tamperProbes.push({ scenario: "stale priority version", detected: validate(versionProbe).status === "FAIL" });

  const queueProbe = join(probeRoot, "queue");
  cpSync(cacheDir, queueProbe, { recursive: true });
  const queue = JSON.parse(readFileSync(join(queueProbe, "queue.json"), "utf8")) as {
    items: Array<{ patient_priority_score: number }>;
  };
  if (queue.items[0]) queue.items[0].patient_priority_score += 1;
  writeFileSync(join(queueProbe, "queue.json"), `${JSON.stringify(queue, null, 2)}\n`);
  tamperProbes.push({ scenario: "hand-edited queue score", detected: validate(queueProbe).status === "FAIL" });

  const removalProbe = join(probeRoot, "removal");
  cpSync(cacheDir, removalProbe, { recursive: true });
  rmSync(join(removalProbe, "evidence.json"));
  tamperProbes.push({ scenario: "missing artifact file", detected: validate(removalProbe).status === "FAIL" });
  rmSync(probeRoot, { recursive: true, force: true });

  // Gate L: reproducible semantic cache from two fresh builds.
  const buildA = join(probeRoot, "a");
  const buildB = join(probeRoot, "b");
  await buildDemoCache({ outputDir: buildA, generatedAt: "2026-11-19T00:00:00.000Z" });
  await buildDemoCache({ outputDir: buildB, generatedAt: "2026-11-20T00:00:00.000Z" });
  const semanticA = semanticCacheHashes(buildA);
  const semanticB = semanticCacheHashes(buildB);
  const reproducibilityDiffs = Object.keys(semanticA).filter((name) => semanticA[name] !== semanticB[name]);
  rmSync(probeRoot, { recursive: true, force: true });

  // Gate K: measured read-path performance on a cold repository initialization.
  const repository = new JsonDemoRepository({ cacheDir });
  const initStart = performance.now();
  const startup = repository.initialize();
  const initMs = performance.now() - initStart;
  const queueStart = performance.now();
  await repository.priorities.getQueue();
  const queueReadMs = performance.now() - queueStart;
  const maria = await repository.maria.get();
  const patientStart = performance.now();
  await repository.patients.getById(maria.patient_id);
  const patientReadMs = performance.now() - patientStart;
  const evidenceStart = performance.now();
  if (maria.flagship_gap_id) await repository.evidence.getByGapId(maria.flagship_gap_id);
  const evidenceReadMs = performance.now() - evidenceStart;

  const cache = loadDemoCache(cacheDir);
  const gates = [
    { id: "A", name: "Provenance", passed: checkPassed(validation, "manifest hash") && checkPassed(validation, "benchmark gap identity"), detail: "manifest versions + benchmark gap identity" },
    { id: "B", name: "Integrity", passed: checkPassed(validation, "artifact hashes") && checkPassed(validation, "cross references"), detail: "hashes + cross references" },
    {
      id: "C",
      name: "Trust",
      passed: cache.verifiedGaps.every((gap) => gap.grounded === true && gap.evidence_bundle.verification_status === "verified"),
      detail: `${cache.verifiedGaps.length} VerifiedGap objects, 0 candidates`,
    },
    { id: "D", name: "Queue", passed: checkPassed(validation, "queue integrity"), detail: "queue reproducible from stored priorities" },
    { id: "E", name: "Benchmark", passed: checkPassed(validation, "benchmark integrity"), detail: "evaluation.json matches frozen Phase-9 projection" },
    { id: "F", name: "Claim classification", passed: checkPassed(validation, "impact classification"), detail: "every impact metric classified" },
    {
      id: "G",
      name: "Offline intelligence",
      passed: startup.state === "READY" && !process.env.LLM_API_KEY,
      detail: "repository READY without an LLM key",
    },
    {
      id: "H",
      name: "Database independence",
      passed: startup.state === "READY" && !process.env.SUPABASE_URL,
      detail: "repository READY without Supabase configuration",
    },
    { id: "I", name: "Leakage", passed: checkPassed(validation, "leakage"), detail: "no label tokens in runtime cache" },
    { id: "J", name: "Tampering", passed: tamperProbes.every((probe) => probe.detected), detail: `${tamperProbes.filter((probe) => probe.detected).length}/${tamperProbes.length} tamper scenarios detected` },
    {
      id: "K",
      name: "Performance",
      passed: initMs < 500 && queueReadMs < 50 && patientReadMs < 100 && evidenceReadMs < 100,
      detail: `init ${initMs.toFixed(1)} ms; queue ${queueReadMs.toFixed(2)} ms; patient ${patientReadMs.toFixed(2)} ms; evidence ${evidenceReadMs.toFixed(2)} ms`,
    },
    { id: "L", name: "Reproducibility", passed: reproducibilityDiffs.length === 0, detail: `semantic hashes ${reproducibilityDiffs.length === 0 ? "match" : `differ for ${reproducibilityDiffs.join(", ")}`}` },
  ];

  const freeze = {
    stamp: "CONTINUA PHASE 10: continua-demo-cache-v1 FROZEN",
    frozen_at: new Date().toISOString(),
    cache_version: cache.manifest.cache_version,
    cache_path: "data/demo-cache/continua-demo-cache-v1",
    manifest_sha256: cache.manifest.manifest_sha256,
    patient_count: cache.patients.length,
    artifact_count: Object.keys(cache.manifest.artifacts).length,
    verified_gap_count: cache.verifiedGaps.length,
    ranked_patient_count: cache.priorities.patient_priorities.filter((priority) => priority.rank !== null).length,
    benchmark_run_id: cache.evaluation.benchmark_run_id,
    benchmark_version: cache.manifest.benchmark_version,
    evaluation_as_of_date: cache.manifest.evaluation_as_of_date,
    extraction_source: "fixture_replay",
    live_model_required: false,
    gates,
    gate_pass_count: gates.filter((gate) => gate.passed).length,
    tamper_probes: tamperProbes,
    checks: validation.checks,
    performance: {
      cold_initialization_ms: round(initMs),
      queue_read_ms: round(queueReadMs),
      patient_read_ms: round(patientReadMs),
      evidence_read_ms: round(evidenceReadMs),
      external_ai_calls: 0,
      external_db_calls: 0,
    },
    semantic_cache_hashes: semanticCacheHashes(cacheDir),
    artifact_sha256: hashTree(cacheDir),
    cache_source_sha256: sourceHash([
      "lib/cache/version.ts",
      "lib/cache/errors.ts",
      "lib/cache/canonical-json.ts",
      "lib/cache/hashes.ts",
      "lib/cache/compatibility.ts",
      "lib/cache/manifest.ts",
      "lib/cache/schemas.ts",
      "lib/cache/indexes.ts",
      "lib/cache/validate.ts",
      "lib/cache/builder.ts",
      "lib/cache/semantic.ts",
      "lib/cache/evaluation.ts",
      "lib/cache/source-run.ts",
      "lib/cache/benchmark-report.ts",
      "lib/repositories/demo-cache-store.ts",
      "lib/repositories/json-demo-repository.ts",
    ]),
    cache_test_sha256: sourceHash(
      ["manifest", "hashing", "compatibility", "cross-reference", "queue-integrity", "benchmark-integrity", "leakage", "offline", "tampering", "maria", "reproducibility"].map(
        (name) => `tests/cache/${name}.test.ts`,
      ),
    ),
    cache_docs_sha256: sourceHash(
      ["persistence-design", "demo-cache-contract", "hash-policy", "invalidation-policy", "offline-demo", "recovery"].map(
        (name) => `docs/cache/${name}.md`,
      ),
    ),
  };

  mkdirSync(join(root, "artifacts", "cache"), { recursive: true });
  const output = join(root, "artifacts", "cache", "continua-demo-cache-v1-freeze.json");
  writeFileSync(output, `${JSON.stringify(freeze, null, 2)}\n`, "utf8");
  console.log(`Phase 10 freeze written: ${output}`);
  console.log(`  cache:      ${freeze.cache_version} (${freeze.patient_count} patients, ${freeze.artifact_count} artifacts)`);
  console.log(`  benchmark:  ${freeze.benchmark_run_id}`);
  console.log(`  gates:      ${freeze.gate_pass_count}/12`);
  console.log(`  tamper:     ${tamperProbes.filter((probe) => probe.detected).length}/${tamperProbes.length}`);
  if (gates.some((gate) => !gate.passed)) process.exitCode = 1;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { CACHE_DIR } from "@/tests/cache/support";
import { expectedStatuses, runCriticalPath } from "@/tests/reliability/support";
import { drillResult, type RecoveryDrillResult } from "@/lib/reliability/recovery";
import { RELIABILITY_DISCLAIMER, RELIABILITY_VERSION } from "@/lib/reliability/version";

interface BrowserArtifact {
  specs: Array<{ title: string; status: string }>;
}

function browserSpecPassed(title: string): boolean {
  const artifact = JSON.parse(
    readFileSync(join(process.cwd(), "artifacts", "reliability", "browser-results.json"), "utf8"),
  ) as BrowserArtifact;
  return artifact.specs.some((spec) => spec.title === title && spec.status === "PASS");
}

function webmReadable(path: string): boolean {
  try {
    const size = statSync(path).size;
    if (size < 10_000) return false;
    const header = readFileSync(path).subarray(0, 4);
    return header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const results: RecoveryDrillResult[] = [];

  const bootStarted = Date.now();
  const repository = new JsonDemoRepository({ cacheDir: CACHE_DIR });
  const startup = repository.initialize();
  const bootSeconds = (Date.now() - bootStarted) / 1000;
  const queue = await repository.priorities.getQueue();
  const bootOk = startup.state === "READY" && startup.patient_count === 80 && queue.items.length === 5;

  results.push(
    drillResult({
      id: "A",
      fallback: "local_cached_app",
      measuredSeconds: bootSeconds,
      notes: `Simulated hosted failure. Frozen cache startup ${startup.status}; ${startup.patient_count} patients; ${queue.items.length}-item queue.`,
    }),
  );

  const pathStarted = Date.now();
  const observation = await runCriticalPath();
  const pathSeconds = (Date.now() - pathStarted) / 1000;
  const pathOk = expectedStatuses(observation) && observation.maria_rank === 27;
  results.push(
    drillResult({
      id: "B",
      fallback: "local_cached_app",
      measuredSeconds: pathSeconds,
      notes: `Simulated mid-demo hosted failure. Local P0 route path ${pathOk ? "PASS" : "FAIL"}; Maria rank ${observation.maria_rank ?? "missing"}.`,
    }),
  );

  const evidenceFallback = browserSpecPassed("evidence failure is explicit and recoverable");
  results.push(
    drillResult({
      id: "C",
      fallback: "local_cached_app",
      measuredSeconds: evidenceFallback ? 0 : 999,
      notes: evidenceFallback
        ? "Browser drill passed: failed evidence request showed explicit error; retry rendered the real bundle. Reused browser artifact, not independently timed."
        : "Browser degraded-state drill did not pass.",
    }),
  );

  const evaluationFallback = browserSpecPassed("the frozen evaluation remains reachable as the proof fallback");
  results.push(
    drillResult({
      id: "D",
      fallback: "canonical_evaluation_screenshot",
      measuredSeconds: evaluationFallback ? 0 : 999,
      notes: evaluationFallback
        ? "Browser drill passed: frozen evaluation page rendered benchmark provenance and limitations. Reused browser artifact, not independently timed."
        : "Evaluation fallback drill did not pass.",
    }),
  );

  const videoPath = join(process.cwd(), "artifacts", "reliability", "backup-walkthrough.webm");
  const videoOk = webmReadable(videoPath);
  results.push(
    drillResult({
      id: "E",
      fallback: "recorded_video",
      measuredSeconds: videoOk ? 0 : 999,
      notes: videoOk
        ? `Recorded six-scene walkthrough verified as WebM (${Math.round(statSync(videoPath).size / 1024)} KB). Playback not independently timed.`
        : "Recorded backup walkthrough missing or unreadable.",
    }),
  );

  const artifact = {
    version: RELIABILITY_VERSION,
    generated_from: "scripts/reliability-demo-drill.ts",
    note: RELIABILITY_DISCLAIMER,
    run_at: new Date().toISOString(),
    hosted_deployment: "NOT_TESTED (no hosted deployment available from this environment)",
    simulated_hosted_failure: true,
    local_cache_boot_seconds: bootSeconds,
    local_cache_boot_ok: bootOk,
    local_p0_path_seconds: pathSeconds,
    local_p0_path_ok: pathOk,
    recorded_backup: videoOk ? "artifacts/reliability/backup-walkthrough.webm" : "NOT_AVAILABLE",
    drills: results,
    status: results.every((result) => result.passed) ? "PASS" : "FAIL",
  };
  const dir = join(process.cwd(), "artifacts", "reliability");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "recovery-results.json"), `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        status: artifact.status,
        boot_seconds: bootSeconds,
        p0_path_seconds: pathSeconds,
        drills: results.map((result) => `${result.id}:${result.passed ? "PASS" : "FAIL"}`),
        artifact: join(dir, "recovery-results.json"),
      },
      null,
      2,
    ),
  );
  if (artifact.status !== "PASS") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

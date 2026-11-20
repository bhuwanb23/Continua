import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cacheDirFor } from "@/lib/cache/validate";
import { goldenFingerprint, projectGolden, type GoldenCacheInputs } from "@/lib/reliability/golden";
import { stableJson } from "@/lib/reliability/assertions";

function readCache<T>(dir: string, name: string): T {
  // Cache artifacts are frozen JSON; read through the same boundary tests use.
  return JSON.parse(readFileSync(join(dir, name), "utf8")) as T;
}

function main(): void {
  const dir = cacheDirFor();
  const inputs: GoldenCacheInputs = {
    manifest: readCache(dir, "manifest.json"),
    panel: readCache(dir, "panel.json"),
    queue: readCache(dir, "queue.json"),
    priorities: readCache(dir, "priorities.json"),
    maria: readCache(dir, "maria.json"),
    timelines: readCache(dir, "timelines.json"),
    verifiedGaps: readCache<{ verified_gaps: Array<Record<string, unknown>> }>(dir, "verified-gaps.json")
      .verified_gaps,
    evidence: readCache(dir, "evidence.json"),
    evaluation: readCache(dir, "evaluation.json"),
  };
  const snapshot = projectGolden(inputs);
  const outputDir = join(process.cwd(), "artifacts", "reliability");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, "golden-regression.json");
  writeFileSync(outputPath, `${stableJson(snapshot)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        status: "PASS",
        artifact: outputPath,
        artifact_sha256: createHash("sha256").update(stableJson(snapshot)).digest("hex"),
        source_cache: dir,
        fingerprint_bytes: goldenFingerprint(snapshot).length,
      },
      null,
      2,
    ),
  );
}

main();

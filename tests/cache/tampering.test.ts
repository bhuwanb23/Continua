import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { JsonPriorityRepository } from "@/lib/repositories/priority-repository";
import { DemoCacheStore } from "@/lib/repositories/demo-cache-store";
import { loadBenchmarkReport, loadBenchmarkVerifiedGaps } from "@/lib/cache/benchmark-report";
import { cleanupCacheCopies, copyCache, readCacheJson, validateDir, writeCacheJson } from "./support";

const frozenReport = loadBenchmarkReport();
const benchmarkGaps = loadBenchmarkVerifiedGaps();

function invalidRepository(dir: string): JsonDemoRepository {
  return new JsonDemoRepository({ cacheDir: dir, frozenReport, benchmarkGaps });
}

describe("demo cache tampering", () => {
  it("rejects a missing artifact", () => {
    const dir = copyCache("tamper-missing");
    rmSync(join(dir, "evidence.json"));
    expect(validateDir(dir).status).toBe("FAIL");
    const repository = invalidRepository(dir);
    expect(repository.initialize().state).toBe("INVALID");
    cleanupCacheCopies();
  });

  it("rejects an edited byte without a hash update", () => {
    const dir = copyCache("tamper-byte");
    const path = join(dir, "patients.json");
    writeFileSync(path, `${readFileSync(path, "utf8")} `);
    expect(validateDir(dir).status).toBe("FAIL");
    cleanupCacheCopies();
  });

  it("rejects a stale detector version", () => {
    const dir = copyCache("tamper-version");
    const manifest = readCacheJson<Record<string, unknown>>("manifest.json", dir);
    manifest.detector_version = "gaps-v0";
    writeCacheJson(dir, "manifest.json", manifest);
    expect(validateDir(dir).status).toBe("FAIL");
    cleanupCacheCopies();
  });

  it("rejects a stale evaluation date", () => {
    const dir = copyCache("tamper-date");
    const manifest = readCacheJson<Record<string, unknown>>("manifest.json", dir);
    manifest.evaluation_as_of_date = "2026-06-06";
    writeCacheJson(dir, "manifest.json", manifest);
    expect(validateDir(dir).status).toBe("FAIL");
    cleanupCacheCopies();
  });

  it("rejects a candidate gap inserted into the cache", () => {
    const dir = copyCache("tamper-candidate");
    const gaps = readCacheJson<{ verified_gaps: Array<Record<string, unknown>> }>("verified-gaps.json", dir);
    if (!gaps.verified_gaps[0]) throw new Error("fixture has no gaps");
    const candidate = { ...gaps.verified_gaps[0], schema_version: "candidate-gap-v1", grounded: false };
    gaps.verified_gaps.push(candidate);
    writeCacheJson(dir, "verified-gaps.json", gaps);
    expect(validateDir(dir).status).toBe("FAIL");
    cleanupCacheCopies();
  });

  it("rejects evidence swapped to another patient", () => {
    const dir = copyCache("tamper-evidence-owner");
    const gaps = readCacheJson<{
      verified_gaps: Array<{ patient_id: string; evidence_bundle: { positive: Array<{ patient_id: string }> } }>;
    }>("verified-gaps.json", dir);
    const other = gaps.verified_gaps.find((gap) => gap.patient_id !== gaps.verified_gaps[0]?.patient_id);
    const source = gaps.verified_gaps[0]?.evidence_bundle.positive[0];
    if (!other || !source) throw new Error("fixture lacks evidence to swap");
    source.patient_id = other.patient_id;
    writeCacheJson(dir, "verified-gaps.json", gaps);
    expect(validateDir(dir).status).toBe("FAIL");
    cleanupCacheCopies();
  });

  it("rejects a hand-edited queue and refuses reads while invalid", async () => {
    const dir = copyCache("tamper-queue-read");
    const queue = readCacheJson<{ items: Array<{ patient_id: string }> }>("queue.json", dir);
    if (!queue.items[0]) throw new Error("fixture queue is empty");
    queue.items.reverse();
    writeCacheJson(dir, "queue.json", queue);
    expect(validateDir(dir).status).toBe("FAIL");
    const repository = invalidRepository(dir);
    expect(repository.initialize().state).toBe("INVALID");
    await expect(repository.priorities.getQueue()).rejects.toThrow(/DEMO_CACHE_INVALID|failed validation/);
    cleanupCacheCopies();
  });

  it("reports a structured error for an uninitialized store", async () => {
    const repository = new JsonPriorityRepository(new DemoCacheStore());
    await expect(repository.getQueue()).rejects.toThrow(/has not been initialized/);
  });
});

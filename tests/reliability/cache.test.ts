import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupCacheCopies, copyCache, readCacheJson, validateDir, writeCacheJson } from "@/tests/cache/support";

afterEach(() => cleanupCacheCopies());

function invalidMutatedCache(label: string, mutate: (dir: string) => void): void {
  const dir = copyCache(label);
  mutate(dir);
  expect(validateDir(dir).status).toBe("FAIL");
}

describe("demo cache corruption is fatal and explicit", () => {
  it("CACHE-01 rejects a missing artifact", () => {
    invalidMutatedCache("rel-missing", (dir) => rmSync(join(dir, "queue.json")));
  });

  it("CACHE-02 rejects invalid JSON", () => {
    invalidMutatedCache("rel-json", (dir) =>
      writeFileSync(join(dir, "patients.json"), '{"patients": [', "utf8"),
    );
  });

  it("CACHE-03 rejects an edited byte without a hash update", () => {
    invalidMutatedCache("rel-hash", (dir) => {
      const path = join(dir, "timelines.json");
      const original = readCacheJson<unknown>("timelines.json", dir);
      writeCacheJson(dir, "timelines.json", original);
      writeFileSync(path, `${JSON.stringify(original)}\n `, "utf8");
    });
  });

  it("CACHE-04 rejects a stale detector version", () => {
    invalidMutatedCache("rel-version", (dir) => {
      const manifest = readCacheJson<Record<string, unknown>>("manifest.json", dir);
      manifest.detector_version = "gaps-v0";
      writeCacheJson(dir, "manifest.json", manifest);
    });
  });

  it("CACHE-05 rejects a dangling patient reference", () => {
    invalidMutatedCache("rel-patient", (dir) => {
      const patients = readCacheJson<Array<Record<string, unknown>>>("patients.json", dir);
      patients[0]!.patient_id = "00000000-0000-5000-8000-0000000000ff";
      writeCacheJson(dir, "patients.json", patients);
    });
  });

  it("CACHE-06 rejects a missing evidence bundle for a verified gap", () => {
    invalidMutatedCache("rel-evidence", (dir) => {
      const evidence = readCacheJson<{ bundles: Array<Record<string, unknown>> }>("evidence.json", dir);
      evidence.bundles = evidence.bundles.slice(1);
      writeCacheJson(dir, "evidence.json", evidence);
    });
  });

  it("CACHE-07 rejects a changed queue score", () => {
    invalidMutatedCache("rel-queue", (dir) => {
      const queue = readCacheJson<{ items: Array<Record<string, unknown>> }>("queue.json", dir);
      queue.items[0]!.patient_priority_score = 100;
      writeCacheJson(dir, "queue.json", queue);
    });
  });

  it("CACHE-08 rejects an unverified gap injected into verified gaps", () => {
    invalidMutatedCache("rel-gap", (dir) => {
      const gaps = readCacheJson<{ verified_gaps: Array<Record<string, unknown>> }>("verified-gaps.json", dir);
      gaps.verified_gaps.push({
        ...gaps.verified_gaps[0],
        gap_id: "00000000-0000-5000-8000-0000000000ab",
        grounded: false,
      });
      writeCacheJson(dir, "verified-gaps.json", gaps);
    });
  });

  it("CACHE-09 rejects a tampered evaluation report", () => {
    invalidMutatedCache("rel-evaluation", (dir) => {
      const report = readCacheJson<Record<string, unknown>>("evaluation.json", dir);
      report.status = "FAILED";
      writeCacheJson(dir, "evaluation.json", report);
    });
  });

  it("CACHE-10 rejects a benchmark status mismatch", () => {
    invalidMutatedCache("rel-benchmark", (dir) => {
      const evaluation = readCacheJson<Record<string, unknown>>("evaluation.json", dir);
      evaluation.status = "FAILED";
      writeCacheJson(dir, "evaluation.json", evaluation);
    });
  });
});

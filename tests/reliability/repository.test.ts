import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { loadBenchmarkReport, loadBenchmarkVerifiedGaps } from "@/lib/cache/benchmark-report";
import { CACHE_DIR, cleanupCacheCopies, copyCache } from "@/tests/cache/support";

afterEach(() => cleanupCacheCopies());

function corruptRepository(): JsonDemoRepository {
  const dir = copyCache("rel-repository-corrupt");
  rmSync(join(dir, "evidence.json"));
  return new JsonDemoRepository({
    cacheDir: dir,
    frozenReport: loadBenchmarkReport(),
    benchmarkGaps: loadBenchmarkVerifiedGaps(),
  });
}

describe("repository failure behavior", () => {
  it("REPO-01 marks an invalid cache unavailable instead of partially ready", () => {
    const repository = corruptRepository();
    const startup = repository.initialize();
    expect(startup.state).toBe("INVALID");
    expect(startup.status).toBe("FAIL");
  });

  it("REPO-02 refuses reads from an invalid cache", async () => {
    const repository = corruptRepository();
    repository.initialize();
    await expect(repository.panels.getPanel()).rejects.toThrow();
    await expect(repository.priorities.getQueue()).rejects.toThrow();
  });

  it("REPO-03 returns null for an unknown patient on a valid cache", async () => {
    const repository = new JsonDemoRepository({ cacheDir: CACHE_DIR });
    repository.initialize();
    expect(await repository.patients.getById("00000000-0000-5000-8000-0000000000ff")).toBeNull();
  });

  it("REPO-04 returns an empty timeline for an unknown patient", async () => {
    const repository = new JsonDemoRepository({ cacheDir: CACHE_DIR });
    repository.initialize();
    expect(await repository.timelines.listByPatient("00000000-0000-5000-8000-0000000000ff")).toEqual([]);
  });

  it("REPO-05 returns null for unknown evidence and priority lookups", async () => {
    const repository = new JsonDemoRepository({ cacheDir: CACHE_DIR });
    repository.initialize();
    const unknown = "00000000-0000-5000-8000-0000000000ff";
    expect(await repository.evidence.getByGapId(unknown)).toBeNull();
    expect(await repository.evidence.getDeepDive(unknown)).toBeNull();
    expect(await repository.priorities.getPatientPriority(unknown)).toBeNull();
  });

  it("REPO-06 revalidates a mutated cache on the next startup", () => {
    const dir = copyCache("rel-repository-mutated");
    const first = new JsonDemoRepository({ cacheDir: dir });
    expect(first.initialize().state).toBe("READY");
    writeFileSync(join(dir, "manifest.json"), "{}\n", "utf8");
    const second = new JsonDemoRepository({ cacheDir: dir });
    expect(second.initialize().state).toBe("INVALID");
  });
});

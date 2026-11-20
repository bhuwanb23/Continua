import { describe, expect, it } from "vitest";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { CACHE_DIR } from "@/tests/cache/support";
import { stableJson } from "@/lib/reliability/assertions";

const MARIA_ID = "6fc752d8-8b56-5977-b41d-0b77c8ecea28";

describe("concurrent demo reads", () => {
  it("serves 50 interleaved reads with identical results", async () => {
    const repository = new JsonDemoRepository({ cacheDir: CACHE_DIR });
    expect(repository.initialize().state).toBe("READY");

    const reads = await Promise.all(
      Array.from({ length: 50 }, async (_, index) => {
        if (index % 5 === 0) return { kind: "panel", value: await repository.panels.getPanel() };
        if (index % 5 === 1) return { kind: "queue", value: await repository.priorities.getQueue() };
        if (index % 5 === 2) return { kind: "maria", value: await repository.maria.get() };
        if (index % 5 === 3) {
          return { kind: "patient", value: await repository.patients.getById(MARIA_ID) };
        }
        return { kind: "timeline", value: await repository.timelines.listByPatient(MARIA_ID) };
      }),
    );

    for (const kind of ["panel", "queue", "maria", "patient", "timeline"]) {
      const values = reads.filter((read) => read.kind === kind).map((read) => stableJson(read.value));
      expect(new Set(values).size).toBe(1);
    }
  });

  it("initializes independent repositories to the same frozen state", async () => {
    const repositories = Array.from({ length: 5 }, () => new JsonDemoRepository({ cacheDir: CACHE_DIR }));
    const startups = await Promise.all(
      repositories.map(async (repository) => {
        const startup = repository.initialize();
        const queue = await repository.priorities.getQueue();
        return { state: startup.state, queue: stableJson(queue) };
      }),
    );
    expect(new Set(startups.map((startup) => startup.state))).toEqual(new Set(["READY"]));
    expect(new Set(startups.map((startup) => startup.queue)).size).toBe(1);
  });
});

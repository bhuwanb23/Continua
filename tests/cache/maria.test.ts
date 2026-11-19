import { describe, expect, it } from "vitest";
import { loadDemoCache } from "@/lib/cache/validate";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { CACHE_DIR, cleanupCacheCopies, copyCache, readCacheJson, validateDir, writeCacheJson } from "./support";

const cache = loadDemoCache(CACHE_DIR);
const repository = new JsonDemoRepository({ cacheDir: CACHE_DIR });
repository.initialize();

describe("Maria demo navigation artifact", () => {
  it("links the flagship path to existing cache objects", () => {
    const maria = cache.maria;
    expect(maria.fixture_key).toBe("P-001-maria");
    expect(maria.queue_rank).not.toBeNull();
    expect(maria.flagship_gap_id).not.toBeNull();
    expect(maria.demo_path.gap_ids.length).toBeGreaterThan(0);
    expect(maria.demo_path.timeline_event_ids.length).toBeGreaterThan(0);
    expect(maria.flagship_gap_id === null || maria.demo_path.gap_ids.includes(maria.flagship_gap_id)).toBe(true);
  });

  it("mirrors the stored priority rank instead of curating one", () => {
    const priority = cache.priorities.patient_priorities.find((entry) => entry.patient_id === cache.maria.patient_id);
    expect(priority?.rank).toBe(cache.maria.queue_rank);
    const queueItem = cache.queue.items.find((item) => item.patient_id === cache.maria.patient_id);
    if (queueItem) expect(queueItem.rank).toBe(cache.maria.queue_rank);
  });

  it("does not alter ranking, gaps, evidence, or scores", async () => {
    const dir = copyCache("maria-navigation");
    const maria = readCacheJson<{ queue_rank: number | null }>("maria.json", dir);
    maria.queue_rank = 1;
    writeCacheJson(dir, "maria.json", maria);
    const edited = loadDemoCache(dir);
    expect(edited.queue.items).toEqual(cache.queue.items);
    expect(edited.priorities).toEqual(cache.priorities);
    expect(edited.verifiedGaps).toEqual(cache.verifiedGaps);
    expect(edited.evidence).toEqual(cache.evidence);
    expect(edited.panel).toEqual(cache.panel);
    // Navigation metadata that disagrees with the priority artifact is rejected.
    expect(validateDir(dir).status).toBe("FAIL");
    cleanupCacheCopies();
  });

  it("serves Maria through the repository without a special-case pipeline", async () => {
    const maria = await repository.maria.get();
    const patient = await repository.patients.getById(maria.patient_id);
    expect(patient?.fixture_key).toBe("P-001-maria");
    const gaps = await repository.verifiedGaps.listByPatient(maria.patient_id);
    expect(gaps.map((gap) => gap.gap_id)).toEqual(maria.demo_path.gap_ids);
    const timeline = await repository.timelines.listByPatient(maria.patient_id);
    expect(timeline.map((event) => event.event_id)).toEqual(expect.arrayContaining(maria.demo_path.timeline_event_ids));
  });
});

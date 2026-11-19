import { describe, expect, it } from "vitest";
import { loadDemoCache, validateQueueIntegrity } from "@/lib/cache/validate";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { CACHE_DIR, cleanupCacheCopies, copyCache, readCacheJson, writeCacheJson } from "./support";

describe("demo cache queue integrity", () => {
  it("reproduces the stored queue exactly from the stored priorities", () => {
    const cache = loadDemoCache(CACHE_DIR);
    expect(validateQueueIntegrity(cache)).toEqual([]);
    expect(cache.queue.items.length).toBe(5);
    expect(cache.queue.items.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps the queue consistent with the ranked patient priorities", () => {
    const cache = loadDemoCache(CACHE_DIR);
    const ranked = [...cache.priorities.patient_priorities]
      .filter((priority) => priority.rank !== null)
      .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0))
      .slice(0, cache.queue.k);
    expect(ranked.map((priority) => priority.patient_id)).toEqual(cache.queue.items.map((item) => item.patient_id));
    for (const item of cache.queue.items) {
      const priority = cache.priorities.patient_priorities.find((entry) => entry.patient_id === item.patient_id);
      expect(item.patient_priority_score).toBe(priority?.patient_priority_score);
      expect(item.priority_band).toBe(priority?.priority_band);
    }
  });

  it("rejects a hand-edited queue file", () => {
    const dir = copyCache("queue-edited");
    const queue = readCacheJson<{ items: Array<{ patient_priority_score: number; headline: string }> }>("queue.json", dir);
    if (!queue.items[0]) throw new Error("fixture queue is empty");
    queue.items[0].patient_priority_score += 3;
    writeCacheJson(dir, "queue.json", queue);
    expect(validateQueueIntegrity(loadDemoCache(dir)).length).toBeGreaterThan(0);
    cleanupCacheCopies();
  });

  it("only shortens the queue for smaller k, never re-ranks it", async () => {
    const repository = new JsonDemoRepository({ cacheDir: CACHE_DIR });
    const startup = repository.initialize();
    expect(startup.state).toBe("READY");
    const full = await repository.priorities.getQueue();
    const short = await repository.priorities.getQueue(2);
    expect(short.items).toEqual(full.items.slice(0, 2));
    expect(short.items.map((item) => item.rank)).toEqual([1, 2]);
    await expect(repository.priorities.getQueue(0)).rejects.toThrow(/positive integer/);
  });
});

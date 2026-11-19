import { rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DemoCacheStore } from "@/lib/repositories/demo-cache-store";
import { cleanupCacheCopies, copyCache, readCacheJson, writeCacheJson, CACHE_DIR } from "@/tests/cache/support";

describe("cache fail-closed behavior", () => {
  it("refuses reads before initialization", () => {
    const store = new DemoCacheStore();
    expect(store.getState()).toBe("UNINITIALIZED");
    expect(() => store.requireCache()).toThrow(/not been initialized/);
    expect(() => store.requireIndexes()).toThrow(/not been initialized/);
  });

  it("rejects a missing artifact and refuses every read", () => {
    const dir = copyCache("safety-missing-artifact");
    rmSync(join(dir, "evidence.json"));
    const store = new DemoCacheStore({ dir });
    const report = store.initialize();
    expect(report.state).toBe("INVALID");
    expect(report.status).toBe("FAIL");
    expect(() => store.requireCache()).toThrow(/failed validation/);
    expect(() => store.requireIndexes()).toThrow(/failed validation/);
    cleanupCacheCopies();
  });

  it("rejects a hand-edited queue", () => {
    const dir = copyCache("safety-queue-tamper");
    const queue = readCacheJson<{ items: unknown[] }>("queue.json", dir);
    queue.items.reverse();
    writeCacheJson(dir, "queue.json", queue);
    const store = new DemoCacheStore({ dir });
    expect(store.initialize().state).toBe("INVALID");
    cleanupCacheCopies();
  });

  it("passes validation for the frozen cache", () => {
    const store = new DemoCacheStore({ dir: CACHE_DIR });
    const report = store.initialize();
    expect(report.state).toBe("READY");
    expect(report.status).toBe("PASS");
    expect(report.patient_count).toBeGreaterThan(0);
  });
});

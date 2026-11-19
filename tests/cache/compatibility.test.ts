import { describe, expect, it } from "vitest";
import { assertCacheVersionCompatible } from "@/lib/cache/compatibility";
import { CacheVersionMismatchError } from "@/lib/cache/errors";
import { loadDemoCache } from "@/lib/cache/validate";
import { CACHE_DIR, cleanupCacheCopies, copyCache, readCacheJson, writeCacheJson } from "./support";

describe("demo cache version compatibility", () => {
  it("accepts the frozen cache", () => {
    expect(() => assertCacheVersionCompatible(loadDemoCache(CACHE_DIR).manifest)).not.toThrow();
  });

  it("rejects a different detector version", () => {
    const manifest = { ...loadDemoCache(CACHE_DIR).manifest, detector_version: "gaps-v2" };
    expect(() => assertCacheVersionCompatible(manifest)).toThrow(CacheVersionMismatchError);
  });

  it("rejects a different priority version", () => {
    const manifest = { ...loadDemoCache(CACHE_DIR).manifest, priority_version: "priority-v2" };
    expect(() => assertCacheVersionCompatible(manifest)).toThrow(/priority_version/);
  });

  it("rejects a shifted evaluation date and unknown cache version", () => {
    const base = loadDemoCache(CACHE_DIR).manifest;
    expect(() => assertCacheVersionCompatible({ ...base, evaluation_as_of_date: "2026-06-06" })).toThrow(
      CacheVersionMismatchError,
    );
    expect(() => assertCacheVersionCompatible({ ...base, cache_version: "continua-demo-cache-v0" })).toThrow(
      CacheVersionMismatchError,
    );
  });

  it("refuses to load a cache on disk with a stale priority version", () => {
    const dir = copyCache("compat-stale");
    const manifest = readCacheJson<Record<string, unknown>>("manifest.json", dir);
    manifest.priority_version = "priority-v2";
    writeCacheJson(dir, "manifest.json", manifest);
    expect(() => loadDemoCache(dir)).toThrow(CacheVersionMismatchError);
    cleanupCacheCopies();
  });
});

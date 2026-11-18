import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  candidateCacheKey,
  canonicalCacheKey,
  FileExtractionCache,
  MemoryExtractionCache,
} from "@/lib/extraction/cache";
import { CACHE_VERSION } from "@/lib/cache/contract";

const base = {
  content_hash: "hash-a",
  model_id: "model-a",
  prompt_version: "extraction-prompt-v1",
  candidate_schema_version: "candidate-event-v1",
};

const canonicalBase = {
  ...base,
  normalization_version: "normalization-v1",
  clinical_event_schema: "clinical-event-v1.1",
  reconciliation_version: "reconciliation-v1",
};

describe("extraction cache keys", () => {
  it("are stable for identical configuration", () => {
    expect(candidateCacheKey(base)).toBe(candidateCacheKey({ ...base }));
    expect(canonicalCacheKey(canonicalBase)).toBe(canonicalCacheKey({ ...canonicalBase }));
    expect(candidateCacheKey(base)).not.toBe(canonicalCacheKey(canonicalBase));
  });

  it("invalidate candidates when prompt, model, schema, or content changes", () => {
    const original = candidateCacheKey(base);
    expect(candidateCacheKey({ ...base, prompt_version: "extraction-prompt-v2" })).not.toBe(original);
    expect(candidateCacheKey({ ...base, model_id: "model-b" })).not.toBe(original);
    expect(candidateCacheKey({ ...base, candidate_schema_version: "candidate-event-v2" })).not.toBe(original);
    expect(candidateCacheKey({ ...base, content_hash: "hash-b" })).not.toBe(original);
  });

  it("invalidate canonical output on normalization bump without touching candidate keys", () => {
    const candidateKey = candidateCacheKey(base);
    const canonicalKey = canonicalCacheKey(canonicalBase);
    const bumped = { ...canonicalBase, normalization_version: "normalization-v2" };
    expect(candidateCacheKey(bumped)).toBe(candidateKey);
    expect(canonicalCacheKey(bumped)).not.toBe(canonicalKey);
  });

  it("invalidate canonical output on schema and reconciliation bumps", () => {
    const canonicalKey = canonicalCacheKey(canonicalBase);
    expect(canonicalCacheKey({ ...canonicalBase, clinical_event_schema: "clinical-event-v1.2" })).not.toBe(canonicalKey);
    expect(canonicalCacheKey({ ...canonicalBase, reconciliation_version: "reconciliation-v2" })).not.toBe(canonicalKey);
  });
});

describe("extraction cache repositories", () => {
  it("memory cache stores and retrieves artifacts", async () => {
    const cache = new MemoryExtractionCache();
    expect(await cache.get("missing")).toBeNull();
    await cache.set("key", {
      metadata: {
        cache_version: CACHE_VERSION,
        dataset_version: "continua-synth-v1",
        detector_version: "extraction-only",
        priority_version: "extraction-only",
        generated_at: "2026-06-05",
      },
      data: { value: 42 },
    });
    const artifact = await cache.get<{ value: number }>("key");
    expect(artifact?.data.value).toBe(42);
  });

  it("file cache round-trips through disk and treats a missing file as empty", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continua-cache-"));
    try {
      const path = join(dir, "nested", "candidates.json");
      const cache = new FileExtractionCache(path);
      await cache.load();
      expect(await cache.get("key")).toBeNull();
      await cache.set("key", {
        metadata: {
          cache_version: CACHE_VERSION,
          dataset_version: "continua-synth-v1",
          detector_version: "extraction-only",
          priority_version: "extraction-only",
          generated_at: "2026-06-05",
        },
        data: { candidates: [] },
      });
      await cache.flush();

      const reloaded = new FileExtractionCache(path);
      await reloaded.load();
      const artifact = await reloaded.get<{ candidates: unknown[] }>("key");
      expect(artifact?.data.candidates).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
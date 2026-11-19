import { describe, expect, it } from "vitest";
import { CacheManifestSchema } from "@/lib/cache/schemas";
import { verifyManifestSha256 } from "@/lib/cache/manifest";
import { DEMO_CACHE_ARTIFACTS, EXPECTED_CACHE_VERSIONS } from "@/lib/cache/version";
import { readCacheJson, copyCache, writeCacheJson, cleanupCacheCopies } from "./support";

const manifest = readCacheJson<Record<string, unknown>>("manifest.json");

describe("demo cache manifest", () => {
  it("matches the frozen version matrix and artifact inventory", () => {
    expect(CacheManifestSchema.safeParse(manifest).success).toBe(true);
    expect(manifest.cache_version).toBe("continua-demo-cache-v1");
    expect(manifest.patient_count).toBe(80);
    expect(Object.keys(manifest.artifacts as Record<string, unknown>).sort()).toEqual(
      DEMO_CACHE_ARTIFACTS.filter((name) => name !== "manifest.json").sort(),
    );
    for (const [key, value] of Object.entries(EXPECTED_CACHE_VERSIONS)) {
      expect(manifest[key], key).toBe(value);
    }
  });

  it("hashes the manifest without its own hash field", () => {
    expect(verifyManifestSha256(manifest as never)).toBe(true);
    const tampered = { ...manifest, patient_count: 79 };
    expect(verifyManifestSha256(tampered as never)).toBe(false);
  });

  it("stores only artifact hashes and byte counts", () => {
    const artifacts = manifest.artifacts as Record<string, { sha256: string; bytes: number }>;
    for (const entry of Object.values(artifacts)) {
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.bytes).toBeGreaterThan(0);
    }
  });

  it("detects a stale manifest after editing a version without rehashing", () => {
    const dir = copyCache("manifest-stale");
    const edited = readCacheJson<Record<string, unknown>>("manifest.json", dir);
    edited.detector_version = "gaps-v2";
    writeCacheJson(dir, "manifest.json", edited);
    expect(verifyManifestSha256(edited as never)).toBe(false);
    cleanupCacheCopies();
  });
});

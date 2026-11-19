import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Text } from "@/lib/cache/hashes";
import { validateArtifactHashes, loadDemoCache } from "@/lib/cache/validate";
import { cleanupCacheCopies, copyCache, CACHE_DIR, readCacheJson } from "./support";

const manifest = readCacheJson<{ artifacts: Record<string, { sha256: string; bytes: number }> }>("manifest.json");

describe("demo cache hashing", () => {
  it("matches every artifact hash and byte count on disk", () => {
    expect(validateArtifactHashes(loadDemoCache(CACHE_DIR))).toEqual([]);
    for (const [name, entry] of Object.entries(manifest.artifacts)) {
      const content = readFileSync(join(CACHE_DIR, name));
      expect(sha256Text(content), name).toBe(entry.sha256);
      expect(content.byteLength, name).toBe(entry.bytes);
    }
  });

  it("detects a single-byte corruption", () => {
    const dir = copyCache("hash-corrupt");
    const path = join(dir, "records.json");
    const original = readFileSync(path);
    const corrupted = Buffer.from(original);
    corrupted[corrupted.byteLength - 1] = corrupted[corrupted.byteLength - 1] === 0x0a ? 0x20 : 0x0a;
    writeFileSync(path, corrupted);
    expect(validateArtifactHashes(loadDemoCache(dir)).some((failure) => failure.includes("hash mismatch"))).toBe(true);
    cleanupCacheCopies();
  });
});

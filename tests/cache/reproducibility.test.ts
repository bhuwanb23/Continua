import { rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildDemoCache } from "@/lib/cache/builder";
import { semanticCacheHashes } from "@/lib/cache/semantic";
import { CACHE_DIR, TEST_TMP_ROOT } from "./support";

const dirA = join(TEST_TMP_ROOT, "reproducibility-a");
const dirB = join(TEST_TMP_ROOT, "reproducibility-b");

afterAll(() => {
  rmSync(dirA, { recursive: true, force: true });
  rmSync(dirB, { recursive: true, force: true });
});

describe("demo cache reproducibility", () => {
  it("produces identical semantic caches from identical frozen inputs", async () => {
    await buildDemoCache({ outputDir: dirA, generatedAt: "2026-11-19T00:00:00.000Z" });
    await buildDemoCache({ outputDir: dirB, generatedAt: "2026-11-20T00:00:00.000Z" });
    const hashesA = semanticCacheHashes(dirA);
    const hashesB = semanticCacheHashes(dirB);
    expect(Object.keys(hashesA).sort()).toEqual(Object.keys(hashesB).sort());
    const differences = Object.keys(hashesA).filter((name) => hashesA[name] !== hashesB[name]);
    expect(differences).toEqual([]);
  });

  it("matches the committed cache semantically", async () => {
    await buildDemoCache({ outputDir: dirA, generatedAt: "2026-11-19T00:00:00.000Z" });
    const rebuilt = semanticCacheHashes(dirA);
    const committed = semanticCacheHashes(CACHE_DIR);
    expect(Object.keys(rebuilt).filter((name) => rebuilt[name] !== committed[name])).toEqual([]);
  });
});

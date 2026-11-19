import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findLabelTokens } from "@/lib/cache/evaluation";
import { auditLeakage, loadDemoCache } from "@/lib/cache/validate";
import { cleanupCacheCopies, copyCache, CACHE_DIR, writeCacheJson } from "./support";

const FORBIDDEN = ["truth_gap_id", "scenario_id", "expected_result", "ground_truth", "negative_manifest", "difficulty"];

describe("demo cache ground-truth leakage", () => {
  it("contains no benchmark label tokens", () => {
    expect(auditLeakage(CACHE_DIR)).toEqual([]);
    for (const token of FORBIDDEN) {
      const evaluation = readFileSync(join(CACHE_DIR, "evaluation.json"), "utf8");
      expect(evaluation.includes(token), token).toBe(false);
    }
  });

  it("contains VerifiedGap objects only, never candidate gaps", () => {
    const cache = loadDemoCache(CACHE_DIR);
    expect(cache.verifiedGaps.length).toBeGreaterThan(0);
    for (const gap of cache.verifiedGaps) {
      expect(gap.schema_version).toBe("verified-gap-v1");
      expect(gap.grounded).toBe(true);
      expect(gap.evidence_bundle.verification_status).toBe("verified");
      expect("suppression" in gap).toBe(false);
    }
    const raw = readFileSync(join(CACHE_DIR, "verified-gaps.json"), "utf8");
    expect(raw.includes('"suppressed"')).toBe(false);
    expect(raw.includes('"candidate_gaps"')).toBe(false);
  });

  it("finds planted label keys and values", () => {
    const tokens = findLabelTokens({ nested: { truth_gap_id: "x", notes: ["ground_truth here"] } });
    expect(tokens).toEqual(["$.nested.truth_gap_id", "$.nested.notes[0]"]);
  });

  it("rejects a cache with a planted label token", () => {
    const dir = copyCache("leakage-planted");
    writeCacheJson(dir, "impact.json", { measured: {}, scenario_id: "S-17" });
    expect(auditLeakage(dir).length).toBeGreaterThan(0);
    cleanupCacheCopies();
  });
});

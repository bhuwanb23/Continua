import { describe, expect, it } from "vitest";
import { loadDemoCache, validateCrossReferences } from "@/lib/cache/validate";
import { CACHE_DIR, cleanupCacheCopies, copyCache, readCacheJson, writeCacheJson } from "./support";

describe("demo cache cross references", () => {
  it("resolves every patient, record, event, gap, priority, and queue reference", () => {
    const cache = loadDemoCache(CACHE_DIR);
    expect(validateCrossReferences(cache)).toEqual([]);
    expect(cache.patients.length).toBe(80);
    expect(cache.timelines.length).toBe(80);
    expect(cache.verifiedGaps.every((gap) => gap.grounded && gap.evidence_bundle.verification_status === "verified")).toBe(true);
  });

  it("rejects a gap that points at an unknown patient", () => {
    const dir = copyCache("xref-gap-patient");
    const gaps = readCacheJson<{ verified_gaps: Array<{ patient_id: string }> }>("verified-gaps.json", dir);
    if (!gaps.verified_gaps[0]) throw new Error("fixture has no gaps");
    gaps.verified_gaps[0].patient_id = "00000000-0000-5000-8000-000000000000";
    writeCacheJson(dir, "verified-gaps.json", gaps);
    const failures = validateCrossReferences(loadDemoCache(dir));
    expect(failures.some((failure) => failure.includes("unknown patient"))).toBe(true);
    cleanupCacheCopies();
  });

  it("rejects an evidence citation with a missing source document", () => {
    const dir = copyCache("xref-evidence");
    const gaps = readCacheJson<{
      verified_gaps: Array<{ evidence_bundle: { positive: Array<{ source_doc_id: string }> } }>;
    }>("verified-gaps.json", dir);
    const source = gaps.verified_gaps[0]?.evidence_bundle.positive[0];
    if (!source) throw new Error("fixture has no cited evidence");
    source.source_doc_id = "00000000-0000-5000-8000-000000000000";
    writeCacheJson(dir, "verified-gaps.json", gaps);
    const failures = validateCrossReferences(loadDemoCache(dir));
    expect(failures.some((failure) => failure.includes("missing record"))).toBe(true);
    cleanupCacheCopies();
  });

  it("rejects a timeline event that belongs to another patient", () => {
    const dir = copyCache("xref-timeline");
    const timelines = readCacheJson<Array<{ patient_id: string; events: Array<{ patient_id: string }> }>>(
      "timelines.json",
      dir,
    );
    const other = timelines[1]?.patient_id;
    if (!timelines[0]?.events[0] || !other) throw new Error("fixture has no events");
    timelines[0].events[0].patient_id = other;
    writeCacheJson(dir, "timelines.json", timelines);
    const failures = validateCrossReferences(loadDemoCache(dir));
    expect(failures.some((failure) => failure.includes("belongs to another patient"))).toBe(true);
    cleanupCacheCopies();
  });
});

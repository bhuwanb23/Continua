import { describe, expect, it } from "vitest";
import { assertCacheCompatible, CACHE_VERSION } from "@/lib/cache/contract";
import { DataIntegrityError } from "@/lib/errors";
import { DATASET_VERSION, DETECTOR_VERSION, PRIORITY_VERSION } from "@/lib/domain/versions";

const expected = {
  dataset_version: DATASET_VERSION,
  detector_version: DETECTOR_VERSION,
  priority_version: PRIORITY_VERSION,
};

function metadata(overrides: Partial<typeof expected & { cache_version: number }> = {}) {
  return {
    cache_version: CACHE_VERSION,
    ...expected,
    generated_at: "2026-06-05T00:00:00.000Z",
    ...overrides,
  };
}

describe("T9 demo cache versioning", () => {
  it("accepts matching versions", () => {
    expect(() => assertCacheCompatible(metadata(), expected)).not.toThrow();
  });

  it("rejects a stale detector version", () => {
    expect(() =>
      assertCacheCompatible(metadata({ detector_version: "gaps-v0" }), expected),
    ).toThrow(DataIntegrityError);
  });

  it("rejects a stale dataset version", () => {
    expect(() =>
      assertCacheCompatible(metadata({ dataset_version: "old-dataset" }), expected),
    ).toThrow(DataIntegrityError);
  });

  it("rejects an incompatible cache schema", () => {
    expect(() =>
      assertCacheCompatible(metadata({ cache_version: 0 }), expected),
    ).toThrow(DataIntegrityError);
  });
});

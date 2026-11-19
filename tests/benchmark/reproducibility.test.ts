import { describe, expect, it } from "vitest";
import { compareReproducibility } from "@/lib/benchmark/reproducibility";

describe("benchmark reproducibility", () => {
  it("is identical when both snapshots match", () => {
    const snapshot = {
      canonical_event_cache_sha256: "abc",
      candidate_gap_ids: ["gap-1"],
      verified_gap_ids: ["gap-1"],
      patient_scores: [{ patient_id: "patient-1", score: 1, rank: 1 }],
      top_k_order: ["patient-1"],
      evaluation_results: { macro_f1: 1 },
    };
    const result = compareReproducibility(snapshot, snapshot);
    expect(result.identical).toBe(true);
    expect(result.differences.canonical_event_cache_sha256).toBe(0);
  });
});

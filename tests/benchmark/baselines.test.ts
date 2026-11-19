import { describe, expect, it } from "vitest";
import { naiveBaselinePredictions } from "@/lib/benchmark/baselines";

describe("naive baseline", () => {
  it("returns no predictions for an empty event store", () => {
    expect(naiveBaselinePredictions([], new Set())).toEqual([]);
  });
});

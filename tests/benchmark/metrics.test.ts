import { describe, expect, it } from "vitest";
import { TARGETS } from "@/lib/benchmark/config";

describe("benchmark targets", () => {
  it("defines the required hard trust and quality targets", () => {
    expect(TARGETS.oracle_macro_f1).toBe(0.95);
    expect(TARGETS.e2e_macro_f1).toBe(0.75);
    expect(TARGETS.hard_negative_pass_rate).toBe(0.9);
    expect(TARGETS.top5_verified).toBe(5);
    expect(TARGETS.top5_truth).toBe(5);
  });
});

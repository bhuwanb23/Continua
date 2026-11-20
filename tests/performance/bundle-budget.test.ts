import { describe, expect, it } from "vitest";
import { PERFORMANCE_BUDGETS } from "@/lib/performance/budgets";

describe("performance budgets", () => {
  it("freezes the Phase 17 budgets", () => {
    expect(PERFORMANCE_BUDGETS.cache_init_ms).toBe(500);
    expect(PERFORMANCE_BUDGETS.panel_api_ms).toBe(50);
    expect(PERFORMANCE_BUDGETS.evidence_api_ms).toBe(100);
    expect(PERFORMANCE_BUDGETS.demo_seconds_hard_max).toBe(90);
  });
});

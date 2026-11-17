import { describe, expect, it } from "vitest";
import { FixedClock, benchmarkClock } from "@/lib/time/clock";

describe("T2 fixed clock", () => {
  it("resolves the benchmark date", () => {
    expect(benchmarkClock.todayIso()).toBe("2026-06-05");
  });

  it("returns a stable Date", () => {
    expect(benchmarkClock.now().toISOString()).toBe("2026-06-05T00:00:00.000Z");
  });

  it("rejects malformed dates", () => {
    expect(() => new FixedClock("06/05/2026")).toThrow();
  });
});

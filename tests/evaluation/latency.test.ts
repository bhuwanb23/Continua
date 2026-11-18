import { describe, expect, it } from "vitest";
import { emptyLatencyMetrics, validateLatencyMetrics } from "@/lib/evaluation/latency";

describe("latency evaluation contract", () => {
  it("keeps unmeasured latency explicitly null", () => {
    expect(emptyLatencyMetrics()).toEqual({
      single_patient_p50_ms: null,
      single_patient_p95_ms: null,
      panel_p50_ms: null,
      panel_p95_ms: null,
      live_or_cached: "unknown",
    });
  });

  it("accepts finite non-negative latency values", () => {
    expect(() =>
      validateLatencyMetrics({
        single_patient_p50_ms: 10,
        single_patient_p95_ms: 20,
        panel_p50_ms: 30,
        panel_p95_ms: 40,
        live_or_cached: "cached",
      }),
    ).not.toThrow();
  });

  it("rejects non-finite or negative latency values", () => {
    expect(() =>
      validateLatencyMetrics({
        ...emptyLatencyMetrics(),
        panel_p95_ms: Number.NaN,
      }),
    ).toThrow("latency.panel_p95_ms");
    expect(() =>
      validateLatencyMetrics({
        ...emptyLatencyMetrics(),
        panel_p95_ms: -1,
      }),
    ).toThrow("latency.panel_p95_ms");
  });
});

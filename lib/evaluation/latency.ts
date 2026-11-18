import type { LatencyMetrics } from "./types";

const MS_FIELDS = [
  "single_patient_p50_ms",
  "single_patient_p95_ms",
  "panel_p50_ms",
  "panel_p95_ms",
] as const satisfies ReadonlyArray<keyof LatencyMetrics>;

export function validateLatencyMetrics(latency: LatencyMetrics): void {
  for (const key of MS_FIELDS) {
    const value = latency[key];
    if (value === null) continue;
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid latency.${key}: ${String(value)}`);
    }
  }
  if (
    latency.single_patient_p50_ms !== null &&
    latency.single_patient_p95_ms !== null &&
    latency.single_patient_p95_ms < latency.single_patient_p50_ms
  ) {
    throw new Error("latency.single_patient_p95_ms must be at least p50");
  }
  if (
    latency.panel_p50_ms !== null &&
    latency.panel_p95_ms !== null &&
    latency.panel_p95_ms < latency.panel_p50_ms
  ) {
    throw new Error("latency.panel_p95_ms must be at least p50");
  }
  if (latency.live_or_cached !== "live" && latency.live_or_cached !== "cached" && latency.live_or_cached !== "unknown") {
    throw new Error(`Invalid latency.live_or_cached: ${String(latency.live_or_cached)}`);
  }
}

export function emptyLatencyMetrics(): LatencyMetrics {
  return {
    single_patient_p50_ms: null,
    single_patient_p95_ms: null,
    panel_p50_ms: null,
    panel_p95_ms: null,
    live_or_cached: "unknown",
  };
}
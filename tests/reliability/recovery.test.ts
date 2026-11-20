import { describe, expect, it } from "vitest";
import {
  FALLBACK_PATHS,
  RECOVERY_DRILLS,
  drillResult,
  measureRecoverySeconds,
} from "@/lib/reliability/recovery";

describe("operational recovery drills", () => {
  it("measures recovery seconds precisely", () => {
    expect(measureRecoverySeconds(1_000, 13_500)).toBe(12.5);
    expect(measureRecoverySeconds(1_000, 1_000)).toBe(0);
  });

  it("rejects invalid recovery timing", () => {
    expect(() => measureRecoverySeconds(Number.NaN, 1)).toThrow(/finite/);
    expect(() => measureRecoverySeconds(2_000, 1_000)).toThrow(/precede/);
  });

  it("defines three fallback paths with no live-debug path", () => {
    expect(FALLBACK_PATHS.map((path) => path.id)).toEqual([
      "local_cached_app",
      "recorded_video",
      "canonical_evaluation_screenshot",
    ]);
    expect(FALLBACK_PATHS.every((path) => !/debug/i.test(path.action) || path.action.includes("never debug"))).toBe(true);
  });

  it("marks each drill A-E pass/fail against its own target", () => {
    const results = RECOVERY_DRILLS.map((drill) =>
      drillResult({
        id: drill.id,
        fallback: drill.id === "D" ? "canonical_evaluation_screenshot" : drill.id === "E" ? "recorded_video" : "local_cached_app",
        measuredSeconds: drill.target_seconds,
        notes: "rehearsal",
      }),
    );
    expect(results.map((result) => result.id)).toEqual(["A", "B", "C", "D", "E"]);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results.every((result) => result.measured_seconds <= result.target_seconds)).toBe(true);
  });

  it("fails a drill that exceeds its target", () => {
    expect(
      drillResult({ id: "C", fallback: "local_cached_app", measuredSeconds: 10.01, notes: "slow" }).passed,
    ).toBe(false);
  });

  it("rejects an unknown drill id", () => {
    expect(() =>
      drillResult({ id: "Z" as never, fallback: "local_cached_app", measuredSeconds: 1, notes: "" }),
    ).toThrow(/Unknown recovery drill/);
  });
});

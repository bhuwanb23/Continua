import { describe, expect, it } from "vitest";
import { assertScoreBandMatch, bandForScore, gapBandForScore } from "@/lib/priority";

describe("workflow priority bands", () => {
  it("maps frozen score thresholds", () => {
    expect(bandForScore(0)).toBe("NONE");
    expect(bandForScore(1)).toBe("P4");
    expect(bandForScore(34)).toBe("P4");
    expect(bandForScore(35)).toBe("P3");
    expect(bandForScore(59)).toBe("P3");
    expect(bandForScore(60)).toBe("P2");
    expect(bandForScore(79)).toBe("P2");
    expect(bandForScore(80)).toBe("P1");
    expect(bandForScore(100)).toBe("P1");
  });

  it("never gives a scored gap NONE", () => {
    expect(gapBandForScore(1)).toBe("P4");
    expect(() => gapBandForScore(0)).toThrow();
  });

  it("detects score/band mismatches", () => {
    expect(() => assertScoreBandMatch(69, "P2")).not.toThrow();
    expect(() => assertScoreBandMatch(69, "P1")).toThrow(/mismatch/);
  });

  it("rejects invalid display scores", () => {
    expect(() => bandForScore(101)).toThrow();
    expect(() => bandForScore(-1)).toThrow();
    expect(() => bandForScore(69.5)).toThrow();
  });
});

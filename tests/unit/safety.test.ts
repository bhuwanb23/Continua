import { describe, expect, it } from "vitest";
import { scanText } from "@/lib/safety";

describe("T10 forbidden terminology", () => {
  it("catches risk_level", () => {
    const findings = scanText('const x = "risk_level";');
    expect(findings.map((f) => f.label)).toContain("risk_level");
  });

  it("catches the phrase clinical risk score", () => {
    const findings = scanText("This is a clinical risk score.");
    expect(findings.map((f) => f.label)).toContain("clinical risk score");
  });

  it("passes clean product copy", () => {
    expect(scanText("Rank intervention priority for coordinator review.")).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculateRedirectedTime, IMPACT_FORMULA } from "@/lib/impact/model";
import { validateImpactInputs } from "@/lib/impact/validate";
import { DEFAULT_ASSUMPTIONS, ASSUMPTION_VALUES } from "@/lib/impact/assumptions";
import { describeImpact } from "@/lib/impact/format";
import { CLAIMS } from "@/lib/claims/registry";

const BASELINE = {
  patients: 20,
  baselineMinutesPerPatient: 8,
  assistedMinutesPerPatient: 6,
  workingDaysPerMonth: 20,
};

describe("impact experience (IMP)", () => {
  it("IMP-01: modeled output exposes its formula", () => {
    const result = calculateRedirectedTime(BASELINE);
    expect(result.formula).toBe(IMPACT_FORMULA);
    const claim = CLAIMS.find((c) => c.claim_id === "modeled-redirected-time");
    expect(claim?.formula).toBe(IMPACT_FORMULA);
  });

  it("IMP-02: every assumption is visible and classified", () => {
    expect(DEFAULT_ASSUMPTIONS.length).toBeGreaterThan(0);
    for (const assumption of DEFAULT_ASSUMPTIONS) {
      expect(assumption.classification).toBe("SCENARIO_ASSUMPTION");
      expect(assumption.rationale.length).toBeGreaterThan(0);
    }
  });

  it("IMP-03: changing an assumption updates the model", () => {
    const base = calculateRedirectedTime(BASELINE);
    const faster = calculateRedirectedTime({ ...BASELINE, assistedMinutesPerPatient: 5 });
    expect(faster.perMonthHours).toBeGreaterThan(base.perMonthHours);
  });

  it("IMP-04: system latency is not an input to the impact model", () => {
    expect(IMPACT_FORMULA).not.toMatch(/latency|ms/i);
    const result = calculateRedirectedTime(BASELINE);
    expect(Object.keys(result)).not.toContain("latency");
    expect(Object.keys(BASELINE)).toEqual([
      "patients",
      "baselineMinutesPerPatient",
      "assistedMinutesPerPatient",
      "workingDaysPerMonth",
    ]);
  });

  it("IMP-05: no patient-outcome terms appear in the model", () => {
    const source = readFileSync(join(process.cwd(), "lib/impact/model.ts"), "utf8").toLowerCase();
    for (const banned of ["mortality", "readmission", "outcome", "lives"]) {
      expect(source).not.toContain(banned);
    }
  });

  it("IMP-06: no financial output exists without a cost assumption", () => {
    const result = calculateRedirectedTime(BASELINE) as unknown as Record<string, unknown>;
    expect(result).not.toHaveProperty("dollars");
    expect(result).not.toHaveProperty("savings_usd");
  });

  it("IMP-07: external figures would need source metadata (none retained)", () => {
    const external = CLAIMS.filter((c) => c.classification === "EXTERNAL_RESEARCH");
    for (const claim of external) expect(claim.external_source).toBeDefined();
  });

  it("IMP-08: modeled copy is labeled modeled, not saved", () => {
    const copy = describeImpact(calculateRedirectedTime(ASSUMPTION_VALUES));
    expect(copy).toContain("Modeled potential time redirected");
    expect(copy.toLowerCase()).not.toContain("saved");
  });

  it("rejects assisted review time above baseline", () => {
    const issues = validateImpactInputs({ ...BASELINE, assistedMinutesPerPatient: 20 });
    expect(issues).toHaveLength(1);
  });

  it("never emits NaN or Infinity for valid defaults", () => {
    const result = calculateRedirectedTime(ASSUMPTION_VALUES);
    for (const value of Object.values(result)) {
      if (typeof value === "number") expect(Number.isFinite(value)).toBe(true);
    }
  });
});

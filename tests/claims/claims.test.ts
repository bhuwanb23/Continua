import { describe, expect, it } from "vitest";
import { readCache } from "../api/support";
import { CLAIMS, BENCHMARK_RUN_ID } from "@/lib/claims/registry";
import { validateClaims } from "@/lib/claims/validate";
import { exportClaims } from "@/lib/claims/export";
import { calculateRedirectedTime } from "@/lib/impact/model";
import { ASSUMPTION_VALUES } from "@/lib/impact/assumptions";
import { validateImpactInputs } from "@/lib/impact/validate";

const evaluation = readCache<Record<string, unknown>>("evaluation.json");

describe("claim registry", () => {
  it("has unique claim ids", () => {
    const ids = CLAIMS.map((c) => c.claim_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("validates measured claims against the frozen evaluation artifact", () => {
    const result = validateClaims(CLAIMS, evaluation);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("exports approved claims with consistent counts", () => {
    const exported = exportClaims();
    const parsed = JSON.parse(exported.submission_metrics_json);
    expect(parsed.unclassified_claims).toBe(0);
    expect(parsed.measured).toBeGreaterThan(0);
    expect(exported.approved_claims_md).toContain("benchmark-macro-f1");
  });

  it("measured claims carry the benchmark run id", () => {
    for (const claim of CLAIMS.filter((c) => c.classification === "MEASURED")) {
      expect(claim.benchmark_run_id).toBe(BENCHMARK_RUN_ID);
    }
  });
});

describe("impact model", () => {
  it("computes redirected time deterministically", () => {
    const result = calculateRedirectedTime({
      patients: 20,
      baselineMinutesPerPatient: 8,
      assistedMinutesPerPatient: 6,
      workingDaysPerMonth: 20,
    });
    expect(result.perDayMinutes).toBe(40);
    expect(result.perMonthHours).toBeCloseTo(13.33, 2);
    expect(result.formula).toContain("patients");
  });

  it("default assumptions produce a conservative modeled figure", () => {
    const result = calculateRedirectedTime({ ...ASSUMPTION_VALUES });
    expect(result.perPatientMinutesSaved).toBe(2);
    expect(result.perMonthHours).toBeLessThan(20);
  });

  it("rejects out-of-bounds inputs", () => {
    const issues = validateImpactInputs({
      patients: 0,
      baselineMinutesPerPatient: 12,
      assistedMinutesPerPatient: 6,
      workingDaysPerMonth: 20,
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("rejects assisted time exceeding baseline", () => {
    const issues = validateImpactInputs({
      patients: 80,
      baselineMinutesPerPatient: 6,
      assistedMinutesPerPatient: 12,
      workingDaysPerMonth: 20,
    });
    expect(issues.length).toBeGreaterThan(0);
  });
});

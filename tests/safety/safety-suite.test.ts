import { describe, expect, it } from "vitest";
import { runSafetyCorpus } from "../../scripts/lib/safety-corpus";

describe("safety threat corpus", () => {
  it("covers at least 40 cases across 20 families and passes every case", async () => {
    const report = await runSafetyCorpus();
    expect(report.total).toBeGreaterThanOrEqual(40);
    expect(report.families).toBeGreaterThanOrEqual(20);
    expect(new Set(report.results.map((result) => result.case_id)).size).toBe(report.total);
    const failures = report.results.filter((result) => !result.passed);
    expect(failures.map((failure) => `${failure.case_id}: ${failure.detail}`)).toEqual([]);
    expect(report.failed).toBe(0);
  }, 120_000);
});

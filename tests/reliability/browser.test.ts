import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface PlaywrightJson {
  stats: { expected: number; skipped: number; unexpected: number; flaky: number; duration: number };
  errors: unknown[];
}

const path = join(process.cwd(), "artifacts", "reliability", "playwright-results.json");

describe("browser matrix result", () => {
  it("records a passing Chromium run with no skipped or flaky specs", () => {
    const report = JSON.parse(readFileSync(path, "utf8")) as PlaywrightJson;
    expect(report.stats.expected).toBeGreaterThanOrEqual(9);
    expect(report.stats.unexpected).toBe(0);
    expect(report.stats.skipped).toBe(0);
    expect(report.stats.flaky).toBe(0);
    expect(report.errors).toEqual([]);
  });
});

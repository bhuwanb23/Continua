import { describe, expect, it } from "vitest";
import { createBenchmarkConfig } from "@/lib/benchmark/runner";
import { runPreflight } from "@/lib/benchmark/preflight";

describe("benchmark preflight", () => {
  it("passes for the frozen dev configuration", () => {
    const config = createBenchmarkConfig({ mode: "dev", runId: "preflight-test" });
    const preflight = runPreflight(config);
    expect(preflight.ok).toBe(true);
    expect(preflight.checks.some((check) => check.name === "no_label_leakage" && check.passed)).toBe(true);
  });
});

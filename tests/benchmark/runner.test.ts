import { describe, expect, it } from "vitest";
import { createBenchmarkConfig } from "@/lib/benchmark/runner";
import { sanitizeRunId } from "@/lib/benchmark/config";

describe("benchmark runner config", () => {
  it("selects the dev partition for dev mode", () => {
    const config = createBenchmarkConfig({ mode: "dev", runId: "runner-test" });
    expect(config.partition).toBe("dev");
    expect(config.mode).toBe("dev");
  });

  it("sanitizes run ids consistently", () => {
    expect(sanitizeRunId("benchmark 2026 dev")).toBe("benchmark-2026-dev");
  });
});

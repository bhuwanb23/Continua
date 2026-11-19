import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("benchmark artifact integrity", () => {
  it("has a complete hashed dev run", () => {
    const dir = join(process.cwd(), "artifacts", "benchmark", "benchmark-dev-smoke");
    expect(existsSync(join(dir, "artifact-hashes.json"))).toBe(true);
    const report = JSON.parse(readFileSync(join(dir, "final-report.json"), "utf8")) as { status: string; gates: unknown[] };
    expect(report.status).toBe("COMPLETED");
    expect(report.gates).toHaveLength(10);
  });
});

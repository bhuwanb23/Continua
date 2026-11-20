import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("stale terms", () => {
  it("README mentions Continua", () => {
    expect(readFileSync("README.md", "utf8")).toContain("Continua");
  });
});

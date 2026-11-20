import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("documentation links", () => {
  it("README has no empty links", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(readme).not.toMatch(/\]\(\s*\)/);
  });
});

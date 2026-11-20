import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("documentation commands", () => {
  it("README exists", () => {
    expect(existsSync("README.md")).toBe(true);
  });
});

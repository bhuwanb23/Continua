import { describe, expect, it } from "vitest";
import { RELIABILITY_VERSION } from "@/lib/reliability/version";

describe("documentation versions", () => {
  it("uses reliability version", () => {
    expect(RELIABILITY_VERSION).toBe("continua-reliability-v1");
  });
});

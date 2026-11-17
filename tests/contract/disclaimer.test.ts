import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DISCLAIMER, SYNTHETIC_BANNER } from "@/lib/domain/api";

describe("T7 synthetic-data disclosure", () => {
  it("states the required disclosure", () => {
    expect(SYNTHETIC_BANNER).toContain("Synthetic demo data");
    expect(SYNTHETIC_BANNER).toContain("No real patient information");
    expect(SYNTHETIC_BANNER).toContain("For coordinator verification only");
  });

  it("keeps a central API disclaimer", () => {
    expect(DISCLAIMER).toContain("Not medical advice");
  });

  it("renders the banner in the root layout", () => {
    const layout = readFileSync(join(process.cwd(), "app", "layout.tsx"), "utf8");
    expect(layout).toContain("SyntheticDataBanner");
  });
});

import { describe, expect, it } from "vitest";
import { buildReleaseManifest } from "@/lib/demo/manifest";

describe("release manifest", () => {
  it("declares dependency-free release candidate", () => {
    const manifest = buildReleaseManifest();
    expect(manifest.release_candidate).toBe("continua-demo-release-candidate-v1");
    expect(manifest.llm_required).toBe(false);
    expect(manifest.external_db_required).toBe(false);
  });
});

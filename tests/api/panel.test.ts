import { describe, expect, it } from "vitest";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { DISCLAIMER } from "@/lib/domain/api";
import { asHandler, expectMeta, invokeGet, readCache } from "./support";

const panel = asHandler(panelRoute);

interface PanelBody {
  panel: {
    panel_id: string;
    name: string;
    patient_count: number;
    patients_with_verified_gaps: number;
    verified_gap_counts: Record<string, number>;
  };
  meta: Record<string, unknown>;
  disclaimer: string;
}

describe("GET /api/v1/panels/{panelId}", () => {
  it("returns cache-derived panel aggregates with contract metadata", async () => {
    const result = await invokeGet<PanelBody>(panel, "/api/v1/panels/demo", { panelId: "demo" });
    expect(result.status).toBe(200);
    expect(result.body.disclaimer).toBe(DISCLAIMER);
    expectMeta(result.body.meta, result.headers.get("X-Request-Id") ?? "");
    expect(result.headers.get("Cache-Control")).toBe("no-store");
    expect(result.headers.get("X-API-Version")).toBe("v1");

    const cached = readCache<{
      panel_id: string;
      name: string;
      patient_count: number;
      flagged_patient_count: number;
      verified_gap_counts: Record<string, number>;
    }>("panel.json");
    expect(result.body.panel.panel_id).toBe(cached.panel_id);
    expect(result.body.panel.name).toBe(cached.name);
    expect(result.body.panel.patient_count).toBe(cached.patient_count);
    expect(result.body.panel.patients_with_verified_gaps).toBe(cached.flagged_patient_count);
    expect(result.body.panel.verified_gap_counts).toEqual(cached.verified_gap_counts);
  });

  it("returns 404 panel_not_found for an unknown panel", async () => {
    const result = await invokeGet<{ error: { code: string; request_id: string } }>(
      panel,
      "/api/v1/panels/unknown",
      { panelId: "unknown" },
    );
    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe("panel_not_found");
    expect(result.body.error.request_id).toBe(result.headers.get("X-Request-Id"));
  });

  it("rejects unsafe panel ids", async () => {
    const result = await invokeGet(panel, "/api/v1/panels/..", { panelId: "../ground_truth" });
    expect(result.status).toBe(400);
  });
});

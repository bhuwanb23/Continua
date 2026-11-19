import { describe, expect, it } from "vitest";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { asHandler, invokeGet, readCache } from "./support";

const queue = asHandler(queueRoute);
const patient = asHandler(patientRoute);
const gaps = asHandler(gapsRoute);

interface QueueBody {
  panel_id: string;
  k: number;
  items: Array<{
    rank: number;
    patient_id: string;
    patient_priority_score: number;
    priority_band: string;
    priority_label: string;
    verified_gap_count: number;
    top_gap_id: string;
    top_gap_type: string;
    top_gap_priority_score: number;
    headline: string;
    recommended_coordinator_action: string;
  }>;
}

const priorities = readCache<{
  patient_priorities: Array<{ patient_id: string; rank: number | null; patient_priority_score: number }>;
}>("priorities.json");

describe("GET /api/v1/panels/{panelId}/queue", () => {
  it("returns the frozen top-5 by default", async () => {
    const result = await invokeGet<QueueBody>(queue, "/api/v1/panels/demo/queue", { panelId: "demo" });
    expect(result.status).toBe(200);
    expect(result.body.k).toBe(5);
    expect(result.body.items).toHaveLength(5);
    expect(result.body.items.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("preserves stored rank order and never re-ranks", async () => {
    const result = await invokeGet<QueueBody>(queue, "/api/v1/panels/demo/queue?k=5", { panelId: "demo" });
    const expected = [...priorities.patient_priorities]
      .filter((entry) => entry.rank !== null)
      .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0))
      .slice(0, 5)
      .map((entry) => entry.patient_id);
    expect(result.body.items.map((item) => item.patient_id)).toEqual(expected);
  });

  it("clamps k to the served queue size", async () => {
    const oversized = await invokeGet<QueueBody>(queue, "/api/v1/panels/demo/queue?k=999", { panelId: "demo" });
    expect(oversized.status).toBe(200);
    expect(oversized.body.items.length).toBeLessThanOrEqual(oversized.body.k);

    const zero = await invokeGet<QueueBody>(queue, "/api/v1/panels/demo/queue?k=0", { panelId: "demo" });
    expect(zero.body.k).toBe(1);
    expect(zero.body.items).toHaveLength(1);

    const negative = await invokeGet<QueueBody>(queue, "/api/v1/panels/demo/queue?k=-10", { panelId: "demo" });
    expect(negative.body.k).toBe(1);
  });

  it("agrees with the patient detail score and gap ids (CT-04, CT-06)", async () => {
    const result = await invokeGet<QueueBody>(queue, "/api/v1/panels/demo/queue?k=5", { panelId: "demo" });
    for (const item of result.body.items) {
      const detail = await invokeGet<{ patient: { patient_priority_score: number; priority_band: string; priority_rank: number } }>(
        patient,
        `/api/v1/patients/${item.patient_id}`,
        { patientId: item.patient_id },
      );
      expect(detail.body.patient.patient_priority_score).toBe(item.patient_priority_score);
      expect(detail.body.patient.priority_band).toBe(item.priority_band);
      expect(detail.body.patient.priority_rank).toBe(item.rank);

      const gapsBody = await invokeGet<{ gaps: Array<{ gap_id: string; gap_priority_score: number }> }>(
        gaps,
        `/api/v1/patients/${item.patient_id}/gaps`,
        { patientId: item.patient_id },
      );
      const topGap = gapsBody.body.gaps.find((gap) => gap.gap_id === item.top_gap_id);
      expect(topGap).toBeDefined();
      expect(topGap?.gap_priority_score).toBe(item.top_gap_priority_score);
    }
  });

  it("returns 404 for an unknown panel and 400 for a malformed k", async () => {
    const missing = await invokeGet(queue, "/api/v1/panels/other/queue", { panelId: "other" });
    expect(missing.status).toBe(404);
    const invalid = await invokeGet(queue, "/api/v1/panels/demo/queue?k=abc", { panelId: "demo" });
    expect(invalid.status).toBe(400);
  });
});

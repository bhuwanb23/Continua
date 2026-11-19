import { describe, expect, it } from "vitest";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { GET as metricsRoute } from "@/app/api/v1/metrics/route";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as patientsRoute } from "@/app/api/v1/panels/[panelId]/patients/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as timelineRoute } from "@/app/api/v1/patients/[patientId]/timeline/route";
import { asHandler, invokeGet, readCache } from "./support";

const panel = asHandler(panelRoute);
const patients = asHandler(patientsRoute);
const queue = asHandler(queueRoute);
const patient = asHandler(patientRoute);
const timeline = asHandler(timelineRoute);
const gaps = asHandler(gapsRoute);
const evidence = asHandler(evidenceRoute);
const metrics = asHandler(metricsRoute);
const evaluation = asHandler(evaluationRoute);

const mariaArtifact = readCache<{
  patient_id: string;
  queue_rank: number | null;
  flagship_gap_id: string | null;
  demo_path: { timeline_event_ids: string[]; gap_ids: string[] };
}>("maria.json");

const priorities = readCache<{ patient_priorities: Array<{ patient_id: string; rank: number | null }> }>(
  "priorities.json",
);
const mariaPriority = priorities.patient_priorities.find((entry) => entry.patient_id === mariaArtifact.patient_id);

describe("Maria full API path regression", () => {
  it("finds Maria through the panel patient list", async () => {
    const result = await invokeGet<{ patients: Array<{ patient_id: string; display_name: string }>; total: number }>(
      patients,
      "/api/v1/panels/demo/patients?query=maria",
      { panelId: "demo" },
    );
    expect(result.status).toBe(200);
    expect(result.body.total).toBeGreaterThan(0);
    const maria = result.body.patients.find((entry) => entry.patient_id === mariaArtifact.patient_id);
    expect(maria?.display_name.toLowerCase()).toContain("maria");
  });

  it("reports Maria's real rank, never a forced #1", async () => {
    const result = await invokeGet<{
      items: Array<{ rank: number; patient_id: string; patient_priority_score: number }>;
    }>(queue, "/api/v1/panels/demo/queue?k=80", { panelId: "demo" });
    const entry = result.body.items.find((item) => item.patient_id === mariaArtifact.patient_id);
    expect(mariaPriority).toBeDefined();
    expect(mariaArtifact.queue_rank).toBe(mariaPriority?.rank);
    if (entry) {
      expect(entry.rank).toBe(mariaArtifact.queue_rank);
      expect(entry.patient_priority_score).toBeGreaterThan(0);
    } else {
      expect(mariaArtifact.queue_rank === null || mariaArtifact.queue_rank > result.body.items.length).toBe(true);
    }
  });

  it("keeps patient, timeline, gaps, and flagship evidence coherent", async () => {
    const patientBody = await invokeGet<{ patient: { patient_id: string; verified_gap_count: number } }>(
      patient,
      `/api/v1/patients/${mariaArtifact.patient_id}`,
      { patientId: mariaArtifact.patient_id },
    );
    expect(patientBody.status).toBe(200);

    const timelineBody = await invokeGet<{ events: Array<{ event_id: string }> }>(
      timeline,
      `/api/v1/patients/${mariaArtifact.patient_id}/timeline`,
      { patientId: mariaArtifact.patient_id },
    );
    expect(timelineBody.body.events.length).toBeGreaterThan(0);
    const eventIds = new Set(timelineBody.body.events.map((event) => event.event_id));
    for (const eventId of mariaArtifact.demo_path.timeline_event_ids) expect(eventIds.has(eventId)).toBe(true);

    const gapsBody = await invokeGet<{ gaps: Array<{ gap_id: string; evidence_count: number }> }>(
      gaps,
      `/api/v1/patients/${mariaArtifact.patient_id}/gaps`,
      { patientId: mariaArtifact.patient_id },
    );
    expect(gapsBody.body.gaps).toHaveLength(patientBody.body.patient.verified_gap_count);
    const gapIds = new Set(gapsBody.body.gaps.map((gap) => gap.gap_id));
    for (const gapId of mariaArtifact.demo_path.gap_ids) expect(gapIds.has(gapId)).toBe(true);

    if (mariaArtifact.flagship_gap_id) {
      const evidenceBody = await invokeGet<{ gap_id: string; sources: unknown[]; claims: unknown[] }>(
        evidence,
        `/api/v1/evidence/${mariaArtifact.flagship_gap_id}`,
        { gapId: mariaArtifact.flagship_gap_id },
      );
      expect(evidenceBody.status).toBe(200);
      expect(evidenceBody.body.gap_id).toBe(mariaArtifact.flagship_gap_id);
      expect(evidenceBody.body.sources.length).toBeGreaterThan(0);
      expect(evidenceBody.body.claims.length).toBeGreaterThan(0);
    }
  });

  it("serves metrics and evaluation consistently with the same snapshot", async () => {
    const panelBody = await invokeGet<{ panel: { panel_id: string } }>(panel, "/api/v1/panels/demo", {
      panelId: "demo",
    });
    const metricsBody = await invokeGet<{ panel_id: string }>(metrics, "/api/v1/metrics?panelId=demo");
    const evaluationBody = await invokeGet<{ evaluation: { status: string } }>(evaluation, "/api/v1/evaluation");

    expect(metricsBody.body.panel_id).toBe(panelBody.body.panel.panel_id);
    expect(evaluationBody.body.evaluation.status).toBe("COMPLETED");
    expect(evaluationBody.text).not.toContain("gold_event_id");
  });
});

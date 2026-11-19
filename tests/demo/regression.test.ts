import { describe, expect, it } from "vitest";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as timelineRoute } from "@/app/api/v1/patients/[patientId]/timeline/route";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";
import {
  BACKUP_GAP_ID,
  BACKUP_PATIENT_ID,
  CACHE_MARIA_GAP_ID,
  FLAGSHIP_GAP_ID,
  FLAGSHIP_PATIENT_ID,
  SCENES,
} from "@/lib/demo/flagship";
import { clampScene, focusTargetForScene, sceneFor } from "@/lib/demo/steps";
import { asHandler, invokeGet, readCache } from "../api/support";

const panel = asHandler(panelRoute);
const queue = asHandler(queueRoute);
const patient = asHandler(patientRoute);
const timeline = asHandler(timelineRoute);
const gaps = asHandler(gapsRoute);
const evidence = asHandler(evidenceRoute);
const evaluation = asHandler(evaluationRoute);

const maria = readCache<{ patient_id: string; queue_rank: number | null; flagship_gap_id: string | null }>(
  "maria.json",
);

interface GapBody {
  gaps: Array<{ gap_id: string; title: string; gap_type: string; evidence_status: string }>;
}
interface EvidenceBody {
  gap_id: string;
  verification_status: string | null;
  sources: Array<{ quoted_span: string }>;
  absence_checks: Array<{ matching_event_count: number; window_start: string | null }>;
  policy_checks: Array<{ policy: string; status: string }>;
}

describe("demo navigation truth", () => {
  it("defines six scenes and clamps navigation", () => {
    expect(SCENES).toHaveLength(6);
    expect(clampScene(-4)).toBe(1);
    expect(clampScene(99)).toBe(6);
    expect(sceneFor(4).title).toBe("The gap");
  });

  it("focuses only scenes that highlight real product content", () => {
    expect(focusTargetForScene(4)).toBe("flagship-gap");
    expect(focusTargetForScene(5)).toBe("evidence");
    expect(focusTargetForScene(1)).toBeNull();
  });

  it("separates the demo flagship gap from the frozen cache pointer", () => {
    expect(FLAGSHIP_GAP_ID).not.toBe(CACHE_MARIA_GAP_ID);
    expect(maria.flagship_gap_id).toBe(CACHE_MARIA_GAP_ID);
    expect(maria.patient_id).toBe(FLAGSHIP_PATIENT_ID);
  });
});

describe("demo flagship path over frozen API", () => {
  it("step 1: panel loads with synthetic patients", async () => {
    const result = await invokeGet<{ panel: { patient_count: number; patients_with_verified_gaps: number } }>(
      panel,
      "/api/v1/panels/demo",
      { panelId: "demo" },
    );
    expect(result.status).toBe(200);
    expect(result.body.panel.patient_count).toBeGreaterThan(0);
    expect(result.body.panel.patients_with_verified_gaps).toBeLessThanOrEqual(
      result.body.panel.patient_count,
    );
  });

  it("step 2: top-5 queue exists and is ordered", async () => {
    const result = await invokeGet<{ items: Array<{ rank: number }> }>(
      queue,
      "/api/v1/panels/demo/queue?k=5",
      { panelId: "demo" },
    );
    expect(result.status).toBe(200);
    expect(result.body.items).toHaveLength(5);
    expect(result.body.items.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("step 3: Maria and her timeline resolve", async () => {
    const patientResult = await invokeGet<{ patient: { patient_id: string; priority_rank: number | null } }>(
      patient,
      `/api/v1/patients/${FLAGSHIP_PATIENT_ID}`,
      { patientId: FLAGSHIP_PATIENT_ID },
    );
    expect(patientResult.status).toBe(200);
    expect(patientResult.body.patient.patient_id).toBe(FLAGSHIP_PATIENT_ID);

    const timelineResult = await invokeGet<{ events: unknown[] }>(
      timeline,
      `/api/v1/patients/${FLAGSHIP_PATIENT_ID}/timeline`,
      { patientId: FLAGSHIP_PATIENT_ID },
    );
    expect(timelineResult.status).toBe(200);
    expect(timelineResult.body.events.length).toBeGreaterThan(0);
  });

  it("step 3: Maria keeps her real rank instead of a forced #1", async () => {
    const result = await invokeGet<{ patient: { priority_rank: number | null } }>(
      patient,
      `/api/v1/patients/${FLAGSHIP_PATIENT_ID}`,
      { patientId: FLAGSHIP_PATIENT_ID },
    );
    expect(result.body.patient.priority_rank).toBe(maria.queue_rank);
    expect(result.body.patient.priority_rank).not.toBe(1);
  });

  it("step 2: the frozen queue cannot be re-ranked by a larger k", async () => {
    const result = await invokeGet<{ items: Array<{ rank: number }> }>(
      queue,
      "/api/v1/panels/demo/queue?k=80",
      { panelId: "demo" },
    );
    expect(result.body.items.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("step 4: the flagship gap exists, is verified, and carries the coordinator action", async () => {
    const result = await invokeGet<GapBody>(gaps, `/api/v1/patients/${FLAGSHIP_PATIENT_ID}/gaps`, {
      patientId: FLAGSHIP_PATIENT_ID,
    });
    expect(result.status).toBe(200);
    const flagship = result.body.gaps.find((gap) => gap.gap_id === FLAGSHIP_GAP_ID);
    expect(flagship).toBeDefined();
    expect(flagship?.gap_type).toBe("missed_followup");
    expect(flagship?.evidence_status).toBe("verified");
  });

  it("step 5: evidence opens with exact source, absence check, and policy", async () => {
    const result = await invokeGet<EvidenceBody>(evidence, `/api/v1/evidence/${FLAGSHIP_GAP_ID}`, {
      gapId: FLAGSHIP_GAP_ID,
    });
    expect(result.status).toBe(200);
    expect(result.body.gap_id).toBe(FLAGSHIP_GAP_ID);
    expect(result.body.verification_status).toBe("verified");
    expect(result.body.sources.length).toBeGreaterThan(0);
    expect(result.body.absence_checks.length).toBeGreaterThan(0);
    expect(result.body.absence_checks[0]?.matching_event_count).toBe(0);
    expect(result.body.policy_checks.some((check) => check.policy === "referral-window")).toBe(true);
  });

  it("step 6: evaluation values exist with a run id", async () => {
    const result = await invokeGet<{ evaluation: { status: string; benchmark_run_id: string } }>(
      evaluation,
      "/api/v1/evaluation",
    );
    expect(result.status).toBe(200);
    expect(["COMPLETED", "not_run"]).toContain(result.body.evaluation.status);
    expect(result.body.evaluation.benchmark_run_id.length).toBeGreaterThan(0);
  });
});

describe("demo fallback path", () => {
  it("keeps a verified backup patient and gap", async () => {
    const gapsResult = await invokeGet<GapBody>(
      gaps,
      `/api/v1/patients/${BACKUP_PATIENT_ID}/gaps`,
      { patientId: BACKUP_PATIENT_ID },
    );
    expect(gapsResult.status).toBe(200);
    const backup = gapsResult.body.gaps.find((gap) => gap.gap_id === BACKUP_GAP_ID);
    expect(backup?.gap_type).toBe("missed_followup");

    const evidenceResult = await invokeGet<EvidenceBody>(
      evidence,
      `/api/v1/evidence/${BACKUP_GAP_ID}`,
      { gapId: BACKUP_GAP_ID },
    );
    expect(evidenceResult.status).toBe(200);
    expect(evidenceResult.body.sources.length).toBeGreaterThan(0);
  });
});

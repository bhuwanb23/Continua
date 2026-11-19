import { describe, expect, it } from "vitest";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as patientsRoute } from "@/app/api/v1/panels/[panelId]/patients/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { GET as metricsRoute } from "@/app/api/v1/metrics/route";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";
import { loadBenchmarkReport } from "@/lib/cache/benchmark-report";
import { DISCLAIMER } from "@/lib/domain/api";
import { asHandler, invokeGet, readCache } from "./support";

const panel = asHandler(panelRoute);
const patients = asHandler(patientsRoute);
const queue = asHandler(queueRoute);
const patient = asHandler(patientRoute);
const gaps = asHandler(gapsRoute);
const evidence = asHandler(evidenceRoute);
const metrics = asHandler(metricsRoute);
const evaluation = asHandler(evaluationRoute);

const verifiedGaps = readCache<{ verified_gaps: Array<{ gap_id: string; patient_id: string; gap_type: string }> }>(
  "verified-gaps.json",
).verified_gaps;

describe("Cross-endpoint consistency", () => {
  it("CT-01: panel patient_count equals the patient list total", async () => {
    const panelBody = await invokeGet<{ panel: { patient_count: number } }>(panel, "/api/v1/panels/demo", {
      panelId: "demo",
    });
    const listBody = await invokeGet<{ total: number }>(patients, "/api/v1/panels/demo/patients?limit=1", {
      panelId: "demo",
    });
    expect(listBody.body.total).toBe(panelBody.body.panel.patient_count);
  });

  it("CT-02: panel gap counts equal the verified-gap repository counts", async () => {
    const panelBody = await invokeGet<{ panel: { verified_gap_counts: Record<string, number> } }>(
      panel,
      "/api/v1/panels/demo",
      { panelId: "demo" },
    );
    const counts: Record<string, number> = {};
    for (const gap of verifiedGaps) counts[gap.gap_type] = (counts[gap.gap_type] ?? 0) + 1;
    expect(panelBody.body.panel.verified_gap_counts).toEqual(counts);
  });

  it("CT-03: patient verified_gap_count equals the gaps endpoint length", async () => {
    const listBody = await invokeGet<{ patients: Array<{ patient_id: string; verified_gap_count: number }> }>(
      patients,
      "/api/v1/panels/demo/patients?limit=12",
      { panelId: "demo" },
    );
    for (const item of listBody.body.patients) {
      const gapsBody = await invokeGet<{ gaps: unknown[] }>(gaps, `/api/v1/patients/${item.patient_id}/gaps`, {
        patientId: item.patient_id,
      });
      expect(gapsBody.body.gaps).toHaveLength(item.verified_gap_count);

      const detail = await invokeGet<{ patient: { verified_gap_count: number } }>(
        patient,
        `/api/v1/patients/${item.patient_id}`,
        { patientId: item.patient_id },
      );
      expect(detail.body.patient.verified_gap_count).toBe(item.verified_gap_count);
    }
  });

  it("CT-04: queue priority scores equal patient-detail scores", async () => {
    const queueBody = await invokeGet<{ items: Array<{ patient_id: string; patient_priority_score: number }> }>(
      queue,
      "/api/v1/panels/demo/queue?k=5",
      { panelId: "demo" },
    );
    for (const item of queueBody.body.items) {
      const detail = await invokeGet<{ patient: { patient_priority_score: number } }>(
        patient,
        `/api/v1/patients/${item.patient_id}`,
        { patientId: item.patient_id },
      );
      expect(detail.body.patient.patient_priority_score).toBe(item.patient_priority_score);
    }
  });

  it("CT-05: every gap evidence status is verified and its evidence route exists", async () => {
    const queueBody = await invokeGet<{ items: Array<{ patient_id: string; top_gap_id: string }> }>(
      queue,
      "/api/v1/panels/demo/queue?k=5",
      { panelId: "demo" },
    );
    for (const item of queueBody.body.items) {
      const gapsBody = await invokeGet<{ gaps: Array<{ gap_id: string; evidence_status: string }> }>(
        gaps,
        `/api/v1/patients/${item.patient_id}/gaps`,
        { patientId: item.patient_id },
      );
      for (const gap of gapsBody.body.gaps) {
        expect(gap.evidence_status).toBe("verified");
        const evidenceBody = await invokeGet(evidence, `/api/v1/evidence/${gap.gap_id}`, { gapId: gap.gap_id });
        expect(evidenceBody.status).toBe(200);
        expect((evidenceBody.body as { gap_id: string }).gap_id).toBe(gap.gap_id);
      }
    }
  });

  it("CT-06: queue gap ids appear in the patient gaps endpoint", async () => {
    const queueBody = await invokeGet<{ items: Array<{ patient_id: string; top_gap_id: string }> }>(
      queue,
      "/api/v1/panels/demo/queue?k=5",
      { panelId: "demo" },
    );
    for (const item of queueBody.body.items) {
      const gapsBody = await invokeGet<{ gaps: Array<{ gap_id: string }> }>(
        gaps,
        `/api/v1/patients/${item.patient_id}/gaps`,
        { patientId: item.patient_id },
      );
      expect(gapsBody.body.gaps.some((gap) => gap.gap_id === item.top_gap_id)).toBe(true);
    }
  });

  it("CT-07: evaluation API values equal the Phase-9 final report", async () => {
    const report = loadBenchmarkReport() as {
      gaps: { extracted: { metrics: { macro_f1: number; micro_f1: number } } };
      priority: { top5_verified: number };
    };
    const body = await invokeGet<{
      evaluation: { gap_detection: { macro_f1: number; micro_f1: number }; priority: { top5_verified: number } };
    }>(evaluation, "/api/v1/evaluation");
    expect(body.body.evaluation.gap_detection.macro_f1).toBe(report.gaps.extracted.metrics.macro_f1);
    expect(body.body.evaluation.gap_detection.micro_f1).toBe(report.gaps.extracted.metrics.micro_f1);
    expect(body.body.evaluation.priority.top5_verified).toBe(report.priority.top5_verified);
  });

  it("CT-08: metric classification is preserved across the response", async () => {
    const body = await invokeGet<{
      measured: Array<{ classification: string }>;
      modeled: Array<{ classification: string }>;
      scenario_assumptions: Array<{ classification: string }>;
      external_research: Array<{ classification: string }>;
    }>(metrics, "/api/v1/metrics?panelId=demo");
    for (const metric of body.body.measured) expect(metric.classification).toBe("MEASURED");
    for (const metric of body.body.modeled) expect(metric.classification).toBe("MODELED");
    for (const metric of body.body.scenario_assumptions) expect(metric.classification).toBe("SCENARIO_ASSUMPTION");
    for (const metric of body.body.external_research) expect(metric.classification).toBe("EXTERNAL_RESEARCH");
  });

  it("carries the synthetic disclaimer on every clinical response", async () => {
    const calls = [
      invokeGet(panel, "/api/v1/panels/demo", { panelId: "demo" }),
      invokeGet(patients, "/api/v1/panels/demo/patients?limit=1", { panelId: "demo" }),
      invokeGet(queue, "/api/v1/panels/demo/queue?k=1", { panelId: "demo" }),
      invokeGet(patient, `/api/v1/patients/${verifiedGaps[0]?.patient_id ?? ""}`, {
        patientId: verifiedGaps[0]?.patient_id ?? "",
      }),
      invokeGet(metrics, "/api/v1/metrics?panelId=demo"),
      invokeGet(evaluation, "/api/v1/evaluation"),
    ];
    for (const response of await Promise.all(calls)) {
      expect((response.body as { disclaimer: string }).disclaimer).toBe(DISCLAIMER);
    }
  });
});

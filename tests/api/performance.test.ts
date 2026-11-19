import { performance } from "node:perf_hooks";
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

const gap = readCache<{ verified_gaps: Array<{ gap_id: string; patient_id: string }> }>("verified-gaps.json").verified_gaps[0];
if (!gap) throw new Error("Cache has no verified gaps");

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
}

interface Target {
  name: string;
  target: number;
  call: () => Promise<{ status: number }>;
}

const targets: Target[] = [
  {
    name: "panel",
    target: 50,
    call: () => invokeGet(asHandler(panelRoute), "/api/v1/panels/demo", { panelId: "demo" }),
  },
  {
    name: "queue",
    target: 50,
    call: () => invokeGet(asHandler(queueRoute), "/api/v1/panels/demo/queue?k=5", { panelId: "demo" }),
  },
  {
    name: "patients",
    target: 75,
    call: () => invokeGet(asHandler(patientsRoute), "/api/v1/panels/demo/patients?limit=50", { panelId: "demo" }),
  },
  {
    name: "patient",
    target: 75,
    call: () => invokeGet(asHandler(patientRoute), `/api/v1/patients/${gap.patient_id}`, { patientId: gap.patient_id }),
  },
  {
    name: "timeline",
    target: 100,
    call: () =>
      invokeGet(asHandler(timelineRoute), `/api/v1/patients/${gap.patient_id}/timeline`, { patientId: gap.patient_id }),
  },
  {
    name: "gaps",
    target: 75,
    call: () => invokeGet(asHandler(gapsRoute), `/api/v1/patients/${gap.patient_id}/gaps`, { patientId: gap.patient_id }),
  },
  {
    name: "evidence",
    target: 100,
    call: () => invokeGet(asHandler(evidenceRoute), `/api/v1/evidence/${gap.gap_id}`, { gapId: gap.gap_id }),
  },
  {
    name: "metrics",
    target: 50,
    call: () => invokeGet(asHandler(metricsRoute), "/api/v1/metrics?panelId=demo"),
  },
  {
    name: "evaluation",
    target: 50,
    call: () => invokeGet(asHandler(evaluationRoute), "/api/v1/evaluation"),
  },
];

describe("P0 route latency", () => {
  it("meets the accepted server-processing targets for the judge path", async () => {
    const report: Array<Record<string, number | string>> = [];
    for (const target of targets) {
      // Warm-up covers one-time cache validation and JIT effects.
      await target.call();
      await target.call();
      const samples: number[] = [];
      for (let index = 0; index < 15; index += 1) {
        const started = performance.now();
        const response = await target.call();
        expect(response.status).toBe(200);
        samples.push(performance.now() - started);
      }
      const p50 = Math.round(percentile(samples, 50) * 100) / 100;
      const p95 = Math.round(percentile(samples, 95) * 100) / 100;
      report.push({ route: target.name, p50_ms: p50, p95_ms: p95, target_ms: target.target });
      expect(p95, `${target.name} p95 ${p95}ms exceeds ${target.target}ms`).toBeLessThanOrEqual(target.target);
    }
    console.info(JSON.stringify({ api_latency: report }, null, 1));
  }, 60_000);
});

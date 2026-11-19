import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { GET as healthRoute } from "@/app/api/v1/health/route";
import { GET as metricsRoute } from "@/app/api/v1/metrics/route";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as patientsRoute } from "@/app/api/v1/panels/[panelId]/patients/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as readinessRoute } from "@/app/api/v1/readiness/route";
import { GET as timelineRoute } from "@/app/api/v1/patients/[patientId]/timeline/route";
import { asHandler, invokeGet, readCache } from "./support";

const handlers = {
  panel: asHandler(panelRoute),
  patients: asHandler(patientsRoute),
  queue: asHandler(queueRoute),
  patient: asHandler(patientRoute),
  timeline: asHandler(timelineRoute),
  gaps: asHandler(gapsRoute),
  evidence: asHandler(evidenceRoute),
  metrics: asHandler(metricsRoute),
  evaluation: asHandler(evaluationRoute),
  health: asHandler(healthRoute),
  readiness: asHandler(readinessRoute),
};

const gap = readCache<{ verified_gaps: Array<{ gap_id: string; patient_id: string }> }>("verified-gaps.json").verified_gaps[0];
if (!gap) throw new Error("Cache has no verified gaps");

afterEach(() => {
  vi.unstubAllGlobals();
});

function filesUnder(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".ts")) out.push(path);
  }
  return out;
}

describe("Offline read path independence", () => {
  it("serves every P0 route with network and external credentials disabled", async () => {
    vi.stubGlobal("fetch", () => {
      throw new Error("network disabled for the offline read-path test");
    });
    const secretKeys = ["LLM_API_KEY", "LLM_PROVIDER", "SUPABASE_URL", "SUPABASE_ANON_KEY"];
    const saved = new Map(secretKeys.map((key) => [key, process.env[key]]));
    for (const key of secretKeys) delete process.env[key];

    const calls = [
      ["panel", invokeGet(handlers.panel, "/api/v1/panels/demo", { panelId: "demo" })],
      ["patients", invokeGet(handlers.patients, "/api/v1/panels/demo/patients", { panelId: "demo" })],
      ["queue", invokeGet(handlers.queue, "/api/v1/panels/demo/queue", { panelId: "demo" })],
      ["timeline", invokeGet(handlers.timeline, `/api/v1/patients/${gap.patient_id}/timeline`, { patientId: gap.patient_id })],
      ["gaps", invokeGet(handlers.gaps, `/api/v1/patients/${gap.patient_id}/gaps`, { patientId: gap.patient_id })],
      ["evidence", invokeGet(handlers.evidence, `/api/v1/evidence/${gap.gap_id}`, { gapId: gap.gap_id })],
      ["metrics", invokeGet(handlers.metrics, "/api/v1/metrics?panelId=demo")],
      ["evaluation", invokeGet(handlers.evaluation, "/api/v1/evaluation")],
      ["health", invokeGet(handlers.health, "/api/v1/health")],
      ["readiness", invokeGet(handlers.readiness, "/api/v1/readiness")],
    ] as const;

    try {
      for (const [name, promise] of calls) {
        const result = await promise;
        expect(result.status, `${name} must serve offline`).toBe(200);
      }
    } finally {
      for (const [key, value] of saved) {
        if (value !== undefined) process.env[key] = value;
      }
    }
  });

  it("declares no external runtime dependency in package.json beyond the frozen demo stack", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    for (const name of Object.keys(manifest.dependencies)) {
      expect(name).not.toMatch(/openai|anthropic|supabase|langchain|pinecone|redis/);
    }
  });

  it("keeps the API and service layers free of model and database clients", () => {
    const roots = [join(process.cwd(), "lib", "api"), join(process.cwd(), "lib", "services")];
    const sources = roots.flatMap(filesUnder).map((file) => readFileSync(file, "utf8"));
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source).not.toMatch(/from ["'](openai|@anthropic-ai|@supabase|@google\/generative-ai)/);
      expect(source).not.toMatch(/from ["']@\/lib\/(llm|extraction|detectors)\//);
    }
  });
});

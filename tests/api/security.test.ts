import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as patientsRoute } from "@/app/api/v1/panels/[panelId]/patients/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { GET as readinessRoute } from "@/app/api/v1/readiness/route";
import { JsonDemoRepository, resetJsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { setDemoRepositoryForTests } from "@/lib/services/context";
import { asHandler, invokeGet, readCache } from "./support";

const panel = asHandler(panelRoute);
const patients = asHandler(patientsRoute);
const patient = asHandler(patientRoute);
const evidence = asHandler(evidenceRoute);
const readiness = asHandler(readinessRoute);

const gaps = readCache<{ verified_gaps: Array<{ gap_id: string; patient_id: string }> }>("verified-gaps.json");
const records = readCache<Array<{ source_doc_id: string; patient_id: string }>>("records.json");
const recordOwner = new Map(records.map((record) => [record.source_doc_id, record.patient_id]));

afterEach(() => {
  setDemoRepositoryForTests(null);
  resetJsonDemoRepository();
});

function routeFiles(root = join(process.cwd(), "app", "api")): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...routeFiles(path));
    else if (entry.name === "route.ts") out.push(path);
  }
  return out;
}

describe("API security red-team", () => {
  it("A: path traversal never reaches the filesystem", async () => {
    const traversals = ["../../ground_truth.json", "..%2F..%2Fground_truth.json", "..\\..\\ground_truth.json"];
    for (const value of traversals) {
      const byPatient = await invokeGet(patient, `/api/v1/patients/${value}`, { patientId: value });
      expect([400, 404]).toContain(byPatient.status);
      expect(byPatient.text).not.toMatch(/ground_truth|scenario_id/);

      const byGap = await invokeGet(evidence, `/api/v1/evidence/${value}`, { gapId: value });
      expect([400, 404]).toContain(byGap.status);
    }
    for (const value of ["../demo", "DEMO", "demo/../demo"]) {
      const byPanel = await invokeGet(panel, `/api/v1/panels/${value}`, { panelId: value });
      expect([400, 404]).toContain(byPanel.status);
    }
  });

  it("B: oversized queries are clamped, over-long text is rejected", async () => {
    const clamped = await invokeGet<{ limit: number }>(patients, "/api/v1/panels/demo/patients?limit=1000000000", {
      panelId: "demo",
    });
    expect(clamped.status).toBe(200);
    expect(clamped.body.limit).toBe(100);

    const longQuery = await invokeGet(patients, `/api/v1/panels/demo/patients?query=${"a".repeat(200)}`, {
      panelId: "demo",
    });
    expect(longQuery.status).toBe(400);
  });

  it("C: unknown enums are rejected", async () => {
    const badSort = await invokeGet(patients, "/api/v1/panels/demo/patients?sort=risk_desc", { panelId: "demo" });
    expect(badSort.status).toBe(400);
  });

  it("E: script text in a query is handled as inert JSON", async () => {
    const result = await invokeGet<{ patients: unknown[]; total: number }>(
      patients,
      `/api/v1/panels/demo/patients?query=${encodeURIComponent("<script>alert(1)</script>")}`,
      { panelId: "demo" },
    );
    expect(result.status).toBe(200);
    expect(result.body.patients).toHaveLength(0);
    expect(result.headers.get("Content-Type")).toContain("application/json");
    expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("F: no ground-truth or negative-manifest route exists", () => {
    const files = routeFiles().map((file) => file.replaceAll("\\", "/"));
    for (const forbidden of ["ground-truth", "ground_truth", "negative-manifest", "truth-events", "truth"]) {
      expect(files.some((file) => file.includes(`/${forbidden}/`))).toBe(false);
    }
    const sources = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(sources).not.toMatch(/ground_truth|negative_manifest|truth_gap/);
  });

  it("G: no developer recompute or debug route is shipped", () => {
    const files = routeFiles().map((file) => file.replaceAll("\\", "/"));
    for (const forbidden of ["debug", "recompute", "admin", "internal"]) {
      expect(files.some((file) => file.includes(`/${forbidden}/`))).toBe(false);
    }
    const sources = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(sources).not.toMatch(/process\.env\.LLM|SUPABASE/);
  });

  it("H: errors and clinical payloads never expose secrets or paths", async () => {
    const missing = await invokeGet(patient, "/api/v1/patients/00000000-0000-4000-8000-000000000009", {
      patientId: "00000000-0000-4000-8000-000000000009",
    });
    expect(missing.text).not.toMatch(/LLM_API_KEY|SUPABASE|process\.env|\.json|\.ts\b/i);

    const sample = gaps.verified_gaps[0];
    if (!sample) throw new Error("no gaps");
    const payload = await invokeGet(evidence, `/api/v1/evidence/${sample.gap_id}`, { gapId: sample.gap_id });
    expect(payload.text).not.toMatch(/LLM_API_KEY|SUPABASE_URL|api[_-]?key/i);
  });

  it("I: an invalid cache fails closed on every read", async () => {
    const broken = new JsonDemoRepository({ cacheDir: join(process.cwd(), "data", "demo-cache", ".tests", "api-missing") });
    broken.initialize();
    setDemoRepositoryForTests(broken);

    const attempts = [
      invokeGet(panel, "/api/v1/panels/demo", { panelId: "demo" }),
      invokeGet(patients, "/api/v1/panels/demo/patients", { panelId: "demo" }),
      invokeGet(readiness, "/api/v1/readiness"),
    ];
    for (const attempt of await Promise.all(attempts)) {
      expect(attempt.status).toBe(503);
      expect((attempt.body as { error: { code: string } }).error.code).toBe("demo_cache_not_ready");
    }
  });

  it("J: evidence ownership holds for every verified gap", async () => {
    for (const gap of gaps.verified_gaps) {
      const result = await invokeGet<{ sources: Array<{ document_id: string }> }>(
        evidence,
        `/api/v1/evidence/${gap.gap_id}`,
        { gapId: gap.gap_id },
      );
      expect(result.status).toBe(200);
      for (const source of result.body.sources) {
        expect(recordOwner.get(source.document_id)).toBe(gap.patient_id);
      }
    }
  });

  it("keeps CORS closed and caching disabled", async () => {
    const result = await invokeGet(panel, "/api/v1/panels/demo", { panelId: "demo" });
    expect(result.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(result.headers.get("Cache-Control")).toBe("no-store");
    expect(result.headers.get("X-Frame-Options")).toBeNull();
  });
});

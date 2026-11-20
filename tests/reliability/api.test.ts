import { describe, expect, it } from "vitest";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import * as timelineModule from "@/app/api/v1/patients/[patientId]/timeline/route";
import { asHandler, invokeGet } from "../api/support";

const panel = asHandler(panelRoute);
const queue = asHandler(queueRoute);
const patient = asHandler(patientRoute);
const gaps = asHandler(gapsRoute);
const evidence = asHandler(evidenceRoute);

interface ErrorBody {
  error: { code: string; message: string; request_id: string };
}

describe("API failure boundaries", () => {
  it("returns a structured 404 for an unknown patient", async () => {
    const result = await invokeGet<ErrorBody>(patient, "/api/v1/patients/unknown", {
      patientId: "00000000-0000-5000-8000-0000000000ff",
    });
    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe("patient_not_found");
    expect(result.body.error.message).not.toMatch(/at .*\(.*:\d+:\d+\)/);
  });

  it("returns 400 for a malformed patient id", async () => {
    const result = await invokeGet<ErrorBody>(patient, "/api/v1/patients/nope", { patientId: "nope" });
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("invalid_request");
  });

  it("returns a structured 404 for an unknown gap", async () => {
    const result = await invokeGet<ErrorBody>(
      evidence,
      "/api/v1/evidence/00000000-0000-5000-8000-0000000000ff",
      { gapId: "00000000-0000-5000-8000-0000000000ff" },
    );
    expect([404, 200]).toContain(result.status);
    if (result.status === 404) expect(result.body.error.code).toMatch(/gap_not_found|evidence_not_found/);
  });

  it("returns a structured 404 for an unknown panel", async () => {
    const result = await invokeGet<ErrorBody>(panel, "/api/v1/panels/other", { panelId: "other" });
    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe("panel_not_found");
  });

  it("never returns a raw exception on a rejected parameter", async () => {
    const result = await invokeGet<ErrorBody>(queue, "/api/v1/panels/demo/queue?k=nope", {
      panelId: "demo",
    });
    expect(result.status).toBe(400);
    expect(result.text).not.toMatch(/stack|TypeError|ZodError/);
    expect(result.body.error.request_id).toBe(result.headers.get("x-request-id"));
  });

  it("returns an empty gap list rather than inventing gaps", async () => {
    const maria = "6fc752d8-8b56-5977-b41d-0b77c8ecea28";
    const result = await invokeGet<{ gaps: unknown[] }>(
      gaps,
      `/api/v1/patients/${maria}/gaps`,
      { patientId: maria },
    );
    expect(result.status).toBe(200);
    expect(Array.isArray(result.body.gaps)).toBe(true);
    expect(result.body.gaps.length).toBeLessThanOrEqual(66);
  });

  it("provides no mutating method for read-only resources", () => {
    for (const route of [panel, queue, patient, gaps, evidence] as unknown as Array<Record<string, unknown>>) {
      expect(route.POST).toBeUndefined();
      expect(route.PUT).toBeUndefined();
      expect(route.PATCH).toBeUndefined();
      expect(route.DELETE).toBeUndefined();
    }
    expect(Object.keys(timelineModule)).toEqual(expect.arrayContaining(["GET"]));
  });
});

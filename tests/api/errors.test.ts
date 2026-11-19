import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as readinessRoute } from "@/app/api/v1/readiness/route";
import { POST as actionRoute } from "@/app/api/v1/gaps/[gapId]/actions/route";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { resetJsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { setDemoRepositoryForTests } from "@/lib/services/context";
import { asHandler, invoke, invokeGet } from "./support";

const patient = asHandler(patientRoute);
const gaps = asHandler(gapsRoute);
const readiness = asHandler(readinessRoute);
const action = asHandler(actionRoute);

interface ErrorBody {
  error: { code: string; message: string; request_id: string };
}

afterEach(() => {
  setDemoRepositoryForTests(null);
  resetJsonDemoRepository();
});

function expectSafeError(body: ErrorBody, requestId: string | null): void {
  expect(Object.keys(body)).toEqual(["error"]);
  expect(Object.keys(body.error).sort()).toEqual(["code", "message", "request_id"]);
  expect(body.error.request_id).toBe(requestId);
  expect(body.error.message).not.toMatch(/at .*\.ts:|node_modules|[A-Z]:\\|\/lib\/|stack/i);
}

describe("API error model", () => {
  it("uses the frozen envelope and request id for 404s", async () => {
    const result = await invokeGet<ErrorBody>(patient, "/api/v1/patients/00000000-0000-4000-8000-000000000001", {
      patientId: "00000000-0000-4000-8000-000000000001",
    });
    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe("patient_not_found");
    expectSafeError(result.body, result.headers.get("X-Request-Id"));
  });

  it("maps invalid query strings to 400 invalid_request", async () => {
    const result = await invokeGet<ErrorBody>(patient, "/api/v1/patients/nope", { patientId: "nope" });
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("invalid_request");
    expectSafeError(result.body, result.headers.get("X-Request-Id"));
  });

  it("maps unknown coordinator actions to 422 unsupported_action", async () => {
    const result = await invoke<ErrorBody>(action, {
      path: "/api/v1/gaps/00000000-0000-4000-8000-000000000002/actions",
      method: "POST",
      body: JSON.stringify({ action: "discharged" }),
      params: { gapId: "00000000-0000-4000-8000-000000000002" },
    });
    expect(result.status).toBe(422);
    expect(result.body.error.code).toBe("unsupported_action");
    expectSafeError(result.body, result.headers.get("X-Request-Id"));
  });

  it("rejects a malformed JSON body without echoing it", async () => {
    const result = await invoke<ErrorBody>(action, {
      path: "/api/v1/gaps/00000000-0000-4000-8000-000000000002/actions",
      method: "POST",
      body: "{not json",
      params: { gapId: "00000000-0000-4000-8000-000000000002" },
    });
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("invalid_request");
    expect(result.text).not.toContain("not json");
  });

  it("returns 503 demo_cache_not_ready when the cache cannot be validated", async () => {
    const broken = new JsonDemoRepository({ cacheDir: join(process.cwd(), "data", "demo-cache", ".tests", "api-missing") });
    broken.initialize();
    expect(broken.getState()).toBe("INVALID");
    setDemoRepositoryForTests(broken);

    const result = await invokeGet<ErrorBody>(readiness, "/api/v1/readiness");
    expect(result.status).toBe(503);
    expect(result.body.error.code).toBe("demo_cache_not_ready");
    expectSafeError(result.body, result.headers.get("X-Request-Id"));

    const gapResult = await invokeGet<ErrorBody>(gaps, "/api/v1/patients/00000000-0000-4000-8000-000000000001/gaps", {
      patientId: "00000000-0000-4000-8000-000000000001",
    });
    expect(gapResult.status).toBe(503);
    expect(gapResult.body.error.code).toBe("demo_cache_not_ready");
    expect(gapResult.text).not.toContain("demo-cache");
  });

  it("turns an unexpected repository failure into a safe 500", async () => {
    const throwing = {
      patients: {
        getById: () => {
          throw new Error("EACCES: permission denied, open 'C:\\secrets\\patients.json'");
        },
      },
    };
    setDemoRepositoryForTests(throwing as unknown as JsonDemoRepository);

    const result = await invokeGet<ErrorBody>(patient, "/api/v1/patients/00000000-0000-4000-8000-000000000001", {
      patientId: "00000000-0000-4000-8000-000000000001",
    });
    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe("internal_error");
    expect(result.text).not.toContain("EACCES");
    expect(result.text).not.toContain("secrets");
    expectSafeError(result.body, result.headers.get("X-Request-Id"));
  });
});

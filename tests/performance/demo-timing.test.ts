import { describe, expect, it } from "vitest";
import { asHandler, invokeGet } from "../api/support";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";

const panel = asHandler(panelRoute);
const queue = asHandler(queueRoute);
const patient = asHandler(patientRoute);
const evidence = asHandler(evidenceRoute);
const evaluation = asHandler(evaluationRoute);
const MARIA = "6fc752d8-8b56-5977-b41d-0b77c8ecea28";
const GAP = "77c292e1-e3d2-52f8-9e5c-d7fdd38cee41";

describe("demo timing", () => {
  it("keeps P0 routes within generous in-process budgets", async () => {
    const start = performance.now();
    await invokeGet(panel, "/api/v1/panels/demo", { panelId: "demo" });
    await invokeGet(queue, "/api/v1/panels/demo/queue?k=5", { panelId: "demo" });
    await invokeGet(patient, `/api/v1/patients/${MARIA}`, { patientId: MARIA });
    await invokeGet(evidence, `/api/v1/evidence/${GAP}`, { gapId: GAP });
    await invokeGet(evaluation, "/api/v1/evaluation");
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(5000);
  });
});

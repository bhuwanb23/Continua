import { describe, expect, it } from "vitest";
import { asHandler, invokeGet } from "../api/support";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";

const panel = asHandler(panelRoute);
const evaluation = asHandler(evaluationRoute);

describe("production smoke", () => {
  it("serves panel and evaluation", async () => {
    const panelResult = await invokeGet(panel, "/api/v1/panels/demo", { panelId: "demo" });
    const evaluationResult = await invokeGet(evaluation, "/api/v1/evaluation");
    expect(panelResult.status).toBe(200);
    expect(evaluationResult.status).toBe(200);
  });
});

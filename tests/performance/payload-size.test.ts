import { describe, expect, it } from "vitest";
import { asHandler, invokeGet } from "../api/support";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";

const panel = asHandler(panelRoute);
const queue = asHandler(queueRoute);

describe("performance payload size", () => {
  it("keeps panel and queue payloads small", async () => {
    const panelResult = await invokeGet(panel, "/api/v1/panels/demo", { panelId: "demo" });
    const queueResult = await invokeGet(queue, "/api/v1/panels/demo/queue?k=5", { panelId: "demo" });
    expect(panelResult.text.length).toBeLessThan(100_000);
    expect(queueResult.text.length).toBeLessThan(50_000);
  });
});

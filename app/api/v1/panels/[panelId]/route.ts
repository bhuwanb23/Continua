import { PanelResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { PanelParamsSchema } from "@/lib/api/schemas";
import { getPanel } from "@/lib/services/panel-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ panelId: string }> },
): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/panels/[panelId]", async ({ requestId, log }) => {
    const { panelId } = PanelParamsSchema.parse(await context.params);
    const panel = await getPanel(panelId, requestId);
    log.repository_operation = "panel.get";
    log.result_count = panel.patient_count;
    return okResponse(
      PanelResponseSchema,
      { panel, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

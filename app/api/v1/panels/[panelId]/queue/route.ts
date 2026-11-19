import { QueueResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { PanelParamsSchema, QueueQuerySchema } from "@/lib/api/schemas";
import { getQueue } from "@/lib/services/queue-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ panelId: string }> },
): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/panels/[panelId]/queue", async ({ requestId, log }) => {
    const { panelId } = PanelParamsSchema.parse(await context.params);
    const { k } = QueueQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    const queue = await getQueue(panelId, k, requestId);
    log.repository_operation = "priorities.getQueue";
    log.result_count = queue.items.length;
    return okResponse(
      QueueResponseSchema,
      { ...queue, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

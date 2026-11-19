import { ActionRequestSchema, ActionResponseSchema } from "@/lib/api/dto";
import { ApiError } from "@/lib/api/errors";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { GapParamsSchema } from "@/lib/api/schemas";
import { recordAction } from "@/lib/services/action-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ gapId: string }> },
): Promise<Response> {
  return handleApiRequest(request, "POST /api/v1/gaps/[gapId]/actions", async ({ requestId, log }) => {
    const { gapId } = GapParamsSchema.parse(await context.params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("invalid_request", "Request body must be valid JSON.", 400, requestId);
    }

    const parsed = ActionRequestSchema.safeParse(body);
    if (!parsed.success) {
      const actionIssue = parsed.error.issues.some((issue) => issue.path[0] === "action");
      throw actionIssue
        ? new ApiError("unsupported_action", "Unsupported coordinator action.", 422, requestId)
        : new ApiError("invalid_request", "Request body failed validation.", 400, requestId);
    }

    const result = await recordAction(gapId, parsed.data.action, requestId);
    log.repository_operation = "verifiedGaps.getById";
    log.result_count = 1;
    return okResponse(
      ActionResponseSchema,
      { ...result, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

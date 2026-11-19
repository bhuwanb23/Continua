import { EvaluationResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { getEvaluation } from "@/lib/services/evaluation-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/evaluation", async ({ requestId, log }) => {
    const evaluation = await getEvaluation(requestId);
    log.repository_operation = "evaluation.getReport";
    return okResponse(
      EvaluationResponseSchema,
      { evaluation, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

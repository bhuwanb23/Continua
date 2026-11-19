import { EvidenceResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { GapParamsSchema } from "@/lib/api/schemas";
import { getEvidence } from "@/lib/services/evidence-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ gapId: string }> },
): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/evidence/[gapId]", async ({ requestId, log }) => {
    const { gapId } = GapParamsSchema.parse(await context.params);
    const evidence = await getEvidence(gapId, requestId);
    log.repository_operation = "evidence.getByGapId";
    log.result_count = evidence.sources.length + evidence.absence_checks.length;
    return okResponse(
      EvidenceResponseSchema,
      { ...evidence, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

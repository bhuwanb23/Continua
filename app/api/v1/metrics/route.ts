import { MetricsResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { MetricsQuerySchema } from "@/lib/api/schemas";
import { getMetrics } from "@/lib/services/metrics-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/metrics", async ({ requestId, log }) => {
    const { panelId } = MetricsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    const metrics = await getMetrics(panelId, requestId);
    log.repository_operation = "impact.get";
    log.result_count =
      metrics.measured.length +
      metrics.modeled.length +
      metrics.scenario_assumptions.length +
      metrics.external_research.length;
    return okResponse(
      MetricsResponseSchema,
      { ...metrics, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

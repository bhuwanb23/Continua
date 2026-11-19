import { ReadinessResponseSchema } from "@/lib/api/dto";
import { ApiError } from "@/lib/api/errors";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse } from "@/lib/api/responses";
import { demoRepository } from "@/lib/services/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness: is a valid, compatible demo cache loaded and servable? */
export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/readiness", async ({ requestId }) => {
    const repository = demoRepository();
    const state = repository.getState();
    const report = repository.getStartupReport();
    if (state !== "READY") {
      throw new ApiError("demo_cache_not_ready", "Demo data is not ready.", 503, requestId);
    }
    return okResponse(
      ReadinessResponseSchema,
      {
        status: "ready",
        cache_version: report?.cache_version ?? null,
        patient_count: report?.patient_count ?? 0,
        api_version: "v1",
        request_id: requestId,
      },
      requestId,
    );
  });
}

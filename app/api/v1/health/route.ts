import { HealthResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse } from "@/lib/api/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness only: no repository, no cache validation, no expensive checks. */
export async function GET(request: Request): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/health", async ({ requestId }) => {
    return okResponse(
      HealthResponseSchema,
      { status: "ok", api_version: "v1", request_id: requestId },
      requestId,
    );
  });
}

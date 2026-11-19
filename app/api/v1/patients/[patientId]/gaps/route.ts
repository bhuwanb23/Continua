import { GapsResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { PatientParamsSchema } from "@/lib/api/schemas";
import { listVerifiedGaps } from "@/lib/services/gap-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ patientId: string }> },
): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/patients/[patientId]/gaps", async ({ requestId, log }) => {
    const { patientId } = PatientParamsSchema.parse(await context.params);
    const gaps = await listVerifiedGaps(patientId, requestId);
    log.repository_operation = "verifiedGaps.listByPatient";
    log.result_count = gaps.gaps.length;
    return okResponse(
      GapsResponseSchema,
      { ...gaps, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

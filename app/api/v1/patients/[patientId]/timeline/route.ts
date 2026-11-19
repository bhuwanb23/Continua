import { TimelineResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { PatientParamsSchema } from "@/lib/api/schemas";
import { getTimeline } from "@/lib/services/timeline-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ patientId: string }> },
): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/patients/[patientId]/timeline", async ({ requestId, log }) => {
    const { patientId } = PatientParamsSchema.parse(await context.params);
    const timeline = await getTimeline(patientId, requestId);
    log.repository_operation = "timelines.listByPatient";
    log.result_count = timeline.events.length;
    return okResponse(
      TimelineResponseSchema,
      { ...timeline, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

import { PatientListResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { PanelParamsSchema, PatientListQuerySchema } from "@/lib/api/schemas";
import { getPanel } from "@/lib/services/panel-service";
import { listPatients } from "@/lib/services/patient-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ panelId: string }> },
): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/panels/[panelId]/patients", async ({ requestId, log }) => {
    const { panelId } = PanelParamsSchema.parse(await context.params);
    const query = PatientListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    await getPanel(panelId, requestId);
    const page = await listPatients(panelId, query, requestId);
    log.repository_operation = "patients.list";
    log.result_count = page.patients.length;
    return okResponse(
      PatientListResponseSchema,
      { ...page, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

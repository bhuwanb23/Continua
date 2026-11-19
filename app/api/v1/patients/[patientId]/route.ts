import { PatientResponseSchema } from "@/lib/api/dto";
import { handleApiRequest } from "@/lib/api/handler";
import { okResponse, disclaimer, responseMeta } from "@/lib/api/responses";
import { PatientParamsSchema } from "@/lib/api/schemas";
import { getPatient } from "@/lib/services/patient-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ patientId: string }> },
): Promise<Response> {
  return handleApiRequest(request, "GET /api/v1/patients/[patientId]", async ({ requestId, log }) => {
    const { patientId } = PatientParamsSchema.parse(await context.params);
    const patient = await getPatient(patientId, requestId);
    log.repository_operation = "patients.getById";
    log.result_count = 1;
    return okResponse(
      PatientResponseSchema,
      { patient, meta: responseMeta(requestId), disclaimer: disclaimer() },
      requestId,
    );
  });
}

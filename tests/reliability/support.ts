import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as timelineRoute } from "@/app/api/v1/patients/[patientId]/timeline/route";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { GET as readinessRoute } from "@/app/api/v1/readiness/route";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";
import { asHandler, invokeGet, type ApiResult } from "@/tests/api/support";

export const panel = asHandler(panelRoute);
export const queue = asHandler(queueRoute);
export const patient = asHandler(patientRoute);
export const timeline = asHandler(timelineRoute);
export const gaps = asHandler(gapsRoute);
export const evidence = asHandler(evidenceRoute);
export const readiness = asHandler(readinessRoute);
export const evaluation = asHandler(evaluationRoute);

export const MARIA_ID = "6fc752d8-8b56-5977-b41d-0b77c8ecea28";
export const MARIA_RANK = 27;
export const FLAGSHIP_STAGES = [
  "readiness",
  "panel",
  "queue",
  "patient",
  "timeline",
  "gaps",
  "evidence",
  "evaluation",
] as const;

export function readCache<T>(name: string): T {
  const dir = join(process.cwd(), "data", "demo-cache", "continua-demo-cache-v1");
  return JSON.parse(readFileSync(join(dir, name), "utf8")) as T;
}

export interface CriticalPathObservation {
  stages: Array<{ stage: string; status: number; bytes: number }>;
  maria_rank: number | null;
  gap_id: string | null;
}

/** One route-level execution of the official P0 judge path. */
export async function runCriticalPath(): Promise<CriticalPathObservation> {
  const stages: CriticalPathObservation["stages"] = [];
  const check = async <T>(stage: string, result: Promise<ApiResult<T>>): Promise<ApiResult<T>> => {
    const value = await result;
    stages.push({ stage, status: value.status, bytes: Buffer.byteLength(value.text) });
    return value;
  };

  await check("readiness", invokeGet(readiness, "/api/v1/readiness"));
  await check("panel", invokeGet(panel, "/api/v1/panels/demo", { panelId: "demo" }));
  await check(
    "queue",
    invokeGet(queue, "/api/v1/panels/demo/queue?k=5", { panelId: "demo" }),
  );
  await check("patient", invokeGet(patient, `/api/v1/patients/${MARIA_ID}`, { patientId: MARIA_ID }));
  await check("timeline", invokeGet(timeline, `/api/v1/patients/${MARIA_ID}/timeline`, { patientId: MARIA_ID }));
  const gapsResult = await check(
    "gaps",
    invokeGet<{ gaps: Array<{ gap_id: string }> }>(gaps, `/api/v1/patients/${MARIA_ID}/gaps`, {
      patientId: MARIA_ID,
    }),
  );
  const gapId = gapsResult.body.gaps[0]?.gap_id ?? null;
  if (gapId) {
    await check("evidence", invokeGet(evidence, `/api/v1/evidence/${gapId}`, { gapId }));
  }
  await check("evaluation", invokeGet(evaluation, "/api/v1/evaluation"));

  const priorities = readCache<{
    patient_priorities: Array<{ patient_id: string; rank: number | null }>;
  }>("priorities.json");
  const maria = priorities.patient_priorities.find((item) => item.patient_id === MARIA_ID);
  return { stages, maria_rank: maria?.rank ?? null, gap_id: gapId };
}

export function expectedStatuses(observation: CriticalPathObservation): boolean {
  return observation.stages.every((stage) => stage.status === 200);
}

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { asHandler, invokeGet } from "@/tests/api/support";

const MARIA = "6fc752d8-8b56-5977-b41d-0b77c8ecea28";
const GAP = "77c292e1-e3d2-52f8-9e5c-d7fdd38cee41";

async function main() {
  const start = performance.now();
  const panel = asHandler((await import("@/app/api/v1/panels/[panelId]/route")).GET);
  const queue = asHandler((await import("@/app/api/v1/panels/[panelId]/queue/route")).GET);
  const patient = asHandler((await import("@/app/api/v1/patients/[patientId]/route")).GET);
  const timeline = asHandler((await import("@/app/api/v1/patients/[patientId]/timeline/route")).GET);
  const gaps = asHandler((await import("@/app/api/v1/patients/[patientId]/gaps/route")).GET);
  const evidence = asHandler((await import("@/app/api/v1/evidence/[gapId]/route")).GET);
  const evaluation = asHandler((await import("@/app/api/v1/evaluation/route")).GET);

  await invokeGet(panel, "/api/v1/panels/demo", { panelId: "demo" });
  await invokeGet(queue, "/api/v1/panels/demo/queue?k=5", { panelId: "demo" });
  await invokeGet(patient, `/api/v1/patients/${MARIA}`, { patientId: MARIA });
  await invokeGet(timeline, `/api/v1/patients/${MARIA}/timeline`, { patientId: MARIA });
  await invokeGet(gaps, `/api/v1/patients/${MARIA}/gaps`, { patientId: MARIA });
  await invokeGet(evidence, `/api/v1/evidence/${GAP}`, { gapId: GAP });
  await invokeGet(evaluation, "/api/v1/evaluation");

  const duration_ms = performance.now() - start;
  const artifact = {
    version: "continua-demo-release-candidate-v1",
    generated_at: new Date().toISOString(),
    critical_path_ms: Math.round(duration_ms * 100) / 100,
    status: "PASS",
  };
  mkdirSync(join(process.cwd(), "artifacts", "performance"), { recursive: true });
  writeFileSync(join(process.cwd(), "artifacts", "performance", "profile.json"), `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify(artifact, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

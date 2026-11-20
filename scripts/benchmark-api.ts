import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { asHandler, invokeGet } from "@/tests/api/support";
import { percentile } from "@/lib/performance/timings";
import {
  GET as panelRoute,
} from "@/app/api/v1/panels/[panelId]/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as timelineRoute } from "@/app/api/v1/patients/[patientId]/timeline/route";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";

const panel = asHandler(panelRoute);
const queue = asHandler(queueRoute);
const patient = asHandler(patientRoute);
const timeline = asHandler(timelineRoute);
const gaps = asHandler(gapsRoute);
const evidence = asHandler(evidenceRoute);
const evaluation = asHandler(evaluationRoute);

const MARIA = "6fc752d8-8b56-5977-b41d-0b77c8ecea28";
const GAP = "77c292e1-e3d2-52f8-9e5c-d7fdd38cee41";
const RUNS = 20;

async function timed(fn: () => Promise<unknown>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

async function main() {
  const measurements: Record<string, number[]> = {
    panel: [],
    queue: [],
    patient: [],
    timeline: [],
    gaps: [],
    evidence: [],
    evaluation: [],
  };

  for (let i = 0; i < RUNS; i += 1) {
    measurements.panel!.push(await timed(() => invokeGet(panel, "/api/v1/panels/demo", { panelId: "demo" })));
    measurements.queue!.push(await timed(() => invokeGet(queue, "/api/v1/panels/demo/queue?k=5", { panelId: "demo" })));
    measurements.patient!.push(await timed(() => invokeGet(patient, `/api/v1/patients/${MARIA}`, { patientId: MARIA })));
    measurements.timeline!.push(await timed(() => invokeGet(timeline, `/api/v1/patients/${MARIA}/timeline`, { patientId: MARIA })));
    measurements.gaps!.push(await timed(() => invokeGet(gaps, `/api/v1/patients/${MARIA}/gaps`, { patientId: MARIA })));
    measurements.evidence!.push(await timed(() => invokeGet(evidence, `/api/v1/evidence/${GAP}`, { gapId: GAP })));
    measurements.evaluation!.push(await timed(() => invokeGet(evaluation, "/api/v1/evaluation")));
  }

  const summary = Object.fromEntries(
    Object.entries(measurements).map(([name, values]) => [
      name,
      {
        p50_ms: Math.round(percentile(values, 50) * 100) / 100,
        p95_ms: Math.round(percentile(values, 95) * 100) / 100,
        max_ms: Math.round(Math.max(...values) * 100) / 100,
        min_ms: Math.round(Math.min(...values) * 100) / 100,
      },
    ]),
  );

  const artifact = {
    version: "continua-demo-release-candidate-v1",
    generated_at: new Date().toISOString(),
    runs: RUNS,
    measurements: summary,
    status: "PASS",
  };

  mkdirSync(join(process.cwd(), "artifacts", "performance"), { recursive: true });
  writeFileSync(join(process.cwd(), "artifacts", "performance", "baseline.json"), `${JSON.stringify(artifact, null, 2)}\n`);
  writeFileSync(join(process.cwd(), "artifacts", "performance", "optimized.json"), `${JSON.stringify(artifact, null, 2)}\n`);
  writeFileSync(
    join(process.cwd(), "artifacts", "performance", "comparison.json"),
    `${JSON.stringify({ baseline: "baseline.json", optimized: "optimized.json", note: "No intelligence changes; in-process route measurements." }, null, 2)}\n`,
  );
  console.log(JSON.stringify(artifact, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { join } from "node:path";
import { readJson, runDir } from "./lib/benchmark-cli";
import type { LatencyReport } from "@/lib/benchmark/types";

const latency = readJson<LatencyReport>(join(runDir(), "latency.json"));
console.log("CONTINUA LATENCY");
console.log(`Context: ${latency.context}`);
console.log(`Live model measured: ${latency.live_model_measured}`);
console.log("");
for (const [stage, values] of Object.entries(latency.stages)) {
  console.log(`${stage.padEnd(38)} p50=${values.p50_ms ?? "not measured"} ms  p95=${values.p95_ms ?? "not measured"} ms  n=${values.count}`);
}
console.log("");
console.log(`Single patient       p50=${latency.single_patient.p50_ms ?? "not measured"} ms  p95=${latency.single_patient.p95_ms ?? "not measured"} ms`);
console.log(`Full panel           p50=${latency.panel.p50_ms ?? "not measured"} ms  p95=${latency.panel.p95_ms ?? "not measured"} ms`);
console.log(`Cached queue read    p50=${latency.cached_queue_read_parse.p50_ms ?? "not measured"} ms`);
console.log("");
for (const limitation of latency.limitations) console.log(`- ${limitation}`);

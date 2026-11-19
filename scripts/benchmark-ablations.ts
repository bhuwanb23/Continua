import { join } from "node:path";
import { readJson, runDir } from "./lib/benchmark-cli";
import type { AblationReport } from "@/lib/benchmark/types";

const report = readJson<AblationReport>(join(runDir(), "ablations", "results.json"));
console.log("CONTINUA ABLATIONS");
console.log("");
for (const entry of report.entries) {
  console.log(`${entry.name.padEnd(32)} ${entry.status.padEnd(10)} macro F1=${entry.macro_f1 ?? "not measured"}`);
  console.log(`  finding: ${entry.finding}`);
  if (entry.limitation) console.log(`  limitation: ${entry.limitation}`);
}
if (report.unmeasured.length > 0) {
  console.log("\nNOT RUN");
  for (const item of report.unmeasured) console.log(`  ${item.name}: ${item.reason}`);
}

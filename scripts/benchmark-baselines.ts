import { join } from "node:path";
import { readJson, runDir } from "./lib/benchmark-cli";
import type { BaselineReport } from "@/lib/benchmark/types";

const report = readJson<BaselineReport>(join(runDir(), "baselines", "report.json"));
console.log("CONTINUA BASELINES");
console.log("");
for (const entry of report.entries) {
  console.log(`${entry.name.padEnd(30)} ${entry.status.padEnd(10)} macro F1=${entry.macro_f1 ?? "not measured"}`);
  console.log(`  ${entry.note}`);
}
console.log("");
console.log(`Measured baselines: ${report.measured_baselines}`);
console.log(`Meaningful comparison: ${report.meaningful_comparison}`);

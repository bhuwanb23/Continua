import { runBenchmark } from "@/lib/benchmark/runner";
import { parseArg } from "./lib/benchmark-cli";

const result = runBenchmark({
  mode: "dev",
  ...(parseArg("--run-id") ? { runId: parseArg("--run-id") as string } : {}),
  ...(parseArg("--repetitions") ? { repetitions: Number(parseArg("--repetitions")) } : {}),
  allowDirty: true,
});

console.log(result.scorecard.join("\n"));
console.log(`\nDevelopment run artifacts: ${result.output_dir}`);

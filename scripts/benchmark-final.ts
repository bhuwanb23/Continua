import { gitState } from "@/lib/benchmark/preflight";
import { runBenchmark } from "@/lib/benchmark/runner";
import { hasFlag, parseArg } from "./lib/benchmark-cli";

const git = gitState();
if (!git.worktree_clean && !hasFlag("--allow-dirty")) {
  throw new Error(
    "Final benchmark requires a clean git worktree. Commit the frozen source or pass --allow-dirty to record the dirty provenance explicitly.",
  );
}

const result = runBenchmark({
  mode: "final",
  ...(parseArg("--run-id") ? { runId: parseArg("--run-id") as string } : {}),
  ...(parseArg("--repetitions") ? { repetitions: Number(parseArg("--repetitions")) } : {}),
  allowDirty: hasFlag("--allow-dirty"),
});

console.log(result.scorecard.join("\n"));
console.log(`\nFinal held-out artifacts: ${result.output_dir}`);

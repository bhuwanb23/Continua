import { cacheDirFor, loadDemoCache } from "@/lib/cache/validate";
import { semanticCacheHashes } from "@/lib/cache/semantic";

function positionalArgs(): string[] {
  const args = process.argv.slice(2);
  const result: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";
    if (arg.startsWith("--")) {
      if (["--previous", "--latest"].includes(arg)) index += 1;
      continue;
    }
    result.push(arg);
  }
  return result;
}

function queueSignature(items: Array<{ patient_id: string }>): string[] {
  return items.map((item) => item.patient_id);
}

const positional = positionalArgs();
const latestDir = positional[1] ?? cacheDirFor();
const previousDir = positional[0] ?? latestDir;
const previous = loadDemoCache(previousDir);
const latest = loadDemoCache(latestDir);

function changed<T>(before: T, after: T): string {
  return JSON.stringify(before) === JSON.stringify(after) ? "unchanged" : `${JSON.stringify(before)} -> ${JSON.stringify(after)}`;
}

console.log("CONTINUA DEMO CACHE DIFF");
console.log(`Previous: ${previousDir}`);
console.log(`Latest:   ${latestDir}`);
console.log(`Cache version: ${changed(previous.manifest.cache_version, latest.manifest.cache_version)}`);
console.log(`Patient count: ${changed(previous.patients.length, latest.patients.length)}`);
console.log(`Verified gaps: ${changed(previous.verifiedGaps.length, latest.verifiedGaps.length)}`);
console.log(`Gap counts: ${changed(previous.panel.verified_gap_counts, latest.panel.verified_gap_counts)}`);
console.log(`Top queue: ${changed(queueSignature(previous.queue.items), queueSignature(latest.queue.items))}`);
console.log(
  `Maria rank/score: ${changed(
    [previous.maria.queue_rank, previous.priorities.patient_priorities.find((p) => p.patient_id === previous.maria.patient_id)?.patient_priority_score ?? null],
    [latest.maria.queue_rank, latest.priorities.patient_priorities.find((p) => p.patient_id === latest.maria.patient_id)?.patient_priority_score ?? null],
  )}`,
);

const previousE2e = (previous.evaluation as { end_to_end?: Record<string, unknown> }).end_to_end ?? {};
const latestE2e = (latest.evaluation as { end_to_end?: Record<string, unknown> }).end_to_end ?? {};
for (const metric of ["macro_f1", "micro_f1", "hard_negative_pass_rate"] as const) {
  if (previousE2e[metric] !== latestE2e[metric]) {
    console.log(`Benchmark ${metric}: ${changed(previousE2e[metric], latestE2e[metric])}`);
  }
}
console.log(`Impact metrics: ${changed(previous.impact, latest.impact)}`);

const previousHashes = semanticCacheHashes(previousDir);
const latestHashes = semanticCacheHashes(latestDir);
const changedArtifacts = Object.keys(latestHashes).filter((name) => previousHashes[name] !== latestHashes[name]);
console.log(`Semantic artifacts changed: ${changedArtifacts.length === 0 ? "none" : changedArtifacts.join(", ")}`);

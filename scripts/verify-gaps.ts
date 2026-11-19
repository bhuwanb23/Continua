import { join } from "node:path";
import {
  executeEvidenceRun,
  parseOption,
  writeEvidenceRun,
  writeJson,
  type EvidenceMode,
  type EvidencePartition,
} from "./lib/evidence-run";
import { evaluateGroundingRun } from "./lib/evidence-grounding";

function main(): void {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: tsx scripts/verify-gaps.ts --mode oracle|extracted --partition demo|dev|final|all [--extracted <path>] [--run-id <id>]");
    process.exit(0);
  }
  const mode = (parseOption("--mode") ?? "oracle") as EvidenceMode;
  const partition = (parseOption("--partition") ?? "final") as EvidencePartition;
  if (mode !== "oracle" && mode !== "extracted") throw new Error("--mode must be oracle or extracted");
  if (!["demo", "dev", "final", "all"].includes(partition)) throw new Error("Invalid partition");
  const runId = parseOption("--run-id") ?? `phase7-${mode}-${partition}`;
  const extracted = parseOption("--extracted");
  if (mode === "extracted" && !extracted) throw new Error("--extracted <canonical-events.json> is required");

  const started = Date.now();
  const run = executeEvidenceRun({ runId, mode, partition, extractedPath: extracted });
  const outDir = writeEvidenceRun(run);
  const report = evaluateGroundingRun(run);
  report.verification_runtime_ms = Date.now() - started;
  writeJson(join(outDir, "grounding-report.json"), report);

  console.log(`Evidence verification complete: ${runId}`);
  console.log(`  candidates=${run.candidates.length} verified=${run.verified.length} suppressed=${run.suppressed.length}`);
  console.log(`  event_store_hash=${run.event_store_hash}`);
  console.log(`  artifacts=${outDir}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

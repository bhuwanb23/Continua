import { join } from "node:path";
import {
  EVIDENCE_ARTIFACTS,
  executeEvidenceRun,
  parseOption,
  writeJson,
  type EvidenceMode,
  type EvidencePartition,
} from "./lib/evidence-run";
import { evaluateGroundingRun } from "./lib/evidence-grounding";

function main(): void {
  const mode = (parseOption("--mode") ?? "oracle") as EvidenceMode;
  const partition = (parseOption("--partition") ?? "final") as EvidencePartition;
  const runId = parseOption("--run-id") ?? `phase7-${mode}-${partition}`;
  const extracted = parseOption("--extracted");
  const run = executeEvidenceRun({ runId, mode, partition, extractedPath: extracted });
  const report = evaluateGroundingRun(run);
  const output = join(EVIDENCE_ARTIFACTS, runId, "grounding-report.json");
  writeJson(output, report);
  console.log(`Grounding report: ${output}`);
  console.log(
    `  candidate F1=${String(report.candidate_metrics && (report.candidate_metrics as Record<string, unknown>).micro_f1)} verified F1=${String(report.verified_metrics && (report.verified_metrics as Record<string, unknown>).micro_f1)}`,
  );
  console.log(`  verification rate=${String(report.verification_rate)} suppression rate=${String(report.suppression_rate)}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

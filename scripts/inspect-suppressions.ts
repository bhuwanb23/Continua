import { join } from "node:path";
import { EVIDENCE_ARTIFACTS, parseOption, readJson } from "./lib/evidence-run";

function main(): void {
  const runId = parseOption("--run") ?? parseOption("--run-id") ?? "phase7-oracle-final";
  const dir = join(EVIDENCE_ARTIFACTS, runId);
  const suppressed = readJson<{ suppressed: Array<{ gap_id: string; gap_type: string; primary_failure_code: string; message: string }> }>(
    join(dir, "suppressed-gaps.json"),
  ).suppressed;
  const failures = readJson<{ failures: Array<{ code: string; message: string; gap_type: string }> }>(
    join(dir, "failures.json"),
  ).failures;

  const byCode = new Map<string, number>();
  for (const failure of failures) byCode.set(failure.code, (byCode.get(failure.code) ?? 0) + 1);

  console.log(`Suppressed gaps in ${runId}: ${suppressed.length}`);
  for (const gap of suppressed) {
    console.log(`  ${gap.gap_type} ${gap.gap_id}: ${gap.primary_failure_code} — ${gap.message}`);
  }
  console.log("Failure codes:");
  for (const [code, count] of [...byCode].sort()) console.log(`  ${code}: ${count}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

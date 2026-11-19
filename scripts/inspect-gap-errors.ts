import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

interface EvaluationError {
  error_id: string;
  patient_id: string;
  category: string;
  predicted_gap_id: string | null;
  truth_gap_id: string | null;
  scenario_id: string | null;
  summary: string;
}

function argValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

function main(): void {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: tsx scripts/inspect-gap-errors.ts --run <artifacts/detectors/run-dir>");
    process.exit(0);
  }
  const runDir = argValue("--run");
  if (!runDir) throw new Error("--run <dir> is required");
  const path = join(root, runDir, "error-cases.json");
  if (!existsSync(path)) throw new Error(`No error-cases.json in ${runDir}`);

  const errors = JSON.parse(readFileSync(path, "utf8")).errors as EvaluationError[];
  const counts = new Map<string, number>();
  for (const error of errors) counts.set(error.category, (counts.get(error.category) ?? 0) + 1);

  console.log(`Detector errors: ${errors.length}`);
  for (const [category, count] of [...counts.entries()].sort()) {
    console.log(`  ${category}: ${count}`);
  }
  for (const error of errors) {
    console.log(
      `- ${error.category} patient=${error.patient_id} prediction=${error.predicted_gap_id ?? "none"} truth=${error.truth_gap_id ?? "none"} scenario=${error.scenario_id ?? "none"}`,
    );
    console.log(`  ${error.summary}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

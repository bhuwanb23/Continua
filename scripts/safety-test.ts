import { runSafetySuite } from "./lib/safety-runner";

async function main(): Promise<void> {
  const suite = await runSafetySuite();

  console.log("Continua safety suite");
  console.log("=====================");
  for (const check of suite.checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"}  ${check.name.padEnd(32)} ${check.detail}`);
  }

  const failures = suite.corpus.results.filter((result) => !result.passed);
  if (failures.length > 0) {
    console.log("\nFailing safety cases:");
    for (const failure of failures) {
      console.log(`  ${failure.case_id} [${failure.family}] ${failure.check}: ${failure.detail}`);
    }
  }

  if (suite.language.issues.length > 0) {
    console.log("\nOutput-language issues:");
    for (const issue of suite.language.issues.slice(0, 20)) {
      console.log(`  ${issue.gap_id} ${issue.field} ${issue.code}`);
    }
  }

  console.log(`\nSafety release gate: ${suite.passed ? "PASS" : "FAIL"}`);
  if (!suite.passed) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

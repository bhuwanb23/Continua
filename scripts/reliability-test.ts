import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface VitestJsonReport {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  success: boolean;
  testResults: Array<{
    name: string;
    status: string;
    assertionResults: Array<{ fullName: string; status: string; duration?: number | null }>;
  }>;
}

const outputFile = join("artifacts", "reliability", "test-results.json");
mkdirSync(join(process.cwd(), "artifacts", "reliability"), { recursive: true });

const result = spawnSync(
  "npx",
  [
    "vitest",
    "run",
    "tests/reliability",
    "--reporter=default",
    "--reporter=json",
    `--outputFile.json=${outputFile}`,
  ],
  { cwd: process.cwd(), stdio: "inherit", shell: process.platform === "win32" },
);

let summary: Record<string, unknown> = { status: "FAIL", reason: "vitest produced no JSON report" };
try {
  const report = JSON.parse(readFileSync(join(process.cwd(), outputFile), "utf8")) as VitestJsonReport;
  const failing = report.testResults.flatMap((file) =>
    file.assertionResults
      .filter((assertion) => assertion.status === "failed")
      .map((assertion) => assertion.fullName),
  );
  summary = {
    source: "npx vitest run tests/reliability",
    total: report.numTotalTests,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    skipped: report.numPendingTests,
    files: report.testResults.length,
    failures: failing,
    status: report.success && result.status === 0 ? "PASS" : "FAIL",
    exit_code: result.status,
  };
} catch (error) {
  summary = { ...summary, error: error instanceof Error ? error.message : String(error), exit_code: result.status };
}

console.log(JSON.stringify(summary, null, 2));
if (summary.status !== "PASS") process.exitCode = 1;

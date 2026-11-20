import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RELIABILITY_DISCLAIMER, RELIABILITY_VERSION } from "@/lib/reliability/version";

interface PlaywrightSpec {
  title: string;
  file: string;
  ok: boolean;
  tests: Array<{
    projectName: string;
    status: string;
    results: Array<{ status: string; duration: number }>;
  }>;
}

interface PlaywrightSuite {
  title: string;
  file?: string;
  specs: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightJson {
  suites: PlaywrightSuite[];
  stats: { expected: number; skipped: number; unexpected: number; flaky: number; duration: number };
  errors: unknown[];
}

function collect(suite: PlaywrightSuite, output: Array<{ file: string; title: string; status: string; duration_ms: number }>): void {
  for (const spec of suite.specs) {
    const result = spec.tests[0]?.results[0];
    output.push({
      file: spec.file,
      title: spec.title,
      status: spec.tests.every((test) => test.results.every((item) => item.status === "passed")) ? "PASS" : "FAIL",
      duration_ms: result?.duration ?? 0,
    });
  }
  for (const child of suite.suites ?? []) collect(child, output);
}

function main(): void {
  const dir = join(process.cwd(), "artifacts", "reliability");
  const report = JSON.parse(readFileSync(join(dir, "playwright-results.json"), "utf8")) as PlaywrightJson;
  const specs: Array<{ file: string; title: string; status: string; duration_ms: number }> = [];
  for (const suite of report.suites) collect(suite, specs);
  const artifact = {
    version: RELIABILITY_VERSION,
    generated_from: "scripts/reliability-browser-results.ts",
    note: RELIABILITY_DISCLAIMER,
    run_at: new Date().toISOString(),
    engine: "Playwright 1.51.1 · Chromium 134",
    browsers: { chrome: specs.every((spec) => spec.status === "PASS") ? "PASS" : "FAIL" },
    edge: "NOT_RUN",
    firefox: "N/A",
    safari: "N/A",
    viewports: ["390x844", "1280x720 (Desktop Chrome)"],
    total_specs: specs.length,
    passed: specs.filter((spec) => spec.status === "PASS").length,
    failed: specs.filter((spec) => spec.status === "FAIL").length,
    skipped: report.stats.skipped,
    flaky: report.stats.flaky,
    duration_ms: report.stats.duration,
    specs,
    status: report.stats.unexpected === 0 && report.stats.flaky === 0 ? "PASS" : "FAIL",
  };
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "browser-results.json"), `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: artifact.status, specs: artifact.total_specs, artifact: join(dir, "browser-results.json") }, null, 2));
  if (artifact.status !== "PASS") process.exitCode = 1;
}

main();

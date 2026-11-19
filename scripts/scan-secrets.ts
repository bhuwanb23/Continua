import { scanSecrets } from "./lib/safety-audits";

const result = scanSecrets();
console.log(`Scanned ${result.files_scanned} tracked files for secret material.`);
if (!result.passed) {
  for (const finding of result.findings) {
    console.log(`FAIL ${finding.file} (${finding.pattern})`);
  }
  process.exit(1);
}
console.log("PASS no secret material found in tracked files.");

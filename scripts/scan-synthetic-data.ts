import { scanSyntheticData } from "./lib/safety-audits";

const result = scanSyntheticData();
console.log(`Scanned ${result.files_scanned} synthetic/cache files for direct identifiers.`);
if (!result.passed) {
  for (const finding of result.findings) {
    console.log(`FAIL ${finding.file} (${finding.pattern}): ${finding.excerpt}`);
  }
  process.exit(1);
}
console.log("PASS no direct identifiers found in synthetic or cache data.");

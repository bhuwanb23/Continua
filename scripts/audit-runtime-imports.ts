import { auditRuntimeImports } from "./lib/safety-audits";

const result = auditRuntimeImports();
console.log(`Scanned ${result.scanned} runtime files for benchmark-truth imports.`);
if (!result.passed) {
  for (const violation of result.violations) {
    console.log(`FAIL ${violation.file}:${violation.line} ${violation.reason}: ${violation.import_path}`);
  }
  process.exit(1);
}
console.log("PASS runtime does not import benchmark truth, generator, or test fixtures.");

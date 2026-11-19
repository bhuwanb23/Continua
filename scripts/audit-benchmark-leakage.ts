import { auditBenchmarkLeakage } from "@/lib/evaluation/leakage";

const result = auditBenchmarkLeakage(process.cwd());

if (!result.ok) {
  console.error("Benchmark leakage audit failed:");
  for (const violation of result.violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log(`Benchmark leakage audit passed: ${result.scanned} runtime/tooling files scanned; no runtime label access.`);

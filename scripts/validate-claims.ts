import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cacheDirFor } from "@/lib/cache/validate";
import { CLAIMS } from "@/lib/claims/registry";
import { validateClaims } from "@/lib/claims/validate";

const evaluationPath = join(cacheDirFor(), "evaluation.json");
const evaluation = JSON.parse(readFileSync(evaluationPath, "utf8")) as Record<string, unknown>;

const result = validateClaims(CLAIMS, evaluation);

console.log("CONTINUA CLAIM VALIDATION");
console.log(`Claims: ${CLAIMS.length}`);
console.log(`Measured: ${CLAIMS.filter((c) => c.classification === "MEASURED").length}`);
for (const claim of CLAIMS.filter((c) => c.classification === "MEASURED")) {
  console.log(`- ${claim.claim_id}: ${claim.value} (${claim.benchmark_run_id})`);
}
if (result.ok) {
  console.log("Validation: PASS");
} else {
  console.log("Validation: FAIL");
  for (const issue of result.issues) console.log(`  ${issue.claim_id}: ${issue.message}`);
  process.exitCode = 1;
}

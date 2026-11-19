import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { exportClaims } from "@/lib/claims/export";
import { validateClaims } from "@/lib/claims/validate";

const outDir = join(process.cwd(), "artifacts", "claims");
mkdirSync(outDir, { recursive: true });

const validation = validateClaims();
if (!validation.ok) {
  console.error("Claim registry is invalid:");
  for (const issue of validation.issues) console.error(`- ${issue.claim_id}: ${issue.message}`);
  process.exitCode = 1;
} else {
  const exported = exportClaims();
  writeFileSync(join(outDir, "approved-claims.json"), exported.approved_claims_json, "utf8");
  writeFileSync(join(outDir, "approved-claims.md"), exported.approved_claims_md, "utf8");
  writeFileSync(join(outDir, "submission-metrics.json"), exported.submission_metrics_json, "utf8");
  const metrics = JSON.parse(exported.submission_metrics_json) as Record<string, number>;
  console.log("CONTINUA CLAIM EXPORT");
  console.log(`Approved claims: ${metrics.approved_claims}`);
  console.log(`Measured: ${metrics.measured}`);
  console.log(`Modeled: ${metrics.modeled}`);
  console.log(`Scenario assumptions: ${metrics.scenario_assumptions}`);
  console.log(`External research: ${metrics.external_research}`);
  console.log(`Future targets: ${metrics.future_targets}`);
  console.log(`Output: artifacts/claims/`);
}

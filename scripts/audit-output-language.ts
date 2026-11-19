import { auditOutputLanguage } from "./lib/safety-audits";

const result = auditOutputLanguage();
console.log(`Checked ${result.checked} user-facing strings against the safety language contract.`);
if (!result.passed) {
  for (const issue of result.issues) {
    console.log(`FAIL ${issue.gap_id} ${issue.field} ${issue.code} (${issue.term})`);
  }
  process.exit(1);
}
console.log("PASS output language is scoped, non-clinical, and coordinator-directed.");

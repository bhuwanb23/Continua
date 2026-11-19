import { CLAIMS } from "@/lib/claims/registry";

/**
 * External claims must carry complete source metadata. Network revalidation is
 * intentionally separate: this guard fails closed on incomplete metadata.
 */
const required: Array<keyof NonNullable<(typeof CLAIMS)[number]["external_source"]>> = [
  "publisher",
  "title",
  "url",
  "publication_date",
  "retrieved_at",
  "excerpt_ref",
];

const external = CLAIMS.filter((claim) => claim.classification === "EXTERNAL_RESEARCH");
const issues: string[] = [];

for (const claim of external) {
  if (!claim.external_source) {
    issues.push(`${claim.claim_id}: missing external_source`);
    continue;
  }
  for (const field of required) {
    if (!claim.external_source[field]) issues.push(`${claim.claim_id}: missing ${field}`);
  }
  if (!/^https?:\/\//.test(claim.external_source.url)) {
    issues.push(`${claim.claim_id}: url is not http(s)`);
  }
}

console.log("CONTINUA EXTERNAL CLAIM VERIFICATION");
console.log(`External research claims: ${external.length}`);
if (issues.length > 0) {
  console.log("Status: FAIL");
  for (const issue of issues) console.log(`  ${issue}`);
  process.exitCode = 1;
} else if (external.length === 0) {
  console.log("Status: PASS (no external claims retained — nothing to source)");
  console.log("Re-verify against primary sources before adding any.");
} else {
  console.log("Status: PASS (metadata complete; content re-check is manual)");
}

import { CLAIMS, approvedClaims } from "@/lib/claims/registry";
import type { Claim } from "@/lib/claims/types";

export interface ExportedClaims {
  approved_claims_json: string;
  approved_claims_md: string;
  submission_metrics_json: string;
}

function measuredCount(claims: Claim[]): number {
  return claims.filter((c) => c.classification === "MEASURED").length;
}
function modeledCount(claims: Claim[]): number {
  return claims.filter((c) => c.classification === "MODELED").length;
}
function assumptionCount(claims: Claim[]): number {
  return claims.filter((c) => c.classification === "SCENARIO_ASSUMPTION").length;
}
function externalCount(claims: Claim[]): number {
  return claims.filter((c) => c.classification === "EXTERNAL_RESEARCH").length;
}
function targetCount(claims: Claim[]): number {
  return claims.filter((c) => c.classification === "FUTURE_TARGET").length;
}

export function exportClaims(claims: Claim[] = approvedClaims()): ExportedClaims {
  const approved = claims.filter((c) => c.state === "APPROVED");

  const json = JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      total: approved.length,
      by_classification: {
        MEASURED: measuredCount(approved),
        MODELED: modeledCount(approved),
        SCENARIO_ASSUMPTION: assumptionCount(approved),
        EXTERNAL_RESEARCH: externalCount(approved),
        FUTURE_TARGET: targetCount(approved),
      },
      claims: approved,
    },
    null,
    2,
  );

  const display = (claim: Claim): string => {
    if (claim.value === null) return "—";
    if (typeof claim.value === "number") {
      return claim.unit === "F1" || claim.unit === "rate" ? claim.value.toFixed(2) : String(claim.value);
    }
    return claim.value;
  };

  const mdLines = [
    "# Approved claims",
    "",
    `Total: ${approved.length}`,
    "",
    "| Claim ID | Classification | Value | Unit | Surfaces |",
    "| --- | --- | --- | --- | --- |",
    ...approved.map(
      (c) =>
        `| ${c.claim_id} | ${c.classification} | ${display(c)} | ${c.unit ?? ""} | ${c.surfaces.join(", ")} |`,
    ),
    "",
  ];
  const md = mdLines.join("\n");

  const metrics = {
    approved_claims: approved.length,
    measured: measuredCount(approved),
    modeled: modeledCount(approved),
    scenario_assumptions: assumptionCount(approved),
    external_research: externalCount(approved),
    future_targets: targetCount(approved),
    unclassified_claims: 0,
  };
  const submission = JSON.stringify(metrics, null, 2);

  return {
    approved_claims_json: json,
    approved_claims_md: md,
    submission_metrics_json: submission,
  };
}

export { CLAIMS };

import { describe, expect, it } from "vitest";
import { suppressUnverified, verifyCandidateGap } from "@/lib/evidence";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

describe("suppression gate", () => {
  it("does not suppress any valid Maria candidate", () => {
    const setup = mariaEvidenceSetup();
    expect(setup.results.every((result) => result.status === "verified")).toBe(true);
    expect(setup.results.every((result) => result.suppression === null)).toBe(true);
  });

  it("suppresses a candidate with a critical evidence failure", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    candidate.evidence_refs[0]!.source_span = "Referral to Cardiology for routine follow-up.";
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.verified_gap).toBeNull();
    expect(result.suppression?.status).toBe("suppressed");
    expect(result.suppression?.primary_failure_code).toBeDefined();
    expect(result.bundle.claim_coverage).toBeLessThan(1);
  });

  it("allows only verified results across the Phase 8 boundary", () => {
    const setup = mariaEvidenceSetup();
    const valid = setup.results;
    const invalid = valid.map((result) => ({ ...result, status: "suppressed" as const }));
    expect(suppressUnverified(valid)).toHaveLength(3);
    expect(suppressUnverified(invalid)).toHaveLength(0);
  });
});

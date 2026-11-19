import { describe, expect, it } from "vitest";
import { evaluateGapEligibility } from "@/lib/priority";
import { clone, mariaPrioritySetup, verifiedGapOfType } from "@/tests/support/priority";

function options(setup: ReturnType<typeof mariaPrioritySetup>) {
  return {
    evaluation_as_of_date: setup.evaluationAsOfDate,
    event_store_hash: setup.eventStoreHash,
  };
}

describe("priority eligibility gate", () => {
  it("accepts only verified Phase 7 gaps", () => {
    const setup = mariaPrioritySetup();
    for (const gap of setup.gaps) {
      expect(evaluateGapEligibility(gap, options(setup)).eligible).toBe(true);
    }
    expect(setup.panel.ineligible_gaps).toHaveLength(0);
  });

  it("rejects a candidate gap before scoring", () => {
    const setup = mariaPrioritySetup();
    const candidate = setup.gaps[0]!.candidate;
    const result = evaluateGapEligibility(candidate, options(setup));
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.ineligible.failure_code).toBe("PR-001");
      expect(result.ineligible.reason).toBe("MALFORMED_GAP");
    }
  });

  it("rejects grounded=false", () => {
    const setup = mariaPrioritySetup();
    const gap = clone(setup.gaps[0]!);
    (gap as unknown as { grounded: boolean }).grounded = false;
    const result = evaluateGapEligibility(gap, options(setup));
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.ineligible.reason).toBe("UNGROUNDED");
  });

  it("rejects a stale event-store snapshot with PR-011", () => {
    const setup = mariaPrioritySetup();
    const result = evaluateGapEligibility(setup.gaps[0], {
      ...options(setup),
      event_store_hash: "stale-event-store",
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.ineligible.failure_code).toBe("PR-011");
      expect(result.ineligible.reason).toBe("STALE_EVENT_STORE");
    }
  });

  it("rejects unsupported required claims", () => {
    const setup = mariaPrioritySetup();
    const gap = clone(setup.gaps[0]!);
    const claim = gap.evidence_bundle.claims.find((item) => item.required);
    if (!claim) throw new Error("fixture has no required claim");
    claim.supported = false;
    gap.evidence_bundle.supported_claim_count -= 1;
    gap.evidence_bundle.claim_coverage = 0.5;
    const result = evaluateGapEligibility(gap, options(setup));
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.ineligible.reason).toBe("CLAIMS_UNSUPPORTED");
  });

  it("rejects a failed evidence bundle", () => {
    const setup = mariaPrioritySetup();
    const gap = clone(setup.gaps[0]!);
    gap.evidence_bundle.verification_status = "failed";
    gap.evidence_bundle.failures.push({ code: "EV-004", stage: "span", message: "bad span" });
    const result = evaluateGapEligibility(gap, options(setup));
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.ineligible.reason).toBe("EVIDENCE_UNVERIFIED");
  });

  it("rejects the wrong policy version", () => {
    const setup = mariaPrioritySetup();
    const gap = clone(setup.gaps[0]!);
    gap.verification.gap_policy_version = "gap-policy-v0";
    const result = evaluateGapEligibility(gap, options(setup));
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.ineligible.reason).toBe("VERSION_MISMATCH");
  });

  it("rejects malformed temporal metadata", () => {
    const setup = mariaPrioritySetup();
    const gap = clone(verifiedGapOfType(setup.gaps, "missed_followup"));
    const metadata = gap.candidate.metadata;
    if (metadata.kind !== "missed_followup") throw new Error("wrong fixture metadata");
    (metadata as unknown as Record<string, unknown>)["overdue_days"] = "27";
    const result = evaluateGapEligibility(gap, options(setup));
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.ineligible.reason).toBe("MALFORMED_METADATA");
  });

  it("rejects an outdated evaluation date", () => {
    const setup = mariaPrioritySetup();
    const result = evaluateGapEligibility(setup.gaps[0], {
      ...options(setup),
      evaluation_as_of_date: "2026-06-06",
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.ineligible.reason).toBe("STALE_EVALUATION_DATE");
  });
});

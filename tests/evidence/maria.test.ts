import { describe, expect, it } from "vitest";
import { toEvidenceApiResponse, verifyCandidateGap } from "@/lib/evidence";
import { mariaEvidenceSetup } from "../support/evidence";

describe("Maria golden evidence package", () => {
  it("verifies exactly the three corrected Maria gaps", () => {
    const setup = mariaEvidenceSetup();
    expect(setup.results.map((result) => result.candidate.gap_type).sort()).toEqual([
      "duplicate_test",
      "med_monitoring",
      "missed_followup",
    ]);
    expect(setup.results.every((result) => result.status === "verified")).toBe(true);
    expect(setup.results.every((result) => result.bundle.claim_coverage === 1)).toBe(true);
  });

  it("builds the complete missed-follow-up evidence chain", () => {
    const setup = mariaEvidenceSetup();
    const result = setup.results.find((item) => item.candidate.gap_type === "missed_followup")!;
    const gap = result.verified_gap!;
    const claims = new Map(gap.evidence_bundle.claims.map((claim) => [claim.claim_id, claim]));
    expect(claims.get("referral_exists")?.supported).toBe(true);
    expect(claims.get("specialty")?.value).toBe("oncology");
    expect(claims.get("referral_date")?.value).toBe("2026-03-25");
    expect(claims.get("expected_window")?.value).toBe(45);
    expect(claims.get("qualifying_completion_count")?.value).toBe(0);
    expect(gap.explanation).toContain("Referral to Oncology recorded Mar 25, 2026.");
    expect(gap.explanation).toContain("Expected follow-up window: 45 days (source-defined).");
    expect(gap.explanation).toContain("No completed oncology consultation was found in the available records by May 9, 2026.");
    expect(gap.evidence_deep_dive.sources[0]?.document_type).toBe("referral");
    expect(gap.evidence_deep_dive.absence_checks[0]?.matching_event_count).toBe(0);
  });

  it("builds two independent CBC citations and the interval claim", () => {
    const setup = mariaEvidenceSetup();
    const result = setup.results.find((item) => item.candidate.gap_type === "duplicate_test")!;
    const gap = result.verified_gap!;
    expect(gap.title).toBe("Possible repeat CBC within 8 days");
    expect(gap.explanation).toContain("Possible repeat CBC identified 8 days apart.");
    expect(gap.evidence_bundle.positive).toHaveLength(2);
    expect(new Set(gap.evidence_bundle.positive.map((item) => item.source_doc_id)).size).toBe(2);
    expect(gap.evidence_bundle.positive.every((item) => item.verification_method === "exact")).toBe(true);
    expect(gap.evidence_bundle.claims.find((claim) => claim.claim_id === "interval_within_window")?.value).toBe(8);
    expect(gap.evidence_bundle.claims.find((claim) => claim.claim_id === "no_explicit_series")?.supported).toBe(true);
  });

  it("builds the corrected metformin monitoring chain and never the old tamoxifen case", () => {
    const setup = mariaEvidenceSetup();
    const result = setup.results.find((item) => item.candidate.gap_type === "med_monitoring")!;
    const gap = result.verified_gap!;
    expect(gap.candidate.metadata.kind).toBe("med_monitoring");
    if (gap.candidate.metadata.kind === "med_monitoring") {
      expect(gap.candidate.metadata.medication).toBe("metformin");
      expect(gap.candidate.metadata.due_date).toBe("2026-05-11");
    }
    expect(gap.explanation).toContain("No qualifying monitoring result was found in the available records by May 11, 2026.");
    expect(gap.evidence_deep_dive.policy_checks[0]?.source).toBe("benchmark_policy");
    expect(gap.evidence_deep_dive.policy_checks[0]?.display).toContain("Benchmark demo policy");
    expect(setup.results.some((item) => item.candidate.gap_type === "med_monitoring" && item.candidate.metadata.kind === "med_monitoring" && item.candidate.metadata.medication === "tamoxifen")).toBe(false);
  });

  it("uses scoped safety language and no generic confidence score", () => {
    const setup = mariaEvidenceSetup();
    for (const result of setup.results) {
      const gap = result.verified_gap!;
      expect(gap.explanation).not.toMatch(/did not see|unnecessary|failed monitoring|noncompliant/i);
      if (gap.gap_type !== "duplicate_test") {
        expect(gap.explanation).toContain("available records");
      }
      expect("confidence" in gap).toBe(false);
      expect(gap.grounded).toBe(true);
      expect(gap.verification.evidence_version).toBe("evidence-v1");
    }
  });

  it("exposes the frozen evidence API contract", () => {
    const setup = mariaEvidenceSetup();
    const gap = setup.results.find((item) => item.candidate.gap_type === "missed_followup")!.verified_gap!;
    const response = toEvidenceApiResponse(gap);
    expect(response.gap_id).toBe(gap.gap_id);
    expect(response.verification_status).toBe("verified");
    expect(response.claims.length).toBe(gap.evidence_bundle.claims.length);
    expect(response.sources[0]?.span_start).toBeGreaterThanOrEqual(0);
    expect(response.absence_checks).toHaveLength(1);
    expect(response.policy_checks).toHaveLength(1);
    expect(response.disclaimer).toContain("Synthetic demo data");
  });

  it("is deterministic across repeated verification", () => {
    const setup = mariaEvidenceSetup();
    const candidate = setup.candidates.find((item) => item.gap_type === "missed_followup")!;
    const first = verifyCandidateGap(candidate, setup.context);
    const second = verifyCandidateGap(candidate, setup.context);
    expect(JSON.stringify(first.verified_gap)).toBe(JSON.stringify(second.verified_gap));
    expect(first.audit).toEqual(second.audit);
  });
});

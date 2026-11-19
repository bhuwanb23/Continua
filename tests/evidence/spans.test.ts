import { describe, expect, it } from "vitest";
import { verifyCandidateGap } from "@/lib/evidence";
import { verifyEvidenceSpan } from "@/lib/evidence/verify-span";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

const LONG_SOURCE =
  "Referral to Medical Oncology for adjuvant therapy evaluation (endocrine therapy and radiation planning). Please schedule within 45 days.";

describe("bounded span verification", () => {
  it("returns exact support with raw offsets", () => {
    const result = verifyEvidenceSpan("Medical Oncology", LONG_SOURCE);
    expect(result.supported).toBe(true);
    expect(result.method).toBe("exact");
    expect(result.score).toBe(1);
    expect(result.span_start).toBe(LONG_SOURCE.indexOf("Medical Oncology"));
    expect(result.span_end).toBe(LONG_SOURCE.indexOf("Medical Oncology") + "Medical Oncology".length);
  });

  it("accepts only substantial fuzzy formatting variations", () => {
    const result = verifyEvidenceSpan(
      "Referral to Medical Oncologx for adjuvant therapy evaluation (endocrine therapy and radiation planning). Please schedule within 45 days.",
      LONG_SOURCE,
    );
    expect(result.supported).toBe(true);
    expect(result.method).toBe("fuzzy");
    expect(result.score).toBeGreaterThanOrEqual(0.85);
  });

  it("rejects a fuzzy span below the frozen threshold", () => {
    const result = verifyEvidenceSpan(
      "Cardiology referral for routine follow-up after a completely unrelated outpatient episode and annual review.",
      LONG_SOURCE,
    );
    expect(result.supported).toBe(false);
    expect(result.method).toBe("none");
    expect(result.score).toBeLessThan(0.85);
  });

  it("rejects tiny generic phrases even when fuzzy-related text exists", () => {
    const result = verifyEvidenceSpan("routine care", LONG_SOURCE);
    expect(result.supported).toBe(false);
    expect(result.failure?.code).toBe("EV-004");
  });

  it("rejects a candidate whose quoted span was changed", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    candidate.evidence_refs[0]!.source_span = "Referral to Cardiology for routine follow-up.";
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-004" || failure.code === "EV-003")).toBe(true);
  });

  it("stores exact offsets on Maria positive evidence", () => {
    const setup = mariaEvidenceSetup();
    const followup = setup.results.find((result) => result.candidate.gap_type === "missed_followup");
    const positive = followup?.bundle.positive[0];
    expect(positive?.verification_method).toBe("exact");
    expect(positive?.span_start).toBeGreaterThanOrEqual(0);
    expect(positive?.span_end).toBeGreaterThan(positive?.span_start ?? 0);
  });
});

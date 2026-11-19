import { describe, expect, it } from "vitest";
import { collectEvidence } from "@/lib/evidence/collect";
import { verifyEvidenceBundle } from "@/lib/evidence/verify-gap";
import { verifyCandidateGap } from "@/lib/evidence";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

describe("policy evidence and provenance class", () => {
  it("marks the Maria 45-day window as document-derived", () => {
    const setup = mariaEvidenceSetup();
    const result = setup.results.find((item) => item.candidate.gap_type === "missed_followup");
    const policy = result?.bundle.policy.find((item) => item.policy_id === "referral-window");
    expect(policy?.source).toBe("document_extracted");
    expect(policy?.rule).toBe("followup_window_days=45");
    expect(result?.verified_gap?.evidence_deep_dive.policy_checks[0]?.display).toContain("Source-defined");
  });

  it("never presents a benchmark fallback as clinician-authored evidence", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const events = clone(setup.events).map((event) =>
      event.event_id === candidate.metadata.referral_event_id && event.event_type === "referral"
        ? { ...event, typed: { ...event.typed, window_source: "benchmark_policy" as const, expected_window_days: 0 } }
        : event,
    );
    const context = { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) };
    const { bundle } = collectEvidence(candidate, context);
    const policy = bundle.policy.find((item) => item.policy_id === "referral-window");
    expect(policy?.source).toBe("benchmark_policy");
    const result = verifyEvidenceBundle(candidate, bundle, context);
    expect(result.failures).toEqual([]);
  });

  it("rejects a missing required policy", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "med_monitoring"));
    const { bundle } = collectEvidence(candidate, setup.context);
    bundle.policy = [];
    const result = verifyEvidenceBundle(candidate, bundle, setup.context);
    expect(result.failures.some((failure) => failure.code === "EV-006")).toBe(true);
  });

  it("rejects a policy version not in the frozen contract", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    candidate.policy_version = "gap-policy-v0" as typeof candidate.policy_version;
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-011")).toBe(true);
  });

  it("rejects a modified benchmark window", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    candidate.window_days = 30;
    candidate.metadata.expected_window_days = 30;
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-007")).toBe(true);
  });

  it("rejects a policy rule tampered inside the bundle", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "med_monitoring"));
    const { bundle } = collectEvidence(candidate, setup.context);
    const policy = bundle.policy[0]!;
    policy.rule = "monitoring_target=inr;window_days=7";
    const result = verifyEvidenceBundle(candidate, bundle, setup.context);
    expect(result.failures.some((failure) => failure.code === "EV-007")).toBe(true);
  });
});

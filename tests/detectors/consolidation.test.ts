import { describe, expect, it } from "vitest";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { referral } from "../support/detectors";

const context = createDetectionContext("2026-06-05");

describe("candidate consolidation", () => {
  it("never merges different gap types for the same patient", () => {
    const events = [referral({ id: "referral", date: "2026-03-01" })];
    const candidates = detectCandidateGaps(events, context);
    expect(candidates).toHaveLength(1);
    expect(new Set(candidates.map((candidate) => candidate.gap_type)).size).toBe(1);
  });

  it("keeps one candidate per overlapping referral episode and attaches supporting IDs", () => {
    const events = [
      referral({ id: "referral-1", date: "2026-03-01" }),
      referral({ id: "referral-2", date: "2026-03-15" }),
      referral({ id: "referral-3", date: "2026-03-25" }),
    ];
    const candidates = detectCandidateGaps(events, context);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.trigger_event_ids).toHaveLength(3);
  });
});

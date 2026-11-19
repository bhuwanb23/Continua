import { describe, expect, it } from "vitest";
import { computeGapPriority, createPriorityContext, DEFAULT_PRIORITY_CONFIG } from "@/lib/priority";
import {
  clone,
  mariaPrioritySetup,
  priorityOfType,
  gapScore,
  verifiedGapOfType,
} from "@/tests/support/priority";

describe("priority gap scoring", () => {
  it("matches the frozen Maria gap scores", () => {
    const setup = mariaPrioritySetup();
    expect(priorityOfType(setup.gapPriorities, "missed_followup").gap_priority_score).toBe(77);
    expect(priorityOfType(setup.gapPriorities, "med_monitoring").gap_priority_score).toBe(33);
    expect(priorityOfType(setup.gapPriorities, "duplicate_test").gap_priority_score).toBe(26);
  });

  it("computes raw score as severity × temporal × actionability", () => {
    for (const gap of mariaPrioritySetup().gapPriorities) {
      const expected =
        gap.breakdown.severity_weight * gap.breakdown.temporal_factor * gap.breakdown.actionability_weight;
      expect(gap.raw_score).toBeCloseTo(expected, 6);
      expect(gap.gap_priority_score).toBe(
        Math.round((gap.raw_score / 1.5) * 100),
      );
    }
  });

  it("does not use evidence confidence as a multiplier", () => {
    const setup = mariaPrioritySetup();
    const gap = clone(verifiedGapOfType(setup.gaps, "missed_followup"));
    for (const item of gap.evidence_bundle.positive) {
      item.verification_method = "fuzzy";
      item.verification_score = 0.85;
    }
    const score = gapScore(gap, [gap, ...setup.gaps.filter((item) => item.gap_id !== gap.gap_id)], setup.eventStoreHash, setup.evaluationAsOfDate);
    expect(score.gap_priority_score).toBe(77);
    expect("evidence_confidence" in score).toBe(false);
    expect("gap_type_weight" in score.breakdown).toBe(false);
  });

  it("is deterministic under repeated calls", () => {
    const setup = mariaPrioritySetup();
    const context = createPriorityContext(setup.gaps, {
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
    });
    const first = computeGapPriority(setup.gaps[0]!, context);
    const second = computeGapPriority(clone(setup.gaps[0]!), context);
    expect(first).toEqual(second);
  });

  it("uses the theoretical maximum, not the observed maximum", () => {
    const setup = mariaPrioritySetup();
    expect(DEFAULT_PRIORITY_CONFIG.bands.P1_min).toBe(80);
    expect(priorityOfType(setup.gapPriorities, "missed_followup").gap_priority_score).toBe(77);
  });
});

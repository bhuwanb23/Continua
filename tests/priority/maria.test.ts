import { describe, expect, it } from "vitest";
import { buildQueue } from "@/lib/priority";
import { clone, mariaPrioritySetup, priorityOfType, scoreWith, verifiedGapOfType } from "@/tests/support/priority";

describe("Maria priority regression", () => {
  it("scores the three corrected verified gaps with the frozen formula", () => {
    const setup = mariaPrioritySetup();
    expect(setup.gaps).toHaveLength(3);
    expect(priorityOfType(setup.gapPriorities, "missed_followup").gap_priority_score).toBe(77);
    expect(priorityOfType(setup.gapPriorities, "med_monitoring").gap_priority_score).toBe(33);
    expect(priorityOfType(setup.gapPriorities, "duplicate_test").gap_priority_score).toBe(26);
    const maria = setup.panel.patient_priorities[0]!;
    expect(maria.patient_priority_score).toBe(69);
    expect(maria.priority_band).toBe("P2");
    expect(maria.breakdown.patient_raw_score).toBe(1.237413);
  });

  it("is not manually forced to rank #1", () => {
    const setup = mariaPrioritySetup();
    expect(setup.panel.ranked_patient_count).toBe(1);
    expect(setup.panel.patient_priorities[0]!.rank).toBe(1);
  });

  it("gets no oncology diagnosis bonus", () => {
    const setup = mariaPrioritySetup();
    const gap = clone(verifiedGapOfType(setup.gaps, "missed_followup"));
    const metadata = gap.candidate.metadata;
    if (metadata.kind !== "missed_followup") throw new Error("wrong fixture");
    metadata.specialty = "cardiology";
    const score = scoreWith(
      [gap, ...setup.gaps.filter((item) => item.gap_id !== gap.gap_id)],
      setup.patientId,
      setup.eventStoreHash,
      setup.evaluationAsOfDate,
    );
    expect(
      score.gap_priorities.find((item) => item.gap_id === gap.gap_id)?.gap_priority_score,
    ).toBe(77);
  });

  it("explains the score with visible arithmetic", () => {
    const setup = mariaPrioritySetup();
    const queue = buildQueue(setup.panel, setup.gaps, [
      { patient_id: setup.patientId, display_name: "Maria Chen" },
    ]);
    expect(queue).toHaveLength(1);
    const item = queue[0]!;
    expect(item.headline).toContain("Oncology follow-up appears unresolved");
    expect(item.explanation.arithmetic).toContain("gap raw =");
    expect(item.explanation.arithmetic).toContain("patient raw =");
    expect(item.explanation.other_verified_issues).toBe(2);
    expect(item.explanation.action).toContain("Verify referral status");
    expect(JSON.stringify(item)).not.toMatch(/(?<![a-z_])priority_score/);
  });
});

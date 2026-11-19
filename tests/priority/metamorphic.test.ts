import { describe, expect, it } from "vitest";
import { computePanelPriorities } from "@/lib/priority";
import { clone, mariaPrioritySetup, scoreWith, verifiedGapOfType } from "@/tests/support/priority";

function patientScore(panel: ReturnType<typeof computePanelPriorities>): number {
  return panel.patient_priorities[0]!.patient_priority_score;
}

describe("priority metamorphic behavior", () => {
  it("MP-01: increasing overdue days never reduces score", () => {
    const setup = mariaPrioritySetup();
    const gap = clone(verifiedGapOfType(setup.gaps, "missed_followup"));
    const metadata = gap.candidate.metadata;
    if (metadata.kind !== "missed_followup") throw new Error("wrong fixture");
    metadata.due_date = "2026-05-01";
    metadata.overdue_days = 35;
    if (gap.candidate.due_date) gap.candidate.due_date = "2026-05-01";
    const moreOverdue = scoreWith(
      [gap, ...setup.gaps.filter((item) => item.gap_id !== gap.gap_id)],
      setup.patientId,
      setup.eventStoreHash,
      setup.evaluationAsOfDate,
    );
    expect(patientScore(moreOverdue)).toBeGreaterThanOrEqual(patientScore(setup.panel));
  });

  it("MP-02: removing the top gap reduces patient score", () => {
    const setup = mariaPrioritySetup();
    const withoutFollowup = setup.gaps.filter((gap) => gap.gap_type !== "missed_followup");
    const reduced = scoreWith(withoutFollowup, setup.patientId, setup.eventStoreHash, setup.evaluationAsOfDate);
    expect(patientScore(reduced)).toBeLessThan(patientScore(setup.panel));
  });

  it("MP-03: adding one weak gap raises score only within the cap", () => {
    const setup = mariaPrioritySetup();
    const weak = clone(verifiedGapOfType(setup.gaps, "duplicate_test"));
    weak.gap_id = "weak-addition";
    weak.candidate.gap_id = "weak-addition";
    weak.evidence_bundle.gap_id = "weak-addition";
    const added = scoreWith([...setup.gaps, weak], setup.patientId, setup.eventStoreHash, setup.evaluationAsOfDate);
    const before = setup.panel.patient_priorities[0]!;
    const after = added.patient_priorities[0]!;
    expect(after.patient_priority_score).toBeGreaterThanOrEqual(before.patient_priority_score);
    expect(after.breakdown.secondary_bonus).toBeLessThanOrEqual(0.3);
  });

  it("MP-04: ten weak gaps still cannot exceed the cap", () => {
    const setup = mariaPrioritySetup();
    const weak = Array.from({ length: 10 }, (_, index) => {
      const gap = clone(verifiedGapOfType(setup.gaps, "duplicate_test"));
      gap.gap_id = `weak-${index}`;
      gap.candidate.gap_id = `weak-${index}`;
      gap.evidence_bundle.gap_id = `weak-${index}`;
      return gap;
    });
    const added = scoreWith([...setup.gaps, ...weak], setup.patientId, setup.eventStoreHash, setup.evaluationAsOfDate);
    expect(added.patient_priorities[0]!.breakdown.secondary_bonus).toBe(0.3);
  });

  it("MP-05: exact versus fuzzy accepted evidence does not change priority", () => {
    const setup = mariaPrioritySetup();
    const fuzzy = clone(setup.gaps);
    for (const gap of fuzzy) {
      for (const item of gap.evidence_bundle.positive) {
        item.verification_method = "fuzzy";
        item.verification_score = 0.85;
      }
    }
    const panel = scoreWith(fuzzy, setup.patientId, setup.eventStoreHash, setup.evaluationAsOfDate);
    expect(panel.patient_priorities[0]!.patient_priority_score).toBe(
      setup.panel.patient_priorities[0]!.patient_priority_score,
    );
  });

  it("MP-06: input ordering does not change the priority panel", () => {
    const setup = mariaPrioritySetup();
    const forward = computePanelPriorities({
      patient_ids: [setup.patientId],
      gaps: setup.gaps,
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
    });
    const reverse = computePanelPriorities({
      patient_ids: [setup.patientId],
      gaps: [...setup.gaps].reverse(),
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
    });
    expect(reverse).toEqual(forward);
  });

  it("MP-07: adding an unaffected patient leaves existing scores unchanged", () => {
    const setup = mariaPrioritySetup();
    const withOther = computePanelPriorities({
      patient_ids: [setup.patientId, "patient-with-no-gaps"],
      gaps: setup.gaps,
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
    });
    const maria = withOther.patient_priorities.find((patient) => patient.patient_id === setup.patientId);
    expect(maria?.patient_priority_score).toBe(setup.panel.patient_priorities[0]!.patient_priority_score);
    expect(withOther.patient_priorities.find((patient) => patient.patient_id === "patient-with-no-gaps")?.priority_band).toBe("NONE");
  });
});

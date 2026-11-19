import { describe, expect, it } from "vitest";
import { evaluateGapEligibility, priorityPanelIsFresh } from "@/lib/priority";
import { mariaPrioritySetup } from "@/tests/support/priority";

describe("priority staleness", () => {
  it("detects a changed verified-gap set", () => {
    const setup = mariaPrioritySetup();
    expect(priorityPanelIsFresh(setup.panel, setup.gaps)).toBe(true);
    expect(priorityPanelIsFresh(setup.panel, setup.gaps.slice(1))).toBe(false);
  });

  it("carries the frozen versions and input-set hash", () => {
    const setup = mariaPrioritySetup();
    const patient = setup.panel.patient_priorities[0]!;
    expect(setup.panel.priority_version).toBe("priority-v1");
    expect(setup.panel.evidence_version).toBe("evidence-v1");
    expect(setup.panel.detector_version).toBe("gaps-v1");
    expect(setup.panel.verified_gap_set_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(patient.verified_gap_set_hash).toBe(setup.panel.verified_gap_set_hash);
    expect(patient.evaluation_as_of_date).toBe("2026-06-05");
  });

  it("rejects a gap from a different event-store snapshot", () => {
    const setup = mariaPrioritySetup();
    const result = evaluateGapEligibility(setup.gaps[0], {
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: "different-store",
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.ineligible.failure_code).toBe("PR-011");
  });

  it("produces a different hash when a gap changes", () => {
    const setup = mariaPrioritySetup();
    const changed = JSON.parse(JSON.stringify(setup.gaps)) as typeof setup.gaps;
    changed[0]!.gap_id = "changed-gap-id";
    changed[0]!.candidate.gap_id = "changed-gap-id";
    expect(priorityPanelIsFresh(setup.panel, changed)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { buildQueue } from "@/lib/priority";
import { mariaPrioritySetup, scoreWith } from "@/tests/support/priority";

describe("priority demographic invariance", () => {
  it("MP-05: changing name, age, and sex does not change score or rank", () => {
    const setup = mariaPrioritySetup();
    const original = buildQueue(setup.panel, setup.gaps, [
      { patient_id: setup.patientId, display_name: "Maria Chen" },
    ]);
    const altered = buildQueue(setup.panel, setup.gaps, [
      { patient_id: setup.patientId, display_name: "David Brooks" },
    ]);
    expect(altered[0]!.patient_priority_score).toBe(original[0]!.patient_priority_score);
    expect(altered[0]!.rank).toBe(original[0]!.rank);
    expect(altered[0]!.priority_band).toBe(original[0]!.priority_band);
    expect(altered[0]!.headline).toBe(original[0]!.headline);
    expect(altered[0]!.top_gap).toEqual(original[0]!.top_gap);
  });

  it("does not accept demographics as priority inputs", () => {
    const setup = mariaPrioritySetup();
    const serialized = JSON.stringify(setup.panel);
    for (const forbidden of ["display_name", "sex", "age", "race", "ethnicity", "zip", "insurance", "income", "diagnosis", "provider"]) {
      expect(serialized.includes(`"${forbidden}"`)).toBe(false);
    }
  });

  it("remains identical when patient labels are reordered", () => {
    const setup = mariaPrioritySetup();
    const first = scoreWith(setup.gaps, setup.patientId, setup.eventStoreHash, setup.evaluationAsOfDate);
    const second = scoreWith(
      [...setup.gaps].sort((left, right) => (left.gap_id < right.gap_id ? 1 : -1)),
      setup.patientId,
      setup.eventStoreHash,
      setup.evaluationAsOfDate,
    );
    expect(second.patient_priorities[0]!.patient_priority_score).toBe(
      first.patient_priorities[0]!.patient_priority_score,
    );
  });
});

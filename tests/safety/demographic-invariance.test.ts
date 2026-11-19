import { describe, expect, it } from "vitest";
import { buildQueue } from "@/lib/priority";
import { mariaPrioritySetup } from "@/tests/support/priority";
import { loadDemoCache } from "@/lib/cache/validate";

describe("demographic invariance", () => {
  it("does not change score, band, or headline when the patient label changes", () => {
    const setup = mariaPrioritySetup();
    const original = buildQueue(setup.panel, setup.gaps, [{ patient_id: setup.patientId, display_name: "Maria Chen" }]);
    const altered = buildQueue(setup.panel, setup.gaps, [{ patient_id: setup.patientId, display_name: "Jamal Okafor" }]);
    expect(altered[0]?.patient_priority_score).toBe(original[0]?.patient_priority_score);
    expect(altered[0]?.priority_band).toBe(original[0]?.priority_band);
    expect(altered[0]?.headline).toBe(original[0]?.headline);
    expect(altered[0]?.top_gap).toEqual(original[0]?.top_gap);
  });

  it("keeps demographic fields out of the priority contract", () => {
    const setup = mariaPrioritySetup();
    const serialized = JSON.stringify(setup.panel);
    for (const forbidden of ["sex", "age", "race", "ethnicity", "zip", "insurance", "income"]) {
      expect(serialized).not.toContain(`"${forbidden}"`);
    }
  });

  it("scores identical evidence identically regardless of patient identity", () => {
    const setup = mariaPrioritySetup();
    const shifted = setup.gaps.map((gap) => ({ ...gap, patient_id: "22222222-2222-5222-8222-222222222222" }));
    const left = setup.panel.patient_priorities[0]?.patient_priority_score;
    const right = buildQueue(setup.panel, shifted, [
      { patient_id: "22222222-2222-5222-8222-222222222222", display_name: "Patient B" },
    ])[0]?.patient_priority_score;
    expect(right).toBe(left);
  });

  it("has no demographic-conditioned branches in the frozen priority artifacts", () => {
    const cache = loadDemoCache();
    for (const priority of cache.priorities.patient_priorities) {
      const serialized = JSON.stringify(priority);
      expect(serialized).not.toMatch(/display_name|sex|race|ethnicity|zip|insurance/);
    }
  });
});

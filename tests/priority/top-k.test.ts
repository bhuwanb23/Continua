import { describe, expect, it } from "vitest";
import { selectTopK, type PatientInterventionPriority } from "@/lib/priority";
import { mariaPrioritySetup } from "@/tests/support/priority";

function ranked(id: string, rank: number): PatientInterventionPriority {
  return {
    schema_version: "patient-priority-v1",
    patient_id: id,
    patient_priority_score: 81 - rank,
    priority_band: "P1",
    rank,
    breakdown: {
      top_gap_id: `gap-${id}`,
      top_gap_raw: 1.2,
      top_gap_overdue_days: 10,
      verified_gap_count: 1,
      secondary_gap_count: 0,
      secondary_raw_sum: 0,
      secondary_factor: 0.1,
      secondary_bonus: 0,
      patient_raw_score: 1.2,
    },
    priority_version: "priority-v1",
    verified_gap_set_hash: "hash",
    evaluation_as_of_date: "2026-06-05",
  };
}

describe("Top-K queue selection", () => {
  it("selects the first K ranked patients", () => {
    const patients = Array.from({ length: 8 }, (_, index) => ranked(`p-${index}`, index + 1));
    expect(selectTopK(patients, 5).map((item) => item.patient_id)).toEqual([
      "p-0",
      "p-1",
      "p-2",
      "p-3",
      "p-4",
    ]);
  });

  it("returns all available items when K exceeds the ranked panel", () => {
    const setup = mariaPrioritySetup();
    expect(selectTopK(setup.panel.patient_priorities, 5)).toHaveLength(1);
  });

  it("supports the full safe K range", () => {
    const patients = Array.from({ length: 80 }, (_, index) => ranked(`p-${index}`, index + 1));
    expect(selectTopK(patients, 1)).toHaveLength(1);
    expect(selectTopK(patients, 80)).toHaveLength(80);
  });

  it("rejects K outside 1–80", () => {
    expect(() => selectTopK([], 0)).toThrow();
    expect(() => selectTopK([], 81)).toThrow();
    expect(() => selectTopK([], 2.5)).toThrow();
  });
});

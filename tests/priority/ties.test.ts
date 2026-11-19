import { describe, expect, it } from "vitest";
import { comparePatientPriority, rankPatientPriorities, type PatientInterventionPriority } from "@/lib/priority";

function patient(
  patientId: string,
  score: number,
  options: { topRaw?: number; overdue?: number; count?: number } = {},
): PatientInterventionPriority {
  return {
    schema_version: "patient-priority-v1",
    patient_id: patientId,
    patient_priority_score: score,
    priority_band: score >= 80 ? "P1" : score >= 60 ? "P2" : score >= 35 ? "P3" : "P4",
    rank: null,
    breakdown: {
      top_gap_id: `gap-${patientId}`,
      top_gap_raw: options.topRaw ?? 1,
      top_gap_overdue_days: options.overdue ?? 0,
      verified_gap_count: options.count ?? 1,
      secondary_gap_count: Math.max(0, (options.count ?? 1) - 1),
      secondary_raw_sum: 0,
      secondary_factor: 0.1,
      secondary_bonus: 0,
      patient_raw_score: score / 100 * 1.8,
    },
    priority_version: "priority-v1",
    verified_gap_set_hash: "hash",
    evaluation_as_of_date: "2026-06-05",
  };
}

describe("deterministic priority ties", () => {
  it("breaks equal scores by top-gap raw", () => {
    expect(comparePatientPriority(patient("a", 80, { topRaw: 1.3 }), patient("b", 80, { topRaw: 1.2 }))).toBeLessThan(0);
  });

  it("then breaks by top-gap overdue days", () => {
    expect(
      comparePatientPriority(patient("a", 80, { overdue: 40 }), patient("b", 80, { overdue: 10 })),
    ).toBeLessThan(0);
  });

  it("then breaks by verified gap count", () => {
    expect(comparePatientPriority(patient("a", 80, { count: 3 }), patient("b", 80, { count: 1 }))).toBeLessThan(0);
  });

  it("finally breaks by patient id ascending", () => {
    expect(comparePatientPriority(patient("a", 80), patient("b", 80))).toBeLessThan(0);
    expect(comparePatientPriority(patient("b", 80), patient("a", 80))).toBeGreaterThan(0);
  });

  it("assigns contiguous ranks without changing relative order", () => {
    const ranked = rankPatientPriorities([patient("c", 60), patient("b", 80), patient("a", 80)]);
    expect(ranked.map((item) => [item.patient_id, item.rank])).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });
});

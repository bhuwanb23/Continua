import { describe, expect, it } from "vitest";
import type { PatientInterventionPriority } from "@/lib/priority/types";
import {
  computePanelPriorities,
  DEFAULT_PRIORITY_CONFIG,
  filterEligibleGaps,
  normalizeScore,
  comparePatientPriority,
  buildQueue,
} from "@/lib/priority";
import { assertQueueIntegrity, assertScoreInRange } from "@/lib/reliability/assertions";
import { mariaPrioritySetup } from "@/tests/support/priority";

const setup = mariaPrioritySetup();
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function tiedPatient(patientId: string): PatientInterventionPriority {
  return {
    patient_id: patientId,
    rank: null,
    patient_priority_score: 50,
    priority_band: "P2",
    breakdown: {
      top_gap_id: "gap",
      top_gap_raw: 0.5,
      top_gap_overdue_days: 10,
      secondary_gap_count: 0,
      verified_gap_count: 1,
      secondary_bonus: 0,
      patient_raw_score: 0.5,
    },
  } as unknown as PatientInterventionPriority;
}

describe("priority reliability", () => {
  it("handles a zero-gap panel without fabricating ranks", () => {
    const panel = computePanelPriorities({
      patient_ids: [setup.patientId],
      gaps: [],
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
    });
    expect(panel.patient_priorities).toHaveLength(1);
    expect(panel.patient_priorities[0]?.rank).toBeNull();
    expect(panel.patient_priorities[0]?.priority_band).toBe("NONE");
  });

  it("keeps the one-gap Maria panel valid", () => {
    const panel = computePanelPriorities({
      patient_ids: [setup.patientId],
      gaps: [setup.gaps[0]!],
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
    });
    expect(panel.patient_priorities[0]?.rank).toBe(1);
    expect(() => assertScoreInRange(panel.patient_priorities[0]?.patient_priority_score, "score")).not.toThrow();
  });

  it("rejects malformed and stale gaps instead of ranking them", () => {
    const filtered = filterEligibleGaps(
      [
        { ...clone(setup.gaps[0]!), patient_id: "not-a-patient" } as never,
        { ...clone(setup.gaps[1]!), grounded: false } as never,
      ],
      {
        evaluation_as_of_date: setup.evaluationAsOfDate,
        event_store_hash: setup.eventStoreHash,
      },
    );
    expect(filtered.eligible).toHaveLength(0);
    expect(filtered.ineligible.length).toBe(2);
  });

  it("throws on NaN, Infinity, and negative arithmetic", () => {
    expect(() => normalizeScore(Number.NaN, 1)).toThrow();
    expect(() => normalizeScore(Number.POSITIVE_INFINITY, 1)).toThrow();
    expect(() => normalizeScore(-1, 1)).toThrow();
    expect(() => normalizeScore(1, 0)).toThrow();
  });

  it("rejects out-of-range display scores", () => {
    expect(() => assertScoreInRange(101, "score")).toThrow(/between 0 and 100/);
    expect(() => assertScoreInRange(-1, "score")).toThrow(/between 0 and 100/);
    expect(() => assertScoreInRange(Number.NaN, "score")).toThrow(/finite/);
  });

  it("orders ten identical-priority patients deterministically 100 times", () => {
    const patients = Array.from({ length: 10 }, (_, index) =>
      tiedPatient(`00000000-0000-5000-8000-${String(index).padStart(12, "0")}`),
    );
    const expected = [...patients].sort(comparePatientPriority).map((patient) => patient.patient_id);
    for (let run = 0; run < 100; run += 1) {
      const shuffled = [...patients].reverse().slice(run % 10).concat([...patients].reverse().slice(0, run % 10));
      const actual = [...shuffled].sort(comparePatientPriority).map((patient) => patient.patient_id);
      expect(actual).toEqual(expected);
    }
  });

  it("keeps the frozen queue order and bounded scores", () => {
    const queue = buildQueue(setup.panel, setup.gaps, [
      { patient_id: setup.patientId, display_name: "Maria Chen" },
    ]);
    expect(() => assertQueueIntegrity(queue)).not.toThrow();
    expect(queue[0]?.patient_priority_score).toBeLessThanOrEqual(100);
    expect(queue[0]?.patient_priority_score).toBeGreaterThanOrEqual(0);
  });

  it("is unaffected by demographic attributes", () => {
    const attributes = { age: 81, sex: "M", primary_diagnosis: "cardiology", name: "Other Person" };
    const panel = computePanelPriorities({
      patient_ids: [setup.patientId],
      gaps: setup.gaps.map((gap) => ({ ...gap, ...attributes })) as never,
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
    });
    expect(panel.patient_priorities[0]?.patient_priority_score).toBe(
      setup.panel.patient_priorities[0]?.patient_priority_score,
    );
    expect(panel.patient_priorities[0]?.rank).toBe(setup.panel.patient_priorities[0]?.rank);
  });

  it("uses the frozen priority config without a special case", () => {
    expect(DEFAULT_PRIORITY_CONFIG.severity_weights.high).toBeGreaterThan(
      DEFAULT_PRIORITY_CONFIG.severity_weights.medium,
    );
    expect(DEFAULT_PRIORITY_CONFIG.secondary_bonus_cap).toBeLessThan(1);
  });
});

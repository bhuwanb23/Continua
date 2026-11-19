import { describe, expect, it } from "vitest";
import {
  computePatientPriority,
  createPriorityContext,
  DEFAULT_PRIORITY_CONFIG,
  type GapInterventionPriority,
} from "@/lib/priority";
import { mariaPrioritySetup } from "@/tests/support/priority";

function fakeGap(id: string, patientId: string, raw: number, overdue = 10): GapInterventionPriority {
  return {
    schema_version: "gap-priority-v1",
    gap_id: id,
    patient_id: patientId,
    gap_type: "missed_followup",
    severity: "high",
    raw_score: raw,
    gap_priority_score: Math.round((raw / 1.5) * 100),
    priority_band: "P1",
    breakdown: {
      severity: "high",
      severity_weight: 1,
      temporal_factor: 1,
      temporal_bucket: "overdue_8_30",
      overdue_days: overdue,
      window_days: 45,
      overdue_ratio: 0.2,
      actionability_class: "direct_coordinator_action",
      actionability_weight: 1,
    },
    priority_version: "priority-v1",
    evidence_version: "evidence-v1",
    detector_version: "gaps-v1",
    verified_gap_set_hash: "hash",
    evaluation_as_of_date: "2026-06-05",
  };
}

function context() {
  return createPriorityContext([], {
    evaluation_as_of_date: "2026-06-05",
    verified_gap_set_hash: "hash",
  });
}

describe("patient priority aggregation", () => {
  it("matches Maria's deterministic patient score", () => {
    const setup = mariaPrioritySetup();
    const maria = setup.panel.patient_priorities[0]!;
    expect(maria.patient_priority_score).toBe(69);
    expect(maria.priority_band).toBe("P2");
    expect(maria.breakdown.top_gap_raw).toBe(1.15);
    expect(maria.breakdown.secondary_raw_sum).toBe(0.874125);
    expect(maria.breakdown.secondary_bonus).toBe(0.087413);
    expect(maria.breakdown.patient_raw_score).toBe(1.237413);
  });

  it("gives a patient with no verified gaps NONE, not a low rank", () => {
    const result = computePatientPriority("patient-empty", [], context());
    expect(result.patient_priority_score).toBe(0);
    expect(result.priority_band).toBe("NONE");
    expect(result.rank).toBeNull();
    expect(result.breakdown.verified_gap_count).toBe(0);
  });

  it("lets the top gap dominate and caps all secondary gaps", () => {
    const patientId = "patient-many";
    const strong = fakeGap("strong", patientId, 1.4);
    const weak = Array.from({ length: 20 }, (_, index) => fakeGap(`weak-${index}`, patientId, 0.3));
    const result = computePatientPriority(patientId, [strong, ...weak], context());
    expect(result.breakdown.secondary_bonus).toBe(DEFAULT_PRIORITY_CONFIG.secondary_bonus_cap);
    expect(result.breakdown.patient_raw_score).toBe(1.7);
    expect(result.patient_priority_score).toBe(94);
  });

  it("does not let twenty weak gaps overtake one serious gap", () => {
    const manyWeak = computePatientPriority(
      "patient-weak",
      Array.from({ length: 20 }, (_, index) => fakeGap(`weak-${index}`, "patient-weak", 0.3)),
      context(),
    );
    const oneSerious = computePatientPriority("patient-serious", [fakeGap("strong", "patient-serious", 1.4)], context());
    expect(manyWeak.patient_priority_score).toBeLessThan(oneSerious.patient_priority_score);
  });
});

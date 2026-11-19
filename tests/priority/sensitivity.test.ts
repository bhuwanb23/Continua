import { describe, expect, it } from "vitest";
import {
  computePanelPriorities,
  computeGapPriority,
  createPriorityContext,
  DEFAULT_PRIORITY_CONFIG,
  mergePriorityConfig,
} from "@/lib/priority";
import { executePriorityRun } from "@/scripts/lib/priority-run";
import { runPrioritySensitivity } from "@/scripts/lib/priority-sensitivity";
import { priorityOfType, mariaPrioritySetup } from "@/tests/support/priority";

describe("priority sensitivity", () => {
  it("rejects invalid perturbation configurations", () => {
    expect(() =>
      mergePriorityConfig(DEFAULT_PRIORITY_CONFIG, {
        temporal_thresholds: { overdue_1_7_max: 40, overdue_8_30_max: 30 },
      }),
    ).toThrow(/non-decreasing/);
    expect(() => mergePriorityConfig(DEFAULT_PRIORITY_CONFIG, { bands: { P1_min: 30 } })).toThrow(
      /strictly descending/,
    );
  });

  it("changes a gap score when a published weight changes", () => {
    const setup = mariaPrioritySetup();
    const gap = setup.gaps.find((item) => item.gap_type === "duplicate_test")!;
    const baseline = priorityOfType(setup.gapPriorities, "duplicate_test");
    const config = mergePriorityConfig(DEFAULT_PRIORITY_CONFIG, {
      actionability_weights: { duplicate_test: 0.9775 },
    });
    const context = createPriorityContext(setup.gaps, {
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
      config,
    });
    expect(computeGapPriority(gap, context).gap_priority_score).toBeGreaterThan(
      baseline.gap_priority_score,
    );
  });

  it("keeps the Top-5 stable across the frozen perturbation suite", () => {
    const run = executePriorityRun({ runId: "priority-sensitivity-test", partition: "all" });
    const sensitivity = runPrioritySensitivity(run);
    expect(sensitivity.variant_count).toBe(8);
    expect(sensitivity.frozen_perturbation_suite).toBe(true);
    expect(sensitivity.mean_top5_retention).toBeGreaterThanOrEqual(0.8);
    expect(sensitivity.min_top5_retention).toBeGreaterThanOrEqual(0.6);
    expect(sensitivity.rank1_changes).toBeLessThanOrEqual(2);
  });

  it("never normalizes against the observed panel maximum", () => {
    const setup = mariaPrioritySetup();
    const alone = computePanelPriorities({
      patient_ids: [setup.patientId],
      gaps: setup.gaps,
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
    });
    const withOthers = computePanelPriorities({
      patient_ids: [setup.patientId, "other-a", "other-b"],
      gaps: setup.gaps,
      evaluation_as_of_date: setup.evaluationAsOfDate,
      event_store_hash: setup.eventStoreHash,
    });
    expect(withOthers.patient_priorities.find((patient) => patient.patient_id === setup.patientId)?.patient_priority_score).toBe(
      alone.patient_priorities[0]?.patient_priority_score,
    );
  });
});

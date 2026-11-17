import { GAP_TARGETS } from "./config";
import type { GapType, ScenarioId, SyntheticPatient } from "./types";

export interface PlannedGap {
  gapType: GapType;
  scenarioId: ScenarioId;
}

export interface PatientPlan {
  patientIndex: number;
  gapScenarios: PlannedGap[];
  negativeScenario: ScenarioId | null;
}

const THREE_GAP = ["missed_followup", "duplicate_test", "med_monitoring"] as const;

function threeGapPlan(index: number): PlannedGap[] {
  return [
    { gapType: "missed_followup", scenarioId: index === 0 ? "T02" : "T02" },
    { gapType: "duplicate_test", scenarioId: "T04" },
    { gapType: "med_monitoring", scenarioId: "T06" },
  ];
}

const NEGATIVE_FAMILY_ORDER: ScenarioId[] = [
  "HN-01", "HN-01", "HN-01",
  "HN-03", "HN-03", "HN-03",
  "HN-04", "HN-04", "HN-04",
  "HN-05", "HN-05", "HN-05",
  "HN-06", "HN-06", "HN-06",
  "HN-07", "HN-07", "HN-07",
  "HN-08", "HN-08", "HN-08",
  "HN-09", "HN-09", "HN-09",
  "HN-10", "HN-10", "HN-10",
  "HN-12", "HN-12",
  "HN-13", "HN-13",
  "HN-14", "HN-14",
  "HN-15", "HN-15",
];

export function buildPlan(patients: SyntheticPatient[]): PatientPlan[] {
  if (patients.length !== 80) {
    throw new Error(`Expected 80 patients, received ${patients.length}`);
  }

  const plans: PatientPlan[] = [];

  for (let index = 0; index < 80; index += 1) {
    let gapScenarios: PlannedGap[] = [];
    let negativeScenario: ScenarioId | null = null;

    if (index === 0) {
      gapScenarios = threeGapPlan(index);
    } else if (index <= 5) {
      gapScenarios = threeGapPlan(index);
    } else if (index <= 9) {
      gapScenarios = [
        { gapType: "missed_followup", scenarioId: "T02" },
        { gapType: "duplicate_test", scenarioId: "T04" },
      ];
    } else if (index <= 13) {
      gapScenarios = [
        { gapType: "missed_followup", scenarioId: "T02" },
        { gapType: "med_monitoring", scenarioId: "T06" },
      ];
    } else if (index <= 17) {
      gapScenarios = [
        { gapType: "duplicate_test", scenarioId: "T04" },
        { gapType: "med_monitoring", scenarioId: "T06" },
      ];
    } else if (index <= 29) {
      const scenarioId: ScenarioId =
        index === 18 || index === 19 ? "HN-02" : index === 20 || index === 21 ? "HN-11" : "T02";
      gapScenarios = [{ gapType: "missed_followup", scenarioId }];
    } else if (index <= 35) {
      gapScenarios = [{ gapType: "duplicate_test", scenarioId: "T04" }];
    } else if (index <= 41) {
      gapScenarios = [{ gapType: "med_monitoring", scenarioId: "T06" }];
    } else {
      const negativeIndex = index - 42;
      negativeScenario = NEGATIVE_FAMILY_ORDER[negativeIndex] ?? "CLEAN";
    }

    plans.push({ patientIndex: index, gapScenarios, negativeScenario });
  }

  const counts: Record<GapType, number> = {
    missed_followup: 0,
    duplicate_test: 0,
    med_monitoring: 0,
  };
  for (const plan of plans) {
    for (const gap of plan.gapScenarios) {
      counts[gap.gapType] += 1;
    }
  }

  for (const gapType of THREE_GAP) {
    if (counts[gapType] !== GAP_TARGETS[gapType]) {
      throw new Error(
        `Gap plan mismatch for ${gapType}: expected ${GAP_TARGETS[gapType]}, got ${counts[gapType]}`,
      );
    }
  }

  return plans;
}

import { describe, expect, it } from "vitest";
import { validatePartitions } from "@/lib/evaluation/validate-benchmark";
import { loadBenchmarkBundle } from "../support/evaluation";

describe("frozen patient partitions", () => {
  const bundle = loadBenchmarkBundle();

  it("covers every patient exactly once with zero overlap", () => {
    const patientIds = bundle.patients.map((patient) => patient.patient_id);
    const result = validatePartitions(bundle.partitions.dev, bundle.partitions.final, patientIds);
    expect(result.failures).toEqual([]);
    expect(bundle.partitions.counts).toEqual({ dev: 20, final: 60, overlap: 0 });
  });

  it("keeps Maria in dev and never reports her as final evidence", () => {
    const maria = bundle.patients.find((patient) => patient.fixture_key === "P-001-maria");
    expect(maria).toBeDefined();
    expect(maria && bundle.partitions.assignment[maria.patient_id]).toBe("dev");
  });

  it("preserves positivity, gap types, difficulty, and cohorts across both partitions", () => {
    for (const name of ["dev", "final"] as const) {
      const contract = bundle.partitions.partitions[name];
      expect(contract.counts.positive_patients).toBeGreaterThan(0);
      expect(contract.counts.negative_patients).toBeGreaterThan(0);
      expect(contract.counts.gap_types.missed_followup).toBeGreaterThan(0);
      expect(contract.counts.gap_types.duplicate_test).toBeGreaterThan(0);
      expect(contract.counts.gap_types.med_monitoring).toBeGreaterThan(0);
      expect(Object.values(contract.counts.difficulties).every((count) => count > 0)).toBe(true);
      expect(contract.counts.cohorts.cardio).toBeGreaterThan(0);
      expect(contract.counts.cohorts.metabolic).toBeGreaterThan(0);
      expect(contract.counts.cohorts.mixed).toBeGreaterThan(0);
      expect(contract.counts.cohorts.oncology).toBeGreaterThan(0);
    }
  });

  it("matches the partition contract to the manifest", () => {
    expect(bundle.manifest.partitions.dev).toBe(bundle.partitions.dev.length);
    expect(bundle.manifest.partitions.final).toBe(bundle.partitions.final.length);
    expect(bundle.manifest.partitions.overlap).toBe(0);
  });
});

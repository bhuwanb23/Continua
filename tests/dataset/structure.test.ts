import { describe, expect, it } from "vitest";
import { generateDataset } from "@/lib/generator";
import { COHORT_COUNTS, GAP_TARGETS } from "@/lib/generator/config";

const dataset = generateDataset();
const { patients, providers, records, groundTruth, negativeManifest } = dataset;

describe("dataset structure", () => {
  it("has exactly 80 patients", () => {
    expect(patients).toHaveLength(80);
  });

  it("stays inside the document band", () => {
    expect(records.length).toBeGreaterThanOrEqual(400);
    expect(records.length).toBeLessThanOrEqual(600);
  });

  it("has 20-30 providers", () => {
    expect(providers.length).toBeGreaterThanOrEqual(20);
    expect(providers.length).toBeLessThanOrEqual(30);
  });

  it("uses unique machine ids and fixture keys", () => {
    expect(new Set(patients.map((p) => p.patient_id)).size).toBe(patients.length);
    expect(new Set(patients.map((p) => p.fixture_key)).size).toBe(patients.length);
    expect(new Set(records.map((r) => r.source_doc_id)).size).toBe(records.length);
    expect(new Set(records.map((r) => r.fixture_key)).size).toBe(records.length);
  });

  it("resolves every reference", () => {
    const patientIds = new Set(patients.map((p) => p.patient_id));
    const recordIds = new Set(records.map((r) => r.source_doc_id));
    for (const record of records) expect(patientIds.has(record.patient_id)).toBe(true);
    for (const gap of groundTruth) {
      expect(patientIds.has(gap.patient_id)).toBe(true);
      for (const docId of gap.source_doc_ids) expect(recordIds.has(docId)).toBe(true);
    }
  });

  it("keeps every source span verbatim in its document", () => {
    const recordById = new Map(records.map((record) => [record.source_doc_id, record]));
    for (const event of dataset.truthEvents) {
      const record = recordById.get(event.source_doc_id);
      expect(record).toBeDefined();
      expect(record?.text).toContain(event.source_span);
    }
  });

  it("hits the frozen cohort split", () => {
    const counts = { oncology: 0, cardio: 0, metabolic: 0, mixed: 0 };
    for (const patient of patients) counts[patient.cohort] += 1;
    expect(counts).toEqual(COHORT_COUNTS);
  });

  it("hits the frozen gap distribution", () => {
    expect(groundTruth).toHaveLength(66);
    for (const [type, expected] of Object.entries(GAP_TARGETS)) {
      expect(groundTruth.filter((gap) => gap.gap_type === type)).toHaveLength(expected);
    }
  });

  it("keeps positive and negative patients in band", () => {
    const positive = new Set(groundTruth.map((gap) => gap.patient_id)).size;
    expect(positive).toBeGreaterThanOrEqual(35);
    expect(positive).toBeLessThanOrEqual(45);
    expect(patients.length - positive).toBeGreaterThanOrEqual(35);
    expect(patients.length - positive).toBeLessThanOrEqual(45);
  });

  it("has at least 10 hard-negative families", () => {
    const families = new Set(negativeManifest.map((entry) => entry.scenario_id));
    expect(families.size).toBeGreaterThanOrEqual(10);
  });

  it("marks all data synthetic with consistent provenance", () => {
    for (const record of records) {
      expect(record.synthetic).toBe(true);
      expect(record.dataset_version).toBe("continua-synth-v1");
      expect(record.generator_version).toBe("generator-v1");
      expect(record.content_hash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("spreads sex, age, difficulty, and document types", () => {
    expect(new Set(patients.map((p) => p.sex)).size).toBeGreaterThanOrEqual(2);
    expect(Math.min(...patients.map((p) => p.demo_age))).toBeLessThan(45);
    expect(Math.max(...patients.map((p) => p.demo_age))).toBeGreaterThan(70);
    expect(new Set(patients.map((p) => p.difficulty)).size).toBe(3);
    expect(new Set(records.map((r) => r.doc_type)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(providers.map((p) => p.specialty)).size).toBe(8);
  });
});

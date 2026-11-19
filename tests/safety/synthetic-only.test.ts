import { describe, expect, it } from "vitest";
import { loadDemoCache } from "@/lib/cache/validate";
import {
  loadDatasetProvenance,
  verifyCacheSyntheticBoundary,
  verifyDatasetProvenance,
} from "@/lib/safety/synthetic-only";
import { PHI_BOUNDARY, REAL_PHI_ALLOWED } from "@/lib/safety/data-classification";

describe("synthetic-only boundary", () => {
  it("verifies the frozen dataset provenance", () => {
    const provenance = loadDatasetProvenance();
    expect(provenance.dataset_version).toBe("continua-synth-v1");
    expect(provenance.synthetic).toBe(true);
    expect(provenance.generator_version).toBe("generator-v1");
    expect(provenance.content_hash).toHaveLength(64);
    expect(verifyDatasetProvenance(provenance)).toEqual({ ok: true, failures: [] });
  });

  it("rejects a non-synthetic or unknown dataset", () => {
    const provenance = loadDatasetProvenance();
    const disguised = { ...provenance, synthetic: false };
    expect(verifyDatasetProvenance(disguised).ok).toBe(false);
    const unknown = { ...provenance, dataset_version: "real-ehr-v1" };
    expect(verifyDatasetProvenance(unknown).ok).toBe(false);
    const noHash = { ...provenance, content_hash: "short" };
    expect(verifyDatasetProvenance(noHash).ok).toBe(false);
  });

  it("rejects a cache whose panel or records are not synthetic", () => {
    const provenance = loadDatasetProvenance();
    const base = {
      panelSynthetic: true,
      manifestDatasetVersion: "continua-synth-v1",
      records: [{ synthetic: true, dataset_version: "continua-synth-v1", source_doc_id: "doc" }],
      datasetProvenance: provenance,
    };
    expect(verifyCacheSyntheticBoundary(base).ok).toBe(true);
    expect(verifyCacheSyntheticBoundary({ ...base, panelSynthetic: false }).ok).toBe(false);
    expect(verifyCacheSyntheticBoundary({ ...base, manifestDatasetVersion: "real-ehr-v1" }).ok).toBe(false);
    expect(
      verifyCacheSyntheticBoundary({ ...base, records: [{ synthetic: false, dataset_version: "continua-synth-v1" }] }).ok,
    ).toBe(false);
    expect(
      verifyCacheSyntheticBoundary({ ...base, records: [{ synthetic: true, dataset_version: "real-ehr-v1" }] }).ok,
    ).toBe(false);
  });

  it("confirms every frozen cache record is synthetic and from the frozen dataset", () => {
    const cache = loadDemoCache();
    expect(cache.panel.synthetic).toBe(true);
    expect(cache.manifest.dataset_version).toBe("continua-synth-v1");
    expect(cache.records.length).toBeGreaterThan(0);
    expect(cache.records.every((record) => record.synthetic === true)).toBe(true);
    expect(cache.records.every((record) => record.dataset_version === "continua-synth-v1")).toBe(true);
    const boundary = verifyCacheSyntheticBoundary({
      panelSynthetic: cache.panel.synthetic,
      manifestDatasetVersion: cache.manifest.dataset_version,
      records: cache.records,
      datasetProvenance: loadDatasetProvenance(),
    });
    expect(boundary).toEqual({ ok: true, failures: [] });
  });

  it("declares that real PHI is not allowed", () => {
    expect(REAL_PHI_ALLOWED).toBe(false);
    expect(PHI_BOUNDARY.statement).toBe("Synthetic-data-only MVP. No real PHI processed.");
    expect(PHI_BOUNDARY.prohibited_inputs).toContain("real_patient_records");
  });
});

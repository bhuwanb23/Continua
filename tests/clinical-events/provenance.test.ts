import { describe, expect, it } from "vitest";
import { validateClinicalEvent } from "@/lib/clinical-events";
import type { SourceRecord } from "@/lib/domain";
import { canonicalEvent } from "../support/clinical-events";

const record: SourceRecord = {
  source_doc_id: "doc-1",
  fixture_key: "DOC-1",
  patient_id: "patient-1",
  doc_type: "referral",
  provider: "Dr. Test",
  provider_type: "specialist",
  date: "2026-04-18",
  text: "Referral to Medical Oncology.",
  dataset_version: "continua-synth-v1",
  generator_version: "generator-v1",
  synthetic: true,
};

describe("ClinicalEvent v1 provenance", () => {
  it("accepts exact source ownership and span evidence", () => {
    const result = validateClinicalEvent(canonicalEvent(), { patient_id: "patient-1", records: [record] });
    expect(result.accepted?.source.verification_method).toBe("exact");
    expect(result.rejection).toBeNull();
  });

  it("rejects missing and cross-patient documents", () => {
    expect(validateClinicalEvent(canonicalEvent(), { patient_id: "patient-1", records: [] }).rejection?.code).toBe("CE-004");
    expect(
      validateClinicalEvent(canonicalEvent(), {
        patient_id: "patient-1",
        records: [{ ...record, patient_id: "patient-2" }],
      }).rejection?.code,
    ).toBe("CE-005");
  });

  it("rejects unsupported spans and accepts small fuzzy differences", () => {
    const unsupported = validateClinicalEvent(
      canonicalEvent({ source: { ...canonicalEvent().source, source_span: "Invented oncology fact." } }),
      { patient_id: "patient-1", records: [record] },
    );
    expect(unsupported.rejection?.code).toBe("CE-006");

    const fuzzy = validateClinicalEvent(
      canonicalEvent({
        source: {
          ...canonicalEvent().source,
          source_span: "Referral to Medical Onclogy.",
          verification_method: "fuzzy",
          verification_score: 0.9,
        },
      }),
      { patient_id: "patient-1", records: [record] },
    );
    expect(fuzzy.accepted).not.toBeNull();
  });
});

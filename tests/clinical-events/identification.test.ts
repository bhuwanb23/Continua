import { describe, expect, it } from "vitest";
import { canonicalizeClinicalEvent, canonicalizeClinicalEvents, validateClinicalEvent } from "@/lib/clinical-events";
import { canonicalEvent, TEST_PATIENT_ID, TEST_SOURCE_DOC_ID } from "../support/clinical-events";
import type { SourceRecord } from "@/lib/domain";

const record: SourceRecord = {
  source_doc_id: TEST_SOURCE_DOC_ID,
  fixture_key: "DOC-1",
  patient_id: TEST_PATIENT_ID,
  doc_type: "referral",
  provider: "Dr. Test",
  provider_type: "specialist",
  date: "2026-04-18",
  text: "Referral to Medical Oncology.",
  dataset_version: "continua-synth-v1",
  generator_version: "generator-v1",
  synthetic: true,
};

describe("ClinicalEvent identity and rejection boundaries", () => {
  it("returns a structured rejection for malformed input instead of throwing", () => {
    const result = canonicalizeClinicalEvent({ event_type: "referral", typed: null }, {
      patient_id: TEST_PATIENT_ID,
      records: [record],
    });
    expect(result.accepted).toBeNull();
    expect(result.rejection?.code).toBe("CE-001");
  });

  it("rejects unsupported normalization versions", () => {
    const result = validateClinicalEvent(
      canonicalEvent({ normalization_version: "normalization-v2" }),
      { patient_id: TEST_PATIENT_ID, records: [record] },
    );
    expect(result.rejection?.code).toBe("CE-009");
  });

  it("generates the same identifier independent of candidate array position", () => {
    const candidate = canonicalEvent({ event_id: "" });
    const first = canonicalizeClinicalEvent(candidate, { patient_id: TEST_PATIENT_ID, records: [record] }, 1);
    const second = canonicalizeClinicalEvent(candidate, { patient_id: TEST_PATIENT_ID, records: [record] }, 2);
    expect(first.accepted?.event_id).toBeTruthy();
    expect(first.accepted?.event_id).toBe(second.accepted?.event_id);
  });

  it("rejects offsets that do not identify the recorded source span", () => {
    const result = validateClinicalEvent(
      canonicalEvent({
        source: {
          ...canonicalEvent().source,
          span_start: 0,
          span_end: 5,
        },
      }),
      { patient_id: TEST_PATIENT_ID, records: [record] },
    );
    expect(result.rejection?.code).toBe("CE-006");
  });

  it("does not admit two indistinguishable candidates under one event identity", () => {
    const result = canonicalizeClinicalEvents(
      [canonicalEvent({ event_id: "" }), canonicalEvent({ event_id: "" })],
      { patient_id: TEST_PATIENT_ID, records: [record] },
    );
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected[0]?.code).toBe("CE-010");
  });
});

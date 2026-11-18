import { describe, expect, it } from "vitest";
import { ClinicalEventSchema } from "@/lib/schemas";
import { validateClinicalEvent } from "@/lib/clinical-events";
import type { SourceRecord } from "@/lib/domain";
import { canonicalEvent, TEST_PATIENT_ID, TEST_SOURCE_DOC_ID } from "../support/clinical-events";

const record: SourceRecord = {
  source_doc_id: TEST_SOURCE_DOC_ID,
  fixture_key: "DOC-1",
  patient_id: TEST_PATIENT_ID,
  doc_type: "other",
  provider: "Dr. Test",
  provider_type: "unknown",
  date: "2026-04-18",
  text: "Referral to Medical Oncology.",
  dataset_version: "continua-synth-v1",
  generator_version: "generator-v1",
  synthetic: true,
};

describe("ClinicalEvent dates", () => {
  it("accepts month precision only when storage date is the first", () => {
    const event = canonicalEvent({ date: "2026-04-01", date_precision: "month" });
    expect(validateClinicalEvent(event, { patient_id: TEST_PATIENT_ID, records: [record] }).accepted).not.toBeNull();
    expect(ClinicalEventSchema.safeParse({ ...event, date: "2026-02-30" }).success).toBe(false);
  });

  it("rejects month precision with a day-specific storage date", () => {
    const result = validateClinicalEvent(
      canonicalEvent({ date: "2026-04-18", date_precision: "month" }),
      { patient_id: TEST_PATIENT_ID, records: [record] },
    );
    expect(result.rejection?.code).toBe("CE-003");
  });
});

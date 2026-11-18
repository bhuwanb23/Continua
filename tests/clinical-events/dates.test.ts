import { describe, expect, it } from "vitest";
import { ClinicalEventSchema } from "@/lib/schemas";
import { validateClinicalEvent } from "@/lib/clinical-events";
import type { SourceRecord } from "@/lib/domain";
import { canonicalEvent } from "../support/clinical-events";

const record: SourceRecord = {
  source_doc_id: "doc-1",
  fixture_key: "DOC-1",
  patient_id: "patient-1",
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
    expect(validateClinicalEvent(event, { patient_id: "patient-1", records: [record] }).accepted).not.toBeNull();
    expect(ClinicalEventSchema.safeParse({ ...event, date: "2026-02-30" }).success).toBe(false);
  });

  it("rejects month precision with a day-specific storage date", () => {
    const result = validateClinicalEvent(
      canonicalEvent({ date: "2026-04-18", date_precision: "month" }),
      { patient_id: "patient-1", records: [record] },
    );
    expect(result.rejection?.code).toBe("CE-003");
  });
});

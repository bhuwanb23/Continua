import { describe, expect, it } from "vitest";
import { ClinicalEventSchema } from "@/lib/schemas";
import { canonicalEvent } from "../support/clinical-events";

const payloads = [
  {
    event_type: "referral",
    typed: {
      specialty_raw: "Medical Oncology",
      specialty_normalized: "oncology",
      expected_window_days: 45,
      window_source: "document",
      status: "placed",
    },
  },
  {
    event_type: "consult",
    typed: {
      specialty_raw: "Cardiology",
      specialty_normalized: "cardiology",
      mode: "telehealth",
      completion_status: "completed",
    },
  },
  {
    event_type: "followup",
    typed: { topic: "routine", mode: "phone", status: "completed" },
  },
  {
    event_type: "lab_result",
    typed: {
      test_name_raw: "CBC w/ diff",
      test_code_normalized: "cbc",
      value: null,
      unit: null,
      abnormal: false,
      series_status: "unknown",
    },
  },
  {
    event_type: "imaging",
    typed: {
      modality_raw: "MRI",
      modality_normalized: "mri",
      body_region_raw: "knee",
      body_region_normalized: "knee",
      series_status: "unknown",
    },
  },
  {
    event_type: "medication_start",
    typed: { drug_raw: "metformin 500 mg", drug_normalized: "metformin", dose: "500 mg", reason: null },
  },
  {
    event_type: "medication_stop",
    typed: { drug_raw: "warfarin", drug_normalized: "warfarin", stop_reason: "completed course" },
  },
  {
    event_type: "surgery",
    typed: { procedure_raw: "lumpectomy", procedure_normalized: "lumpectomy", site: "left breast" },
  },
] as const;

describe("ClinicalEvent v1 schema", () => {
  it("accepts every supported event payload", () => {
    for (const payload of payloads) {
      const result = ClinicalEventSchema.safeParse(canonicalEvent(payload as never));
      expect(result.success, payload.event_type).toBe(true);
    }
  });

  it("rejects an event/payload mismatch", () => {
    const result = ClinicalEventSchema.safeParse(
      canonicalEvent({
        event_type: "lab_result",
        typed: {
          specialty_raw: "Oncology",
          specialty_normalized: "oncology",
          expected_window_days: 45,
          window_source: "document",
          status: "placed",
        },
      } as never),
    );
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields and invalid confidence", () => {
    const result = ClinicalEventSchema.safeParse({
      ...canonicalEvent(),
      extraction_confidence: 1.4,
      unexpected: true,
    });
    expect(result.success).toBe(false);
  });
});

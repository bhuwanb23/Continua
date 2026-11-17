import { describe, expect, it } from "vitest";
import { GapSchema, VersionMetadataSchema } from "@/lib/schemas";
import { VERSION_METADATA } from "@/lib/domain/versions";
import { deterministicId } from "@/lib/ids";

const validGap = {
  gap_id: deterministicId("gap", "demo"),
  patient_id: deterministicId("patient", "P-001-maria"),
  gap_type: "missed_followup",
  severity: "high",
  title: "Missed oncology follow-up",
  trigger_event_ids: [deterministicId("event", "r4")],
  window_days: 45,
  overdue_days: 27,
  evidence: [
    {
      doc_id: deterministicId("document", "R4"),
      quoted_span: "Referral to Medical Oncology.",
      event_id: deterministicId("event", "r4"),
    },
  ],
  recommended_coordinator_action: "Verify: contact patient.",
  estimated_impact: "Recovered referral (1)",
  priority_band: "CRITICAL",
  gap_priority_score: 70,
  confidence: 0.96,
  detector_version: "referral_engine_v1",
  grounded: true,
};

describe("T4 schema validation", () => {
  it("accepts a valid gap", () => {
    expect(GapSchema.safeParse(validGap).success).toBe(true);
  });

  it("rejects an invalid gap type", () => {
    const result = GapSchema.safeParse({ ...validGap, gap_type: "unknown_gap" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid priority band", () => {
    const result = GapSchema.safeParse({ ...validGap, priority_band: "SEVERE" });
    expect(result.success).toBe(false);
  });

  it("rejects a bare priority_score field shape", () => {
    const withoutScore = Object.fromEntries(
      Object.entries(validGap).filter(([key]) => key !== "gap_priority_score"),
    );
    const result = GapSchema.safeParse({ ...withoutScore, priority_score: 70 });
    expect(result.success).toBe(false);
  });
});

describe("T8 version manifest", () => {
  it("validates the centralized metadata", () => {
    expect(VersionMetadataSchema.safeParse(VERSION_METADATA).success).toBe(true);
  });

  it("requires every version field", () => {
    const result = VersionMetadataSchema.safeParse({ spec_version: "1.0" });
    expect(result.success).toBe(false);
  });
});

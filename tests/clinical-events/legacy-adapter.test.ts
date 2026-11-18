import { describe, expect, it } from "vitest";
import { canonicalEventToLegacy, legacyEventToCanonical } from "@/lib/clinical-events";
import type { LegacyClinicalEvent } from "@/lib/domain";
import { LegacyClinicalEventSchema } from "@/lib/schemas";
import { TEST_PATIENT_ID, TEST_SOURCE_DOC_ID } from "../support/clinical-events";

function legacy(eventType: LegacyClinicalEvent["event_type"], typed: LegacyClinicalEvent["typed"]): LegacyClinicalEvent {
  return {
    event_id: "00000000-0000-5000-8000-000000000003",
    patient_id: TEST_PATIENT_ID,
    event_type: eventType,
    date: "2026-04-18",
    description: "Documented event",
    provider: "Dr. Test",
    provider_type: "specialist",
    source_doc_id: TEST_SOURCE_DOC_ID,
    source_span: "Documented event",
    confidence: 0.9,
    series_status: "unknown",
    typed,
  };
}

describe("legacy ClinicalEvent compatibility adapter", () => {
  it.each([
    ["imaging", { modality: "MRI", body_region: "left knee" }],
    ["surgery", { procedure: "lumpectomy", site: "left breast", outcome: "completed" }],
    ["followup", { specialty: "oncology", mode: "phone", status: "scheduled" }],
  ] as const)("preserves %s payload values through a compatibility round trip", (eventType, typed) => {
    const canonical = legacyEventToCanonical(legacy(eventType, typed));
    const legacyProjection = canonicalEventToLegacy(canonical);
    expect(LegacyClinicalEventSchema.safeParse(legacyProjection).success).toBe(true);
    const roundTripped = legacyEventToCanonical(legacyProjection);
    expect(roundTripped.typed).toMatchObject(canonical.typed);
  });

  it("preserves the referral window policy source", () => {
    const canonical = legacyEventToCanonical(
      legacy("referral", {
        specialty: "oncology",
        expected_window_days: 30,
        window_source: "benchmark_policy",
        status: "placed",
      }),
    );
    expect(canonical.typed).toMatchObject({ window_source: "benchmark_policy" });
    expect(legacyEventToCanonical(canonicalEventToLegacy(canonical)).typed).toMatchObject({
      window_source: "benchmark_policy",
    });
  });
});

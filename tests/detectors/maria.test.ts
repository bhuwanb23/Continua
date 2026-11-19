import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), "data", "fixtures", "maria-canonical-events.json"), "utf8"),
) as { patient_id: string; events: CanonicalClinicalEvent[] };
const context = createDetectionContext("2026-06-05");

describe("Maria golden case without patient-specific logic", () => {
  it("produces exactly one candidate of each gap type", () => {
    const gaps = detectCandidateGaps(fixture.events, context);
    expect(gaps).toHaveLength(3);
    expect(gaps.map((gap) => gap.gap_type).sort()).toEqual([
      "duplicate_test",
      "med_monitoring",
      "missed_followup",
    ]);
  });

  it("reconstructs the corrected referral semantics", () => {
    const gap = detectCandidateGaps(fixture.events, context).find((candidate) => candidate.gap_type === "missed_followup");
    expect(gap?.metadata.kind).toBe("missed_followup");
    if (gap?.metadata.kind === "missed_followup") {
      expect(gap.metadata.specialty).toBe("oncology");
      expect(gap.metadata.referral_date).toBe("2026-03-25");
      expect(gap.metadata.expected_window_days).toBe(45);
      expect(gap.metadata.due_date).toBe("2026-05-09");
      expect(gap.metadata.overdue_days).toBe(27);
    }
  });

  it("reconstructs the distinct CBC occurrences", () => {
    const gap = detectCandidateGaps(fixture.events, context).find((candidate) => candidate.gap_type === "duplicate_test");
    expect(gap?.metadata.kind).toBe("duplicate_test");
    if (gap?.metadata.kind === "duplicate_test") {
      expect(gap.metadata.normalized_identity).toBe("lab:cbc");
      expect(gap.metadata.days_between).toBe(8);
      expect(gap.metadata.occurrence_count).toBe(2);
      expect(gap.metadata.first_date).toBe("2026-04-20");
      expect(gap.metadata.second_date).toBe("2026-04-28");
    }
  });

  it("reconstructs the metformin monitoring gap", () => {
    const gap = detectCandidateGaps(fixture.events, context).find((candidate) => candidate.gap_type === "med_monitoring");
    expect(gap?.metadata.kind).toBe("med_monitoring");
    if (gap?.metadata.kind === "med_monitoring") {
      expect(gap.metadata.medication).toBe("metformin");
      expect(gap.metadata.monitoring_target).toBe("a1c_or_bmp");
      expect(gap.metadata.due_date).toBe("2026-05-11");
      expect(gap.metadata.overdue_days).toBe(25);
    }
  });

  it("does not infer a tamoxifen gap before its window is due", () => {
    const gaps = detectCandidateGaps(fixture.events, context);
    expect(gaps.some((gap) => gap.gap_type === "med_monitoring" && gap.metadata.kind === "med_monitoring" && gap.metadata.medication === "tamoxifen")).toBe(false);
  });

  it("preserves evidence references that exist in the canonical store", () => {
    const eventIds = new Set(fixture.events.map((event) => event.event_id));
    for (const gap of detectCandidateGaps(fixture.events, context)) {
      expect(gap.patient_id).toBe(fixture.patient_id);
      for (const ref of gap.evidence_refs) expect(eventIds.has(ref.event_id)).toBe(true);
      for (const id of gap.trigger_event_ids) expect(eventIds.has(id)).toBe(true);
    }
  });

  it("is deterministic across repeated runs", () => {
    expect(detectCandidateGaps(fixture.events, context)).toEqual(detectCandidateGaps(fixture.events, context));
  });
});

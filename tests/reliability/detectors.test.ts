import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { stableJson } from "@/lib/reliability/assertions";

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), "data", "fixtures", "maria-canonical-events.json"), "utf8"),
) as { patient_id: string; events: CanonicalClinicalEvent[] };

const cloneEvents = (): CanonicalClinicalEvent[] =>
  JSON.parse(JSON.stringify(fixture.events)) as CanonicalClinicalEvent[];

function labEvents(daysBetween: number, reversed = false): CanonicalClinicalEvent[] {
  const events = cloneEvents();
  const first = events.find((event) => event.event_type === "lab_result")!;
  const second = { ...first, event_id: "00000000-0000-5000-8000-00000000cccc", date: "" };
  const start = new Date(`${first.date}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + daysBetween);
  second.date = start.toISOString().slice(0, 10);
  const pair = [first, second];
  return reversed ? pair.reverse() : pair;
}

describe("detector boundary conditions", () => {
  it("handles zero and one event without crashing", () => {
    const context = createDetectionContext("2026-06-05");
    expect(detectCandidateGaps([], context)).toEqual([]);
    expect(detectCandidateGaps([cloneEvents()[0]!], context)).toEqual([]);
  });

  it("is order-independent for the same event set", () => {
    const context = createDetectionContext("2026-06-05");
    const forward = detectCandidateGaps(cloneEvents(), context);
    const reversed = detectCandidateGaps(cloneEvents().reverse(), context);
    expect(stableJson(forward)).toBe(stableJson(reversed));
  });

  it("does not move the frozen follow-up boundary", () => {
    const due = "2026-05-09";
    expect(detectCandidateGaps(cloneEvents(), createDetectionContext(due)).some((gap) => gap.gap_type === "missed_followup")).toBe(false);
    const after = detectCandidateGaps(cloneEvents(), createDetectionContext("2026-05-10"));
    expect(after.find((gap) => gap.gap_type === "missed_followup")?.temporal_state).toBe("OVERDUE");
  });

  it("does not move the frozen monitoring boundary", () => {
    const due = "2026-05-11";
    expect(detectCandidateGaps(cloneEvents(), createDetectionContext(due)).some((gap) => gap.gap_type === "med_monitoring")).toBe(false);
    const after = detectCandidateGaps(cloneEvents(), createDetectionContext("2026-05-12"));
    expect(after.find((gap) => gap.gap_type === "med_monitoring")?.temporal_state).toBe("OVERDUE");
  });

  it("keeps the duplicate window boundary exact", () => {
    const context = createDetectionContext("2026-06-05");
    const within = detectCandidateGaps(labEvents(13), context).filter((gap) => gap.gap_type === "duplicate_test");
    const onBoundary = detectCandidateGaps(labEvents(14), context).filter((gap) => gap.gap_type === "duplicate_test");
    const outside = detectCandidateGaps(labEvents(15), context).filter((gap) => gap.gap_type === "duplicate_test");
    expect(
      within.some((gap) => gap.metadata.kind === "duplicate_test" && gap.metadata.days_between === 13),
    ).toBe(true);
    expect(
      onBoundary.some((gap) => gap.metadata.kind === "duplicate_test" && gap.metadata.days_between === 14),
    ).toBe(true);
    expect(
      outside.some((gap) => gap.metadata.kind === "duplicate_test" && gap.metadata.days_between === 15),
    ).toBe(false);
  });

  it("produces the same duplicate result regardless of date order", () => {
    const context = createDetectionContext("2026-06-05");
    const forward = detectCandidateGaps(labEvents(8), context);
    const reversed = detectCandidateGaps(labEvents(8, true), context);
    expect(stableJson(forward)).toBe(stableJson(reversed));
  });

  it("rejects an invalid evaluation date instead of guessing", () => {
    expect(() => createDetectionContext("2026-13-40")).toThrow(/Invalid evaluation_as_of_date/);
  });
});

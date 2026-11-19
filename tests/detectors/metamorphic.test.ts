import { describe, expect, it } from "vitest";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { consult, lab, medicationStart, referral } from "../support/detectors";

const context = createDetectionContext("2026-06-05");

function ids(events: Parameters<typeof detectCandidateGaps>[0]) {
  return detectCandidateGaps(events, context).map((candidate) => candidate.gap_id).sort();
}

describe("detector metamorphic invariants", () => {
  it("MR-01: adding an irrelevant event does not change existing gaps", () => {
    const baseline = [referral({ id: "referral", date: "2026-03-01" })];
    const extended = [
      ...baseline,
      consult({ id: "unrelated", date: "2026-05-01", specialty: "cardiology", completion: "completed" }),
    ];
    expect(ids(extended)).toEqual(ids(baseline));
  });

  it("MR-02: reordering input events does not change output", () => {
    const events = [
      referral({ id: "referral", date: "2026-03-01" }),
      lab({ id: "cbc-1", date: "2026-04-20" }),
      lab({ id: "cbc-2", date: "2026-04-28" }),
      medicationStart({ id: "start", date: "2026-01-15" }),
    ];
    expect(ids([...events].reverse())).toEqual(ids(events));
  });

  it("MR-03: duplicating the same canonical occurrence does not create a duplicate-test gap", () => {
    const events = [
      lab({ id: "cbc-a", date: "2026-03-01", value: "WBC 5.8", doc: "doc-a" }),
      lab({ id: "cbc-b", date: "2026-03-01", value: "WBC 5.8", doc: "doc-b" }),
    ];
    expect(ids(events)).toEqual([]);
  });

  it("MR-04: a qualifying follow-up earlier inside the window cannot make a resolved referral unresolved", () => {
    const resolved = [
      referral({ id: "referral", date: "2026-03-01", window: 45 }),
      consult({ id: "consult", date: "2026-03-02", specialty: "oncology" }),
    ];
    expect(ids(resolved)).toEqual([]);
  });

  it("MR-05: increasing overdue duration cannot turn an overdue case into a non-overdue case", () => {
    const events = [referral({ id: "referral", date: "2026-03-01", window: 30 })];
    const earlier = detectCandidateGaps(events, createDetectionContext("2026-04-02"));
    const later = detectCandidateGaps(events, createDetectionContext("2026-06-05"));
    expect(earlier).toHaveLength(1);
    expect(later).toHaveLength(1);
    expect(later[0]?.gap_id).toBe(earlier[0]?.gap_id);
    expect(later[0]?.gap_type).toBe("missed_followup");
    if (later[0]?.metadata.kind === "missed_followup" && earlier[0]?.metadata.kind === "missed_followup") {
      expect(later[0].metadata.overdue_days).toBeGreaterThan(earlier[0].metadata.overdue_days);
    }
  });

  it("MR-06: adding valid monitoring cannot create a monitoring gap", () => {
    const start = medicationStart({ id: "start", date: "2026-01-15" });
    expect(ids([start])).toHaveLength(1);
    expect(ids([start, lab({ id: "a1c", date: "2026-02-15", test: "a1c" })])).toEqual([]);
  });

  it("MR-07: provider display formatting does not enter detector identity", () => {
    const event = referral({ id: "referral", date: "2026-03-01" });
    const formatted = { ...event, provider_display: "Dr. Formatting Difference" } as typeof event;
    expect(ids([formatted])).toEqual(ids([event]));
  });
});

import { describe, expect, it } from "vitest";
import { createDetectionContext } from "@/lib/detectors";
import { followupDetector } from "@/lib/detectors/followup/detector";
import { consult, followup, referral, TEST_PATIENT } from "../support/detectors";

const context = createDetectionContext("2026-06-05");

function detect(events: Parameters<typeof followupDetector.detect>[0]) {
  return followupDetector.detect(events, context);
}

describe("missed specialist follow-up detector", () => {
  it("R-N1: a matching completed specialist visit inside the window closes the referral", () => {
    const events = [
      referral({ id: "referral", date: "2026-03-01", window: 45 }),
      consult({ id: "consult", date: "2026-03-20", specialty: "oncology", completion: "completed" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("R-N2: a wrong-specialty visit does not close the referral", () => {
    const events = [
      referral({ id: "referral", date: "2026-03-01", window: 45, specialty: "oncology" }),
      consult({ id: "consult", date: "2026-03-20", specialty: "cardiology" }),
    ];
    const gaps = detect(events);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.identity.specialty).toBe("oncology");
  });

  it("R-N3: a not-yet-due referral is not a benchmark gap", () => {
    const events = [referral({ id: "referral", date: "2026-05-10", window: 45 })];
    expect(detect(events)).toEqual([]);
  });

  it("R-N4: a completed telehealth consult satisfies the referral", () => {
    const events = [
      referral({ id: "referral", date: "2026-03-01", window: 30, specialty: "cardiology" }),
      consult({ id: "consult", date: "2026-03-10", specialty: "cardiology", mode: "telehealth" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("R-N5: a cancelled referral is not an unresolved referral", () => {
    const events = [referral({ id: "referral", date: "2026-03-01", status: "cancelled" })];
    expect(detect(events)).toEqual([]);
  });

  it("R-N6: a consult before the referral does not satisfy it", () => {
    const events = [
      consult({ id: "early-consult", date: "2026-02-20", specialty: "oncology" }),
      referral({ id: "referral", date: "2026-03-01", window: 45 }),
    ];
    expect(detect(events)).toHaveLength(1);
  });

  it("R-N7: a scheduled follow-up does not count as completion", () => {
    const events = [
      referral({ id: "referral", date: "2026-03-01", window: 45 }),
      followup({ id: "followup", date: "2026-03-20", specialty: "oncology", status: "scheduled" }),
    ];
    expect(detect(events)).toHaveLength(1);
  });

  it("does not treat a completed referral status as unresolved", () => {
    const events = [referral({ id: "referral", date: "2026-03-01", status: "completed" })];
    expect(detect(events)).toEqual([]);
  });

  it("emits one day before due and one day after due with exact boundaries", () => {
    const events = [referral({ id: "referral", date: "2026-05-01", window: 30 })];
    expect(followupDetector.detect(events, createDetectionContext("2026-05-30"))).toEqual([]);
    const after = followupDetector.detect(events, createDetectionContext("2026-06-01"));
    expect(after).toHaveLength(1);
    expect(after[0]?.metadata.kind).toBe("missed_followup");
    if (after[0]?.metadata.kind === "missed_followup") {
      expect(after[0].metadata.due_date).toBe("2026-05-31");
      expect(after[0].metadata.overdue_days).toBe(1);
    }
  });

  it("consolidates overlapping referrals into one coordinator candidate", () => {
    const events = [
      referral({ id: "referral-1", date: "2026-03-01", window: 45 }),
      referral({ id: "referral-2", date: "2026-03-10", window: 45 }),
    ];
    const gaps = detect(events);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.trigger_event_ids).toHaveLength(2);
    expect(gaps[0]?.metadata.kind).toBe("missed_followup");
    if (gaps[0]?.metadata.kind === "missed_followup") {
      expect(gaps[0].metadata.supporting_referral_event_ids).toHaveLength(2);
    }
  });

  it("keeps clearly separate referral episodes separate", () => {
    const events = [
      referral({ id: "referral-1", date: "2026-01-01", window: 30 }),
      referral({ id: "referral-2", date: "2026-05-01", window: 30 }),
    ];
    expect(detect(events)).toHaveLength(2);
  });

  it("preserves trigger and source references for every candidate", () => {
    const events = [referral({ id: "referral", date: "2026-03-01", doc: "referral-doc" })];
    const gap = detect(events)[0];
    expect(gap?.patient_id).toBe(TEST_PATIENT);
    expect(gap?.trigger_event_ids).toHaveLength(1);
    expect(gap?.evidence_refs[0]?.source_doc_id).toBe(events[0]?.source.source_doc_id);
  });
});

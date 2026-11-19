import { describe, expect, it } from "vitest";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { consult, followup, imaging, lab, medicationStart, medicationStop, referral } from "../support/detectors";

const context = createDetectionContext("2026-06-05");

function detect(events: Parameters<typeof detectCandidateGaps>[0]) {
  return detectCandidateGaps(events, context);
}

describe("Phase 6 red-team", () => {
  it("attack A: a wrong specialist does not close the referral", () => {
    const gaps = detect([
      referral({ id: "referral", date: "2026-03-01", specialty: "oncology" }),
      consult({ id: "consult", date: "2026-03-20", specialty: "cardiology" }),
    ]);
    expect(gaps).toHaveLength(1);
  });

  it("attack B: a scheduled visit does not count as completed", () => {
    const gaps = detect([
      referral({ id: "referral", date: "2026-03-01" }),
      followup({ id: "followup", date: "2026-03-20", specialty: "oncology", status: "scheduled" }),
    ]);
    expect(gaps).toHaveLength(1);
  });

  it("attack C/D: one day before due is not overdue; one day after is", () => {
    const events = [referral({ id: "referral", date: "2026-05-01", window: 30 })];
    expect(detectCandidateGaps(events, createDetectionContext("2026-05-30"))).toEqual([]);
    expect(detectCandidateGaps(events, createDetectionContext("2026-06-01"))).toHaveLength(1);
  });

  it("attack E: a weekly CBC series is not a duplicate", () => {
    const gaps = detect([
      lab({ id: "cbc-1", date: "2026-03-01", series_status: "explicit_series" }),
      lab({ id: "cbc-2", date: "2026-03-08", series_status: "explicit_series" }),
      lab({ id: "cbc-3", date: "2026-03-15", series_status: "explicit_series" }),
    ]);
    expect(gaps).toEqual([]);
  });

  it("attack F: one test copied into three documents is not duplicate care", () => {
    const gaps = detect([
      lab({ id: "cbc-a", date: "2026-03-01", value: "same", doc: "doc-a" }),
      lab({ id: "cbc-b", date: "2026-03-01", value: "same", doc: "doc-b" }),
      lab({ id: "cbc-c", date: "2026-03-01", value: "same", doc: "doc-c" }),
    ]);
    expect(gaps).toEqual([]);
  });

  it("attack G: MRI brain and MRI knee are not duplicates", () => {
    const gaps = detect([
      imaging({ id: "brain", date: "2026-03-01", body_region: "brain" }),
      imaging({ id: "knee", date: "2026-03-03", body_region: "knee" }),
    ]);
    expect(gaps).toEqual([]);
  });

  it("attack H: a stopped medication is not a monitoring gap", () => {
    const gaps = detect([
      medicationStart({ id: "start", date: "2026-01-15" }),
      medicationStop({ id: "stop", date: "2026-02-01" }),
    ]);
    expect(gaps).toEqual([]);
  });

  it("attack I: an alias lab closes monitoring", () => {
    const gaps = detect([
      medicationStart({ id: "start", date: "2026-01-15" }),
      lab({ id: "a1c", date: "2026-02-15", test: "Hemoglobin A1c" }),
    ]);
    expect(gaps).toEqual([]);
  });

  it("attack J: 100 input rotations produce identical output", () => {
    const events = [
      referral({ id: "referral", date: "2026-03-01" }),
      consult({ id: "consult", date: "2026-03-10", specialty: "cardiology" }),
      lab({ id: "cbc-1", date: "2026-04-20" }),
      lab({ id: "cbc-2", date: "2026-04-28" }),
      medicationStart({ id: "start", date: "2026-01-15" }),
    ];
    const baseline = JSON.stringify(detect(events));
    for (let shift = 0; shift < 100; shift += 1) {
      const rotated = [...events.slice(shift % events.length), ...events.slice(0, shift % events.length)];
      expect(JSON.stringify(detect(rotated))).toBe(baseline);
    }
  });

  it("attack K/L: no model credentials or wall clock are consulted", () => {
    const events = [referral({ id: "referral", date: "2026-03-01" })];
    const first = detect(events);
    const second = detect(events);
    expect(first).toEqual(second);
    expect(first[0]?.rationale.facts["evaluation_as_of_date"]).toBe("2026-06-05");
  });

  it("never emits diagnosis, treatment, or prescribing language", () => {
    const forbidden = /diagnose|treat|prescribe|discontinue|administer|medically necessary|clinically indicated/i;
    const gaps = detect([
      referral({ id: "referral", date: "2026-03-01" }),
      medicationStart({ id: "start", date: "2026-01-15" }),
      lab({ id: "cbc-1", date: "2026-04-20" }),
      lab({ id: "cbc-2", date: "2026-04-28" }),
    ]);
    expect(gaps.length).toBeGreaterThan(0);
    for (const gap of gaps) {
      expect(gap.recommended_coordinator_action).not.toMatch(forbidden);
      expect(JSON.stringify(gap.rationale)).not.toMatch(forbidden);
    }
  });
});

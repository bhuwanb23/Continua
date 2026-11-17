import { describe, expect, it } from "vitest";
import { deriveGaps } from "@/lib/generator/truth-check";
import { consult, event, imaging, lab, medStart, medStop, referral } from "../support/events";

describe("scenario grammar", () => {
  it("T01 completed referral produces no gap", () => {
    const events = [referral("2026-03-01", 30), consult("2026-03-10", "oncology")];
    expect(deriveGaps(events)).toHaveLength(0);
  });

  it("T02 unresolved referral produces a missed follow-up", () => {
    const events = [
      referral("2026-03-01", 30),
      event({ event_type: "consult", date: "2026-03-08", specialty: "primary_care", typed: { specialty: "primary_care" } }),
    ];
    const gaps = deriveGaps(events);
    expect(gaps.map((gap) => gap.gap_type)).toEqual(["missed_followup"]);
  });

  it("T03 explicit serial testing produces no duplicate gap", () => {
    const events = [
      lab("2026-04-01", "cbc", "explicit_series"),
      lab("2026-04-08", "cbc", "explicit_series"),
      lab("2026-04-15", "cbc", "explicit_series"),
    ];
    expect(deriveGaps(events)).toHaveLength(0);
  });

  it("T04 repeat test inside the window produces a duplicate gap", () => {
    const events = [
      lab("2026-04-01", "cbc"),
      event({ event_type: "lab_result", date: "2026-04-07", typed: { test_name_raw: "cbc", test_name_normalized: "cbc" } }),
    ];
    expect(deriveGaps(events).map((gap) => gap.gap_type)).toEqual(["duplicate_test"]);
  });

  it("T05 monitoring completed inside the window produces no gap", () => {
    const events = [medStart("2026-01-01", "metformin"), lab("2026-03-01", "a1c")];
    expect(deriveGaps(events)).toHaveLength(0);
  });

  it("T06 monitoring overdue produces a monitoring gap", () => {
    const events = [medStart("2026-01-01", "metformin")];
    expect(deriveGaps(events).map((gap) => gap.gap_type)).toEqual(["med_monitoring"]);
  });

  it("medication stopped early produces no monitoring gap", () => {
    const events = [medStart("2026-01-01", "metformin"), medStop("2026-02-01", "metformin")];
    expect(deriveGaps(events)).toHaveLength(0);
  });

  it("same imaging modality in different regions produces no duplicate", () => {
    const events = [imaging("2026-04-01", "MRI", "brain"), imaging("2026-04-04", "MRI", "knee")];
    expect(deriveGaps(events)).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { createDetectionContext } from "@/lib/detectors";
import { monitoringDetector } from "@/lib/detectors/monitoring/detector";
import { consult, lab, medicationStart, medicationStop } from "../support/detectors";

const context = createDetectionContext("2026-06-05");

function detect(events: Parameters<typeof monitoringDetector.detect>[0]) {
  return monitoringDetector.detect(events, context);
}

describe("medication monitoring detector", () => {
  it("M-N1: monitoring inside the window closes the requirement", () => {
    const events = [
      medicationStart({ id: "start", date: "2026-01-15", drug: "metformin" }),
      lab({ id: "a1c", date: "2026-02-15", test: "a1c" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("M-N2: a normalized alias result closes the requirement", () => {
    const events = [
      medicationStart({ id: "start", date: "2026-01-15", drug: "metformin" }),
      lab({ id: "a1c", date: "2026-02-15", test: "HbA1c" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("M-N3: a stop before the due date suppresses the monitoring gap", () => {
    const events = [
      medicationStart({ id: "start", date: "2026-01-15", drug: "metformin" }),
      medicationStop({ id: "stop", date: "2026-02-01", drug: "metformin" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("M-N4: monitoring one day before the deadline is inside the window", () => {
    const events = [
      medicationStart({ id: "start", date: "2026-01-15", drug: "metformin" }),
      lab({ id: "a1c", date: "2026-04-14", test: "a1c" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("M-N5: monitoring one day after the deadline leaves a gap", () => {
    const events = [
      medicationStart({ id: "start", date: "2026-01-15", drug: "metformin" }),
      lab({ id: "a1c", date: "2026-04-16", test: "a1c" }),
    ];
    const gaps = detect(events);
    expect(gaps).toHaveLength(1);
    if (gaps[0]?.metadata.kind === "med_monitoring") {
      expect(gaps[0].metadata.due_date).toBe("2026-04-15");
      expect(gaps[0].metadata.overdue_days).toBe(51);
    }
  });

  it("M-N6: a medication outside the registry is ignored", () => {
    const events = [medicationStart({ id: "start", date: "2026-01-15", drug: "lisinopril" })];
    expect(detect(events)).toEqual([]);
  });

  it("M-N7: a wrong lab does not satisfy monitoring", () => {
    const events = [
      medicationStart({ id: "start", date: "2026-01-15", drug: "metformin" }),
      lab({ id: "tsh", date: "2026-02-15", test: "tsh" }),
    ];
    expect(detect(events)).toHaveLength(1);
  });

  it("M-N8: no start event means nothing to evaluate", () => {
    expect(detect([lab({ id: "a1c", date: "2026-02-15", test: "a1c" })])).toEqual([]);
  });

  it("does not flag a not-yet-due medication", () => {
    const events = [medicationStart({ id: "start", date: "2026-04-01", drug: "metformin" })];
    expect(detect(events)).toEqual([]);
  });

  it("supports the warfarin/INR registry entry", () => {
    const events = [
      medicationStart({ id: "start", date: "2026-01-01", drug: "warfarin" }),
      lab({ id: "inr", date: "2026-01-05", test: "INR" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("supports the oncology-consult monitoring entry", () => {
    const events = [
      medicationStart({ id: "start", date: "2025-01-01", drug: "tamoxifen" }),
      consult({ id: "onc", date: "2025-06-01", specialty: "oncology", completion: "completed" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("does not suppress when the stop occurs after the due date", () => {
    const events = [
      medicationStart({ id: "start", date: "2026-01-15", drug: "metformin" }),
      medicationStop({ id: "stop", date: "2026-05-01", drug: "metformin" }),
    ];
    expect(detect(events)).toHaveLength(1);
  });

  it("carries the medication, target, window, and source reference", () => {
    const events = [medicationStart({ id: "start", date: "2026-01-15", doc: "med-doc" })];
    const gap = detect(events)[0];
    expect(gap?.identity).toMatchObject({ drug: "metformin", monitoring_target: "a1c_or_bmp" });
    expect(gap?.window_days).toBe(90);
    expect(gap?.due_date).toBe("2026-04-15");
    expect(gap?.evidence_refs[0]?.source_doc_id).toBe(events[0]?.source.source_doc_id);
  });
});

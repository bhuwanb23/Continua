import { describe, expect, it } from "vitest";
import { createDetectionContext } from "@/lib/detectors";
import { duplicateDetector } from "@/lib/detectors/duplicate/detector";
import { imaging, lab } from "../support/detectors";

const context = createDetectionContext("2026-06-05");

function detect(events: Parameters<typeof duplicateDetector.detect>[0]) {
  return duplicateDetector.detect(events, context);
}

describe("duplicate diagnostic testing detector", () => {
  it("D-N1: explicit serial monitoring is suppressed", () => {
    const events = [
      lab({ id: "cbc-1", date: "2026-03-01", series_status: "explicit_series" }),
      lab({ id: "cbc-2", date: "2026-03-08", series_status: "explicit_series" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("D-N2: repeats outside the 14-day window are not duplicates", () => {
    const events = [lab({ id: "cbc-1", date: "2026-03-01" }), lab({ id: "cbc-2", date: "2026-03-22" })];
    expect(detect(events)).toEqual([]);
  });

  it("D-N3: same modality but different body regions are not duplicates", () => {
    const events = [
      imaging({ id: "mri-brain", date: "2026-03-01", modality: "mri", body_region: "brain" }),
      imaging({ id: "mri-knee", date: "2026-03-03", modality: "mri", body_region: "knee" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("D-N4: copied documents describing one occurrence are not duplicate care", () => {
    const events = [
      lab({ id: "cbc-a", date: "2026-03-01", value: "WBC 5.8", doc: "doc-a" }),
      lab({ id: "cbc-b", date: "2026-03-01", value: "WBC 5.8", doc: "doc-b" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("D-N5: same-day distinct entries are conservatively treated as one occurrence", () => {
    const events = [
      lab({ id: "cbc-a", date: "2026-03-01", value: "WBC 5.8" }),
      lab({ id: "cbc-b", date: "2026-03-01", value: "WBC 6.1" }),
    ];
    expect(detect(events)).toEqual([]);
  });

  it("D-N6: an alias pair inside the window is eligible", () => {
    const events = [
      lab({ id: "cbc-1", date: "2026-04-20", test: "CBC with differential" }),
      lab({ id: "cbc-2", date: "2026-04-28", test: "Complete Blood Count" }),
    ];
    const gaps = detect(events);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.identity).toMatchObject({ test: "cbc" });
    expect(gaps[0]?.metadata.kind).toBe("duplicate_test");
    if (gaps[0]?.metadata.kind === "duplicate_test") {
      expect(gaps[0].metadata.days_between).toBe(8);
      expect(gaps[0].metadata.occurrence_count).toBe(2);
      expect(gaps[0].metadata.first_date).toBe("2026-04-20");
    }
  });

  it("D-N7: three repeats produce one grouped candidate", () => {
    const events = [
      lab({ id: "cbc-1", date: "2026-03-01" }),
      lab({ id: "cbc-2", date: "2026-03-05" }),
      lab({ id: "cbc-3", date: "2026-03-09" }),
    ];
    const gaps = detect(events);
    expect(gaps).toHaveLength(1);
    if (gaps[0]?.metadata.kind === "duplicate_test") {
      expect(gaps[0].metadata.occurrence_count).toBe(3);
      expect(gaps[0].metadata.event_ids).toHaveLength(3);
      expect(gaps[0].severity).toBe("high");
    }
  });

  it("D-N8: unknown provider identity does not change the deterministic result", () => {
    const events = [
      lab({ id: "cbc-1", date: "2026-03-01" }),
      lab({ id: "cbc-2", date: "2026-03-03" }),
    ];
    const first = detect(events);
    const second = detect(events);
    expect(first).toHaveLength(1);
    expect(first).toEqual(second);
  });

  it("uses the frozen 14-day due date and preserves both source documents", () => {
    const events = [
      imaging({ id: "mri-1", date: "2026-03-01", modality: "mri", body_region: "knee", doc: "doc-a" }),
      imaging({ id: "mri-2", date: "2026-03-06", modality: "mri", body_region: "knee", doc: "doc-b" }),
    ];
    const gap = detect(events)[0];
    expect(gap?.due_date).toBe("2026-03-15");
    expect(gap?.window_days).toBe(14);
    expect(gap?.evidence_refs.map((ref) => ref.source_doc_id).sort()).toEqual(
      events.map((event) => event.source.source_doc_id).sort(),
    );
  });
});

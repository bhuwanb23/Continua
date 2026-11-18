import { describe, expect, it } from "vitest";
import { matchExtractionEvents } from "@/lib/evaluation/extraction-matching";
import { extractionPrediction, goldEvent, sourceRecord } from "../support/evaluation";

describe("extraction evaluation", () => {
  it("scores a perfect extraction", () => {
    const metrics = matchExtractionEvents([goldEvent()], [extractionPrediction()]);
    expect(metrics.event_precision).toBe(1);
    expect(metrics.event_recall).toBe(1);
    expect(metrics.event_f1).toBe(1);
    expect(metrics.date_accuracy).toBe(1);
    expect(metrics.normalization_accuracy).toBe(1);
    expect(metrics.source_attribution_accuracy).toBe(1);
    expect(metrics.span_support_rate).toBe(1);
  });

  it("scores a missed event as recall loss", () => {
    const metrics = matchExtractionEvents([goldEvent()], []);
    expect(metrics.event_precision).toBeNull();
    expect(metrics.event_recall).toBe(0);
    expect(metrics.false_negative_gold_ids).toEqual(["gold-1"]);
  });

  it("separates wrong normalization from event detection", () => {
    const metrics = matchExtractionEvents(
      [goldEvent()],
      [extractionPrediction({ normalized: { specialty: "cardiology" }, normalized_entity: "cardiology" })],
    );
    expect(metrics.matched_events).toBe(1);
    expect(metrics.normalization_accuracy).toBe(0);
  });

  it("scores wrong source attribution separately", () => {
    const metrics = matchExtractionEvents(
      [goldEvent()],
      [extractionPrediction({ source_doc_id: "other-doc" })],
      { records: [sourceRecord()] },
    );
    expect(metrics.matched_events).toBe(1);
    expect(metrics.source_attribution_accuracy).toBe(0);
  });

  it("does not match a materially different date", () => {
    const metrics = matchExtractionEvents([goldEvent()], [extractionPrediction({ date: "2026-05-18" })]);
    expect(metrics.matched_events).toBe(0);
  });

  it("supports month-precision compatibility", () => {
    const metrics = matchExtractionEvents(
      [goldEvent({ date_precision: "month", date: "2026-05-01" })],
      [extractionPrediction({ date_precision: "day", date: "2026-05-24" })],
    );
    expect(metrics.matched_events).toBe(1);
    expect(metrics.date_accuracy).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import {
  evaluateGapGrounding,
  evaluateGrounding,
  filterGroundedPredictions,
  spanSupportScore,
  verifySpan,
} from "@/lib/evaluation/grounding";
import { gapPrediction, sourceRecord } from "../support/evaluation";

describe("evidence grounding", () => {
  it("accepts an exact quoted span", () => {
    const result = evaluateGapGrounding(gapPrediction(), [sourceRecord()]);
    expect(result.grounded).toBe(true);
    expect(result.evidence[0]).toMatchObject({ exists: true, owned_by_patient: true, span_supported: true });
  });

  it("accepts a frozen fuzzy span at or above 0.85", () => {
    expect(spanSupportScore("Referral to Medical Oncology for adjuvant treatment", sourceRecord().text)).toBeGreaterThanOrEqual(0.85);
    const verified = verifySpan("Referral to Medical Oncology for adjuvant treatment", sourceRecord().text);
    expect(verified.supported).toBe(true);
    expect(verified.method).toBe("fuzzy");
  });

  it("rejects a missing citation", () => {
    const result = evaluateGapGrounding(gapPrediction({ evidence: [] }), [sourceRecord()]);
    expect(result.grounded).toBe(false);
    expect(result.failures).toContain("EV-01");
  });

  it("rejects an unknown document", () => {
    const result = evaluateGapGrounding(
      gapPrediction({ evidence: [{ doc_id: "missing", quoted_span: "Referral" }] }),
      [sourceRecord()],
    );
    expect(result.grounded).toBe(false);
    expect(result.failures).toContain("EV-01");
  });

  it("rejects a document owned by another patient", () => {
    const result = evaluateGapGrounding(gapPrediction(), [sourceRecord({ patient_id: "patient-2" })]);
    expect(result.grounded).toBe(false);
    expect(result.failures).toContain("EV-02");
  });

  it("rejects an unsupported span", () => {
    const result = evaluateGapGrounding(
      gapPrediction({ evidence: [{ doc_id: "doc-1", quoted_span: "The patient was diagnosed with a new mass." }] }),
      [sourceRecord()],
    );
    expect(result.grounded).toBe(false);
    expect(result.failures).toContain("EV-03");
  });

  it("computes aggregate grounding and suppresses ungrounded predictions", () => {
    const good = gapPrediction({ prediction_id: "good" });
    const bad = gapPrediction({
      prediction_id: "bad",
      evidence: [{ doc_id: "doc-1", quoted_span: "not in the source" }],
    });
    const metrics = evaluateGrounding([good, bad], [sourceRecord()]);
    expect(metrics.grounded_gap_rate).toBe(0.5);
    expect(metrics.unsupported_claim_rate).toBe(0.5);
    const filtered = filterGroundedPredictions([good, bad], [sourceRecord()]);
    expect(filtered.displayed.map((prediction) => prediction.prediction_id)).toEqual(["good"]);
    expect(filtered.suppressed.map((prediction) => prediction.prediction_id)).toEqual(["bad"]);
  });

  it("never emits NaN when there are no predictions", () => {
    const metrics = evaluateGrounding([], [sourceRecord()]);
    expect(metrics.grounded_gap_rate).toBeNull();
    expect(metrics.citation_validity).toBeNull();
    expect(metrics.span_support_rate).toBeNull();
  });
});

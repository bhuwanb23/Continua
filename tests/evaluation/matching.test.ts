import { describe, expect, it } from "vitest";
import { identityMatches, matchPredictions } from "@/lib/evaluation/matching";
import { gapPrediction, truthGap } from "../support/evaluation";

describe("one-to-one gap matching", () => {
  it("matches a correct prediction once", () => {
    const result = matchPredictions([truthGap()], [gapPrediction()]);
    expect(result.truePositives).toBe(1);
    expect(result.falsePositives).toBe(0);
    expect(result.falseNegatives).toBe(0);
    expect(result.assignments[0]?.evidence_overlap).toEqual(["doc-1"]);
  });

  it("rejects a prediction for the wrong patient", () => {
    const result = matchPredictions([truthGap()], [gapPrediction({ patient_id: "patient-2" })]);
    expect(result.truePositives).toBe(0);
    expect(result.falsePositivePredictionIds).toEqual(["prediction-1"]);
    expect(result.falseNegativeTruthIds).toEqual(["truth-1"]);
  });

  it("rejects a prediction with the wrong gap type", () => {
    const result = matchPredictions([truthGap()], [gapPrediction({ gap_type: "duplicate_test" })]);
    expect(result.truePositives).toBe(0);
    expect(result.falsePositives).toBe(1);
  });

  it("rejects a correct type with the wrong specialty", () => {
    const result = matchPredictions([truthGap()], [gapPrediction({ identity: { specialty: "cardiology" } })]);
    expect(result.truePositives).toBe(0);
    expect(identityMatches({ specialty: "oncology" }, { specialty: "cardiology" })).toBe(false);
  });

  it("rejects a correct type at the wrong occurrence", () => {
    const result = matchPredictions(
      [truthGap()],
      [
        gapPrediction({
          evidence: [{ doc_id: "other-doc", quoted_span: "Referral" }],
          trigger_event_ids: ["other-trigger"],
        }),
      ],
    );
    expect(result.truePositives).toBe(0);
    expect(result.falseNegatives).toBe(1);
  });

  it("counts a duplicate prediction as a false positive, not extra recall", () => {
    const result = matchPredictions(
      [truthGap()],
      [
        gapPrediction({ prediction_id: "prediction-1" }),
        gapPrediction({ prediction_id: "prediction-2" }),
      ],
    );
    expect(result.truePositives).toBe(1);
    expect(result.falsePositives).toBe(1);
    expect(result.duplicatePredictionIds).toEqual(["prediction-2"]);
  });

  it("reports a missing truth as a false negative when there are no predictions", () => {
    const result = matchPredictions([truthGap()], []);
    expect(result.truePositives).toBe(0);
    expect(result.falseNegatives).toBe(1);
  });

  it("requires evidence overlap when the truth has evidence", () => {
    const result = matchPredictions(
      [truthGap()],
      [gapPrediction({ evidence: [{ doc_id: "unrelated", quoted_span: "unrelated" }] })],
    );
    expect(result.falseNegatives).toBe(1);
  });
});

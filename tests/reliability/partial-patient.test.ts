import { describe, expect, it } from "vitest";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { verifyCandidateGaps } from "@/lib/evidence";
import {
  completenessFromDocumentStatuses,
  gateAbsenceGaps,
  PARTIAL_DATA_COPY,
} from "@/lib/reliability/completeness";
import { mariaEvidenceSetup } from "@/tests/support/evidence";

const setup = mariaEvidenceSetup();
const context = createDetectionContext("2026-06-05", { event_store_hash: setup.context.event_store_hash });

describe("partial patient processing", () => {
  it("classifies document outcomes conservatively", () => {
    expect(completenessFromDocumentStatuses(["ok", "ok"])).toBe("COMPLETE");
    expect(completenessFromDocumentStatuses(["ok", "failed"])).toBe("PARTIAL");
    expect(completenessFromDocumentStatuses(["failed"])).toBe("FAILED");
    expect(completenessFromDocumentStatuses([])).toBe("FAILED");
  });

  it("produces all three gap types only for a COMPLETE patient", () => {
    const gaps = detectCandidateGaps(setup.events, { ...context, patient_completeness: "COMPLETE" });
    expect(gaps.map((gap) => gap.gap_type).sort()).toEqual([
      "duplicate_test",
      "med_monitoring",
      "missed_followup",
    ]);
  });

  it("suppresses every absence-derived gap for a PARTIAL patient", () => {
    const gaps = detectCandidateGaps(setup.events, { ...context, patient_completeness: "PARTIAL" });
    expect(gaps.map((gap) => gap.gap_type)).toEqual(["duplicate_test"]);

    const gate = gateAbsenceGaps(detectCandidateGaps(setup.events, context), "PARTIAL");
    expect(gate.gaps).toHaveLength(1);
    expect(gate.suppressed.map((item) => item.gap_type).sort()).toEqual([
      "med_monitoring",
      "missed_followup",
    ]);
  });

  it("suppresses every absence-derived gap for a FAILED patient", () => {
    const gaps = detectCandidateGaps(setup.events, { ...context, patient_completeness: "FAILED" });
    expect(gaps.map((gap) => gap.gap_type)).toEqual(["duplicate_test"]);
  });

  it("fails closed at evidence verification when completeness was not established", () => {
    const partial = MARIA_candidates();
    const results = verifyCandidateGaps(partial, { ...setup.context, patient_completeness: "PARTIAL" });
    for (const result of results) {
      if (result.candidate.gap_type === "duplicate_test") {
        expect(result.status).toBe("verified");
      } else {
        expect(result.status).toBe("suppressed");
        expect(result.bundle.failures.map((failure) => failure.code)).toContain("EV-008");
      }
    }
  });

  it("uses the honest incomplete-processing copy", () => {
    expect(PARTIAL_DATA_COPY).toBe(
      "Some available records could not be processed; results may be incomplete.",
    );
  });
});

function MARIA_candidates() {
  return detectCandidateGaps(setup.events, context);
}

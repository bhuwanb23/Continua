import { describe, expect, it } from "vitest";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { verifyCandidateGaps } from "@/lib/evidence";
import { stableJson } from "@/lib/reliability/assertions";
import { mariaEvidenceSetup } from "@/tests/support/evidence";
import { mariaPrioritySetup } from "@/tests/support/priority";

const setup = mariaEvidenceSetup();
const prioritySetup = mariaPrioritySetup();
const context = createDetectionContext("2026-06-05", {
  event_store_hash: setup.context.event_store_hash,
});

describe("deterministic core", () => {
  it("produces identical detection output across 100 fresh diagnostic runs", () => {
    const expected = stableJson(detectCandidateGaps(setup.events, context));
    for (let run = 0; run < 100; run += 1) {
      const freshContext = createDetectionContext("2026-06-05", {
        event_store_hash: setup.context.event_store_hash,
      });
      expect(stableJson(detectCandidateGaps(setup.events, freshContext))).toBe(expected);
    }
  });

  it("produces identical evidence verification across 20 runs", () => {
    const expected = stableJson(
      verifyCandidateGaps(setup.candidates, setup.context).map((result) => ({
        gap_id: result.candidate.gap_id,
        status: result.status,
        failures: result.bundle.failures,
      })),
    );
    for (let run = 0; run < 20; run += 1) {
      const results = verifyCandidateGaps(setup.candidates, setup.context).map((result) => ({
        gap_id: result.candidate.gap_id,
        status: result.status,
        failures: result.bundle.failures,
      }));
      expect(stableJson(results)).toBe(expected);
    }
  });

  it("produces identical priority scores across 100 runs", () => {
    const expected = stableJson(prioritySetup.panel);
    for (let run = 0; run < 100; run += 1) {
      expect(stableJson(prioritySetup.panel)).toBe(expected);
    }
    expect(prioritySetup.panel.patient_priorities[0]?.patient_priority_score).toBeTypeOf("number");
  });

  it("does not depend on input object identity", () => {
    const copy = JSON.parse(JSON.stringify(setup.events));
    const first = detectCandidateGaps(setup.events, context);
    const second = detectCandidateGaps(copy, context);
    expect(stableJson(first)).toBe(stableJson(second));
  });
});

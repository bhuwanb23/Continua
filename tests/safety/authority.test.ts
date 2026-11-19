import { describe, expect, it } from "vitest";
import { AI_AUTHORITY_MATRIX, isAllowed, requiresHuman } from "@/lib/safety/authority";
import { PROHIBITED_USES } from "@/lib/safety/prohibited-use";
import { INTENDED_USE } from "@/lib/safety/intended-use";
import { mariaEvidenceSetup } from "@/tests/support/evidence";
import { mariaPrioritySetup } from "@/tests/support/priority";

describe("AI authority boundary", () => {
  it("forbids diagnosis, prescribing, autonomous action, and candidate display", () => {
    const forbidden = AI_AUTHORITY_MATRIX.filter((entry) => entry.decision === "forbidden").map((entry) => entry.capability);
    expect(forbidden).toContain("Diagnose a patient");
    expect(forbidden).toContain("Prescribe or adjust treatment");
    expect(forbidden).toContain("Order tests or schedule care");
    expect(forbidden).toContain("Display a candidate or unverified gap");
    expect(isAllowed("Diagnose a patient")).toBe(false);
    expect(isAllowed("Prescribe or adjust treatment")).toBe(false);
  });

  it("requires a human for contact, override, and release decisions", () => {
    expect(requiresHuman("Contact a patient or provider")).toBe(true);
    expect(requiresHuman("Override a verified gap")).toBe(true);
    expect(requiresHuman("Approve release")).toBe(true);
  });

  it("keeps gap detection authority deterministic, not model-owned", () => {
    const detection = AI_AUTHORITY_MATRIX.find((entry) => entry.capability === "Detect candidate care gaps");
    expect(detection?.owner).toBe("pipeline");
    const verification = AI_AUTHORITY_MATRIX.find((entry) => entry.capability === "Verify gap evidence");
    expect(verification?.owner).toBe("pipeline");
  });

  it("only exposes verified gaps to downstream consumers", () => {
    const evidence = mariaEvidenceSetup();
    expect(evidence.results.length).toBeGreaterThan(0);
    for (const result of evidence.results) {
      if (result.status === "verified") {
        expect(result.verified_gap).not.toBeNull();
        expect(result.verified_gap?.grounded).toBe(true);
        expect(result.bundle.verification_status).toBe("verified");
      } else {
        expect(result.verified_gap).toBeNull();
        expect(result.suppression).not.toBeNull();
      }
    }

    const priority = mariaPrioritySetup();
    expect(priority.gaps.every((gap) => gap.schema_version === "verified-gap-v1")).toBe(true);
    expect(JSON.stringify(priority.panel)).not.toContain("candidate-gap-v1");
  });

  it("publishes an intended-use boundary and prohibited-use controls", () => {
    expect(INTENDED_USE.out_of_scope.join(" ")).toMatch(/diagnos/i);
    expect(PROHIBITED_USES.length).toBeGreaterThanOrEqual(8);
    for (const use of PROHIBITED_USES) expect(use.control.length).toBeGreaterThan(10);
  });
});

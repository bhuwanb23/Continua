import { describe, expect, it } from "vitest";
import { loadDemoCache } from "@/lib/cache/validate";
import {
  ALLOWED_OUTPUT_LABELS,
  checkOutputLanguage,
  isSafeOutput,
} from "@/lib/safety/action-language";
import { auditGapCopy } from "@/lib/safety/output-guard";
import { absenceDescription, gapDisplayTitle } from "@/lib/api/display";
import { PRIORITY_LABELS } from "@/lib/api/dto";
import { auditOutputLanguage } from "../../scripts/lib/safety-audits";

describe("output language guard", () => {
  it("passes every displayed string in the frozen cache", () => {
    const cache = loadDemoCache();
    const audit = auditGapCopy(cache.verifiedGaps);
    expect(audit.checked).toBe(cache.verifiedGaps.length);
    expect(audit.issues).toEqual([]);
    expect(auditOutputLanguage().passed).toBe(true);
  });

  it("rejects clinical action and necessity language", () => {
    for (const text of [
      "Prescribe physical therapy.",
      "Order an MRI.",
      "Adjust the metformin dose.",
      "Diagnose the patient with anemia.",
      "This test is medically unnecessary.",
      "The patient does not need follow-up.",
    ]) {
      expect(isSafeOutput(text, { kind: "action" })).toBe(false);
    }
  });

  it("rejects risk prediction and autonomy claims", () => {
    for (const text of [
      "This is a high-risk patient.",
      "Risk score 0.82.",
      "The system will contact the patient.",
      "We have scheduled the consult.",
      "AI recommends starting treatment.",
    ]) {
      expect(isSafeOutput(text)).toBe(false);
    }
  });

  it("accepts coordinator verification language", () => {
    const cache = loadDemoCache();
    for (const gap of cache.verifiedGaps) {
      expect(checkOutputLanguage(gap.recommended_coordinator_action, { kind: "action" })).toEqual([]);
    }
    expect(isSafeOutput("Verify monitoring status and coordinate follow-up if unresolved.", { kind: "action" })).toBe(true);
  });

  it("uses workflow labels, not clinical risk labels", () => {
    expect(Object.values(PRIORITY_LABELS)).toEqual(["Act first", "Act soon", "Routine", "Monitor", "No verified gap"]);
    expect(Object.values(PRIORITY_LABELS).join(" ")).not.toMatch(/risk|critical|urgent/i);
    for (const label of Object.values(ALLOWED_OUTPUT_LABELS)) {
      expect(checkOutputLanguage(label)).toEqual([]);
    }
  });

  it("rewrites sensational gap titles", () => {
    expect(gapDisplayTitle("missed_followup", "Missed Oncology follow-up")).toBe("Oncology follow-up unresolved");
    expect(gapDisplayTitle("duplicate_test", "Possible repeat MRI knee within 14 days")).toBe("Possible repeat MRI KNEE");
    expect(gapDisplayTitle("med_monitoring", "Check for A1C or BMP overdue")).toBe("A1C or BMP monitoring unresolved");
  });

  it("scopes absence copy to available records", () => {
    const cache = loadDemoCache();
    const descriptions = cache.evidence.deep_dives.flatMap((deepDive) =>
      ((deepDive.absence_checks as Parameters<typeof absenceDescription>[0][]) ?? []).map(absenceDescription),
    );
    expect(descriptions.length).toBeGreaterThan(0);
    for (const description of descriptions) {
      expect(description).toContain("in the available records");
      expect(checkOutputLanguage(description, { kind: "absence" })).toEqual([]);
    }
  });
});

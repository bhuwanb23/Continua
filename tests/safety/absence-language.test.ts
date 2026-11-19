import { describe, expect, it } from "vitest";
import { loadDemoCache } from "@/lib/cache/validate";
import { absenceDescription } from "@/lib/api/display";
import { checkOutputLanguage } from "@/lib/safety/action-language";

describe("absence language", () => {
  it("describes every absence check as scoped to available records", () => {
    const cache = loadDemoCache();
    const checks = cache.verifiedGaps.flatMap((gap) => gap.evidence_bundle.absence);
    expect(checks.length).toBeGreaterThan(0);
    for (const check of checks) {
      const description = absenceDescription({
        evidence_id: check.evidence_id,
        event_types: [...check.search_definition.event_types],
        normalized_identity: check.search_definition.normalized_identity,
        window_start: check.search_definition.start_date,
        window_end: check.search_definition.end_date,
        matching_event_count: check.matching_event_count,
      });
      expect(description).toContain("in the available records");
      expect(checkOutputLanguage(description, { kind: "absence" })).toEqual([]);
    }
  });

  it("rejects absolute and unscoped absence statements", () => {
    expect(checkOutputLanguage("No consult was ever documented at all", { kind: "absence" }).map((issue) => issue.code)).toContain(
      "absolute_absence",
    );
    expect(checkOutputLanguage("No matching consult for oncology", { kind: "absence" }).map((issue) => issue.code)).toContain(
      "unscoped_absence",
    );
    expect(checkOutputLanguage("There is no record of a consult", { kind: "absence" }).map((issue) => issue.code)).toContain(
      "unscoped_absence",
    );
  });

  it("allows scoped absence statements", () => {
    const scoped = "No matching consult for oncology within the verification window in the available records";
    expect(checkOutputLanguage(scoped, { kind: "absence" })).toEqual([]);
  });

  it("does not apply absence scoping to ordinary action copy", () => {
    expect(checkOutputLanguage("Verify whether a consult is documented.", { kind: "action" })).toEqual([]);
  });
});

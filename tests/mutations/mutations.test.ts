import { describe, expect, it } from "vitest";
import { deriveGaps } from "@/lib/generator/truth-check";
import { consult, lab, medStart, medStop, referral } from "../support/events";

describe("dataset mutation testing", () => {
  it("adding a qualifying consult removes a missed follow-up", () => {
    const base = [referral("2026-03-01", 30)];
    expect(deriveGaps(base)).toHaveLength(1);
    expect(deriveGaps([...base, consult("2026-03-25", "oncology")])).toHaveLength(0);
  });

  it("moving a repeat test outside the window removes the duplicate", () => {
    const base = [lab("2026-04-01", "cbc"), lab("2026-04-08", "cbc")];
    expect(deriveGaps(base)).toHaveLength(1);
    const moved = [lab("2026-04-01", "cbc"), lab("2026-04-20", "cbc")];
    expect(deriveGaps(moved)).toHaveLength(0);
  });

  it("adding a monitoring result removes the monitoring gap", () => {
    const base = [medStart("2026-01-01", "metformin")];
    expect(deriveGaps(base)).toHaveLength(1);
    expect(deriveGaps([...base, lab("2026-02-01", "a1c")])).toHaveLength(0);
  });

  it("marking a series as explicit removes the duplicate", () => {
    const base = [lab("2026-04-01", "cbc"), lab("2026-04-08", "cbc")];
    expect(deriveGaps(base)).toHaveLength(1);
    const explicit = [
      lab("2026-04-01", "cbc", "explicit_series"),
      lab("2026-04-08", "cbc", "explicit_series"),
    ];
    expect(deriveGaps(explicit)).toHaveLength(0);
  });

  it("stopping a medication before the due date removes the monitoring gap", () => {
    const base = [medStart("2026-01-01", "metformin")];
    expect(deriveGaps(base)).toHaveLength(1);
    expect(deriveGaps([...base, medStop("2026-02-01", "metformin")])).toHaveLength(0);
  });

  it("a referral whose window is still open is not a gap", () => {
    expect(deriveGaps([referral("2026-05-20", 45)])).toHaveLength(0);
  });

  it("a wrong-specialty consult does not close a referral", () => {
    expect(deriveGaps([referral("2026-03-01", 30), consult("2026-03-20", "primary_care")])).toHaveLength(1);
  });
});

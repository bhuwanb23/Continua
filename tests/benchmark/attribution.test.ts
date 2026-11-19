import { describe, expect, it } from "vitest";
import { buildErrorAttribution } from "@/lib/benchmark/funnel";

describe("benchmark error attribution", () => {
  it("reports no failures when every truth gap is retained", () => {
    const attribution = buildErrorAttribution({
      truthGaps: [],
      funnel: { truth_gap_ids_lost: [] } as never,
      priority: { queue: [], panel: { gap_priorities: [] } } as never,
    });
    expect(attribution.total_failures).toBe(0);
    expect(attribution.entries).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { stableJson } from "@/lib/reliability/assertions";
import { expectedStatuses, runCriticalPath } from "./support";

describe("critical-path soak", () => {
  it("completes 50 consecutive judge-path runs without failure drift", { timeout: 120_000 }, async () => {
    let baseline: string | null = null;
    for (let run = 0; run < 50; run += 1) {
      const observation = await runCriticalPath();
      expect(expectedStatuses(observation), `run ${run + 1}`).toBe(true);
      expect(observation.maria_rank, `run ${run + 1}`).toBe(27);
      expect(observation.stages).toHaveLength(8);
      const shape = stableJson(observation.stages.map((stage) => ({ stage: stage.stage, status: stage.status })));
      baseline ??= shape;
      expect(shape, `run ${run + 1}`).toBe(baseline);
    }
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  goldenFingerprint,
  projectGolden,
  type GoldenCacheInputs,
  type GoldenSnapshot,
} from "@/lib/reliability/golden";
import { expectedStatuses, MARIA_RANK, readCache, runCriticalPath } from "./support";

function cacheInputs(): GoldenCacheInputs {
  const read = <T>(name: string) => readCache<T>(name);
  return {
    manifest: read("manifest.json"),
    panel: read("panel.json"),
    queue: read("queue.json"),
    priorities: read("priorities.json"),
    maria: read("maria.json"),
    timelines: read("timelines.json"),
    verifiedGaps: read<{ verified_gaps: Array<Record<string, unknown>> }>("verified-gaps.json")
      .verified_gaps,
    evidence: read("evidence.json"),
    evaluation: read("evaluation.json"),
  };
}

function goldenArtifact(): GoldenSnapshot {
  return JSON.parse(
    readFileSync(join(process.cwd(), "artifacts", "reliability", "golden-regression.json"), "utf8"),
  ) as GoldenSnapshot;
}

describe("happy-path regression baseline", () => {
  it("matches the frozen golden snapshot derived from the official cache", () => {
    const current = projectGolden(cacheInputs());
    expect(goldenFingerprint(current)).toBe(goldenFingerprint(goldenArtifact()));
  });

  it("keeps the panel at 80 patients and the real Maria rank", () => {
    const snapshot = projectGolden(cacheInputs());
    expect(snapshot.panel.patient_count).toBe(80);
    expect(snapshot.maria.rank).toBe(MARIA_RANK);
    expect(snapshot.maria.gap_ids).toHaveLength(3);
    expect(snapshot.maria.timeline_event_ids.length).toBeGreaterThan(0);
    expect(snapshot.evidence.flagship_gap_has_sources).toBe(true);
  });

  it("serves every P0 stage with a 200 and a truthful synthetic flag", async () => {
    const observation = await runCriticalPath();
    expect(expectedStatuses(observation)).toBe(true);
    expect(observation.maria_rank).toBe(MARIA_RANK);
    expect(observation.stages.map((stage) => stage.stage)).toEqual([
      "readiness",
      "panel",
      "queue",
      "patient",
      "timeline",
      "gaps",
      "evidence",
      "evaluation",
    ]);
  });
});

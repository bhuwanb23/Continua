import { describe, expect, it } from "vitest";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { asHandler, invokeGet, readCache } from "./support";

const gaps = asHandler(gapsRoute);

interface GapsBody {
  patient_id: string;
  gaps: Array<{
    gap_id: string;
    gap_type: string;
    title: string;
    workflow_severity: string;
    gap_priority_score: number;
    priority_band: string;
    summary: string;
    recommended_coordinator_action: string;
    evidence_status: string;
    evidence_count: number;
  }>;
}

interface VerifiedGapArtifact {
  verified_gaps: Array<{
    gap_id: string;
    patient_id: string;
    gap_type: string;
    title: string;
    severity: string;
    evidence_bundle: {
      verification_status: string;
      positive: unknown[];
      absence: unknown[];
      policy: unknown[];
    };
  }>;
}

const cache = readCache<VerifiedGapArtifact>("verified-gaps.json");
const byPatient = new Map<string, VerifiedGapArtifact["verified_gaps"]>();
for (const gap of cache.verified_gaps) {
  const list = byPatient.get(gap.patient_id) ?? [];
  list.push(gap);
  byPatient.set(gap.patient_id, list);
}
const target = [...byPatient.entries()].sort((left, right) => right[1].length - left[1].length)[0];
if (!target) throw new Error("Cache has no verified gaps");
const [patientId, patientGaps] = target;

const priorities = readCache<{ gap_priorities: Array<{ gap_id: string; gap_priority_score: number }> }>(
  "priorities.json",
);
const gapScore = new Map(priorities.gap_priorities.map((priority) => [priority.gap_id, priority.gap_priority_score]));

describe("GET /api/v1/patients/{patientId}/gaps", () => {
  it("returns only verified gaps from the frozen set", async () => {
    const result = await invokeGet<GapsBody>(gaps, `/api/v1/patients/${patientId}/gaps`, { patientId });
    expect(result.status).toBe(200);
    const knownIds = new Set(cache.verified_gaps.map((gap) => gap.gap_id));
    for (const gap of result.body.gaps) {
      expect(knownIds.has(gap.gap_id)).toBe(true);
      expect(gap.evidence_status).toBe("verified");
    }
    expect(result.body.gaps).toHaveLength(patientGaps.length);
    expect(result.text).not.toMatch(/candidate|trigger_event_ids|evidence_bundle/);
  });

  it("orders gaps by stored priority score", async () => {
    const result = await invokeGet<GapsBody>(gaps, `/api/v1/patients/${patientId}/gaps`, { patientId });
    const scores = result.body.gaps.map((gap) => gapScore.get(gap.gap_id) ?? -1);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    for (const gap of result.body.gaps) {
      expect(gap.gap_priority_score).toBe(gapScore.get(gap.gap_id));
    }
  });

  it("uses short, non-sensational titles and cautious summaries", async () => {
    const result = await invokeGet<GapsBody>(gaps, `/api/v1/patients/${patientId}/gaps`, { patientId });
    for (const gap of result.body.gaps) {
      expect(gap.title.length).toBeLessThanOrEqual(60);
      expect(gap.title).not.toMatch(/never|failed|unnecessary|dangerous/i);
      expect(gap.summary).not.toMatch(/never saw|unnecessary CBC|patient failed/i);
      expect(gap.summary.length).toBeGreaterThan(10);
    }
  });

  it("counts evidence items that the evidence route actually returns", async () => {
    const result = await invokeGet<GapsBody>(gaps, `/api/v1/patients/${patientId}/gaps`, { patientId });
    for (const gap of result.body.gaps) {
      const stored = cache.verified_gaps.find((entry) => entry.gap_id === gap.gap_id);
      expect(stored).toBeDefined();
      if (!stored) continue;
      const expected =
        stored.evidence_bundle.positive.length +
        stored.evidence_bundle.absence.length +
        stored.evidence_bundle.policy.length;
      expect(gap.evidence_count).toBe(expected);
    }
  });

  it("returns 404 for an unknown patient", async () => {
    const result = await invokeGet(gaps, "/api/v1/patients/00000000-0000-4000-8000-000000000000/gaps", {
      patientId: "00000000-0000-4000-8000-000000000000",
    });
    expect(result.status).toBe(404);
  });
});

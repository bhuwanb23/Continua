import { describe, expect, it } from "vitest";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { asHandler, invokeGet, readCache } from "./support";

const evidence = asHandler(evidenceRoute);

interface EvidenceBody {
  gap_id: string;
  verification_status: string;
  claims: Array<{ claim: string; status: string; evidence_ids: string[] }>;
  sources: Array<{
    document_id: string;
    document_type: string;
    provider: string | null;
    date: string;
    quoted_span: string;
    source_excerpt: string;
    verification_method: string;
  }>;
  absence_checks: Array<{
    description: string;
    window_start: string | null;
    window_end: string | null;
    matching_event_count: number;
    status: string;
  }>;
  policy_checks: Array<{ policy: string; status: string; detail: string | null }>;
}

interface GapArtifact {
  gap_id: string;
  patient_id: string;
  evidence_bundle: { claims: Array<{ claim: string; supported: boolean }> };
}

const cache = readCache<{ verified_gaps: GapArtifact[] }>("verified-gaps.json");
const records = readCache<Array<{ source_doc_id: string; patient_id: string }>>("records.json");
const recordOwner = new Map(records.map((record) => [record.source_doc_id, record.patient_id]));

const flagship = cache.verified_gaps.find((gap) => gap.evidence_bundle.claims.length >= 2) ?? cache.verified_gaps[0];
if (!flagship) throw new Error("Cache has no verified gaps");

describe("GET /api/v1/evidence/{gapId}", () => {
  it("returns claims, sources, absence checks, and policy checks", async () => {
    const result = await invokeGet<EvidenceBody>(evidence, `/api/v1/evidence/${flagship.gap_id}`, {
      gapId: flagship.gap_id,
    });
    expect(result.status).toBe(200);
    expect(result.body.gap_id).toBe(flagship.gap_id);
    expect(result.body.verification_status).toBe("verified");
    expect(result.body.claims.length).toBeGreaterThan(0);
    expect(result.body.sources.length).toBeGreaterThan(0);
    expect(result.body.absence_checks.length).toBeGreaterThan(0);
    expect(result.body.policy_checks.length).toBeGreaterThan(0);
    for (const claim of result.body.claims) expect(["verified", "unsupported"]).toContain(claim.status);
  });

  it("marks every required claim as supported", async () => {
    const result = await invokeGet<EvidenceBody>(evidence, `/api/v1/evidence/${flagship.gap_id}`, {
      gapId: flagship.gap_id,
    });
    const required = new Set(
      flagship.evidence_bundle.claims.filter((claim) => claim.supported).map((claim) => claim.claim),
    );
    for (const claim of result.body.claims) {
      if (required.has(claim.claim)) expect(claim.status).toBe("verified");
    }
  });

  it("never cites another patient's document", async () => {
    const result = await invokeGet<EvidenceBody>(evidence, `/api/v1/evidence/${flagship.gap_id}`, {
      gapId: flagship.gap_id,
    });
    for (const source of result.body.sources) {
      expect(recordOwner.get(source.document_id)).toBe(flagship.patient_id);
    }
  });

  it("returns bounded excerpts instead of full documents", async () => {
    const result = await invokeGet<EvidenceBody>(evidence, `/api/v1/evidence/${flagship.gap_id}`, {
      gapId: flagship.gap_id,
    });
    for (const source of result.body.sources) {
      expect(source.quoted_span.length).toBeLessThanOrEqual(400);
      expect(source.source_excerpt.length).toBeLessThanOrEqual(400);
      expect(source.verification_method).toMatch(/exact|fuzzy/);
    }
  });

  it("reports absence checks as verified with zero matching events", async () => {
    const result = await invokeGet<EvidenceBody>(evidence, `/api/v1/evidence/${flagship.gap_id}`, {
      gapId: flagship.gap_id,
    });
    for (const check of result.body.absence_checks) {
      if (check.matching_event_count === 0) expect(check.status).toBe("verified");
      else expect(check.status).toBe("contradicted");
    }
  });

  it("returns 404 gap_not_found for an unknown or malformed gap id", async () => {
    const missing = await invokeGet(evidence, "/api/v1/evidence/00000000-0000-4000-8000-000000000000", {
      gapId: "00000000-0000-4000-8000-000000000000",
    });
    expect(missing.status).toBe(404);
    expect((missing.body as { error: { code: string } }).error.code).toBe("gap_not_found");

    const malformed = await invokeGet(evidence, "/api/v1/evidence/../ground_truth.json", {
      gapId: "../ground_truth.json",
    });
    expect(malformed.status).toBe(400);
  });
});

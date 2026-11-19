import { describe, expect, it } from "vitest";
import { createEvidenceVerificationContext, verifyCandidateGaps } from "@/lib/evidence";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { loadDemoCache } from "@/lib/cache/validate";
import { mariaEvidenceSetup, clone } from "@/tests/support/evidence";
import { cleanupCacheCopies, copyCache, readCacheJson, validateDir, writeCacheJson } from "@/tests/cache/support";

describe("wrong-patient protection", () => {
  it("suppresses evidence whose source document belongs to another patient", () => {
    const setup = mariaEvidenceSetup();
    const candidate = setup.candidates[0];
    if (!candidate) throw new Error("Maria fixture has no candidate");
    const affectedDocs = new Set(candidate.evidence_refs.map((ref) => ref.source_doc_id));
    const records = setup.records.map((record) =>
      affectedDocs.has(record.source_doc_id)
        ? { ...record, patient_id: "22222222-2222-5222-8222-222222222222" }
        : record,
    );
    const context = createEvidenceVerificationContext(setup.events, records, {
      event_store_hash: hashClinicalEvents(setup.events),
    });
    const results = verifyCandidateGaps([clone(candidate)], context);
    expect(results[0]?.status).toBe("suppressed");
    expect(results[0]?.bundle.failures.some((failure) => failure.code === "EV-002")).toBe(true);
  });

  it("fails cache validation when evidence is swapped to another patient", () => {
    const dir = copyCache("safety-wrong-patient");
    const gaps = readCacheJson<{
      verified_gaps: Array<{ patient_id: string; evidence_bundle: { positive: Array<{ patient_id: string }> } }>;
    }>("verified-gaps.json", dir);
    const first = gaps.verified_gaps[0];
    const other = gaps.verified_gaps.find((gap) => gap.patient_id !== first?.patient_id);
    if (!first?.evidence_bundle.positive[0] || !other) throw new Error("fixture lacks evidence to swap");
    first.evidence_bundle.positive[0].patient_id = other.patient_id;
    writeCacheJson(dir, "verified-gaps.json", gaps);
    const report = validateDir(dir);
    expect(report.status).toBe("FAIL");
    expect(report.checks.find((check) => check.name === "cross references")?.passed).toBe(false);
    cleanupCacheCopies();
  });

  it("keeps every frozen gap's evidence inside its own patient", () => {
    const cache = loadDemoCache();
    for (const gap of cache.verifiedGaps) {
      for (const source of gap.evidence_bundle.positive) {
        expect(source.patient_id).toBe(gap.patient_id);
      }
      expect(gap.evidence_bundle.patient_id).toBe(gap.patient_id);
    }
  });
});

import { describe, expect, it } from "vitest";
import { verifyCandidateGap, type EvidenceVerificationContext } from "@/lib/evidence";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

describe("source document verification", () => {
  it("verifies every Maria candidate against existing owned documents", () => {
    const setup = mariaEvidenceSetup();
    expect(setup.results).toHaveLength(3);
    for (const result of setup.results) {
      expect(result.bundle.failures).toEqual([]);
      expect(result.bundle.positive.every((item) => item.verified)).toBe(true);
    }
  });

  it("rejects a missing source document", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    candidate.evidence_refs[0]!.source_doc_id = "00000000-0000-5000-8000-000000000000";
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-001")).toBe(true);
  });

  it("rejects a document whose content hash no longer matches", () => {
    const setup = mariaEvidenceSetup();
    const candidate = findCandidate(setup.candidates, "missed_followup");
    const records = setup.records.map((record) =>
      record.patient_id === candidate.patient_id
        ? { ...record, content_hash: "0".repeat(64) }
        : record,
    );
    const context: EvidenceVerificationContext = { ...setup.context, records_by_id: new Map(records.map((record) => [record.source_doc_id, record])) };
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-003")).toBe(true);
  });

  it("rejects source text changed after extraction", () => {
    const setup = mariaEvidenceSetup();
    const candidate = findCandidate(setup.candidates, "missed_followup");
    const records = setup.records.map((record) =>
      record.source_doc_id === candidate.evidence_refs[0]!.source_doc_id
        ? { ...record, text: `${record.text}\nAltered after extraction.` }
        : record,
    );
    const context: EvidenceVerificationContext = { ...setup.context, records_by_id: new Map(records.map((record) => [record.source_doc_id, record])) };
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-003")).toBe(true);
  });
});

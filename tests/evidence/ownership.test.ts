import { describe, expect, it } from "vitest";
import { verifyCandidateGap, type EvidenceVerificationContext } from "@/lib/evidence";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

describe("patient and event ownership", () => {
  it("rejects a citation to another patient's document", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const foreign = setup.context.records.find((record) => record.patient_id !== candidate.patient_id);
    expect(foreign).toBeDefined();
    candidate.evidence_refs[0]!.source_doc_id = foreign!.source_doc_id;
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-002")).toBe(true);
  });

  it("rejects an event cited for the wrong patient at the bundle boundary", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "med_monitoring"));
    const foreignEvent = setup.context.events.find((event) => event.patient_id !== candidate.patient_id);
    if (foreignEvent) {
      candidate.trigger_event_ids = [foreignEvent.event_id];
      candidate.evidence_refs[0]!.event_id = foreignEvent.event_id;
      candidate.evidence_refs[0]!.source_doc_id = foreignEvent.source.source_doc_id;
    } else {
      const foreignRecord = setup.context.records.find((record) => record.patient_id !== candidate.patient_id);
      expect(foreignRecord).toBeDefined();
      candidate.evidence_refs[0]!.source_doc_id = foreignRecord!.source_doc_id;
    }
    const context: EvidenceVerificationContext = setup.context;
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-002" || failure.code === "EV-003")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import type { CanonicalClinicalEvent, SourceRecord } from "@/lib/domain";
import { verifyCandidateGap } from "@/lib/evidence";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { clone, findCandidate, mariaEvidenceSetup, sha256 } from "../support/evidence";

function withIrrelevantDocument(records: SourceRecord[], candidate: ReturnType<typeof findCandidate>): SourceRecord[] {
  const extra: SourceRecord = {
    source_doc_id: "irrelevant-document",
    fixture_key: "DOC-IRRELEVANT",
    patient_id: candidate.patient_id,
    doc_type: "other",
    provider: "Unrelated Clinic",
    provider_type: "other",
    date: "2026-01-01",
    text: "Unrelated administrative note. No clinical facts relevant to any gap.",
    content_hash: sha256("Unrelated administrative note. No clinical facts relevant to any gap."),
    dataset_version: "continua-synth-v1",
    generator_version: "test",
    synthetic: true,
  };
  return [...records, extra];
}

describe("trust metamorphic properties TM-01..TM-05", () => {
  it("TM-01 adding an irrelevant document does not invalidate verified evidence", () => {
    const setup = mariaEvidenceSetup();
    const candidate = findCandidate(setup.candidates, "missed_followup");
    const records = withIrrelevantDocument(setup.records, candidate);
    const context = { ...setup.context, records, records_by_id: new Map(records.map((record) => [record.source_doc_id, record])) };
    expect(verifyCandidateGap(candidate, context).status).toBe("verified");
  });

  it("TM-02 reordering documents does not change verification", () => {
    const setup = mariaEvidenceSetup();
    const candidate = findCandidate(setup.candidates, "missed_followup");
    const records = [...setup.records].reverse();
    const context = { ...setup.context, records, records_by_id: new Map(records.map((record) => [record.source_doc_id, record])) };
    expect(verifyCandidateGap(candidate, context).status).toBe("verified");
  });

  it("TM-03 adding a valid completing consult invalidates the stale absence claim", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const base = setup.events.find((event) => event.event_type === "consult")!;
    const consult: CanonicalClinicalEvent = {
      ...clone(base),
      event_id: "consult-tm03",
      date: "2026-04-03",
      event_type: "consult",
      typed: { specialty_raw: "oncology", specialty_normalized: "oncology", mode: "telehealth", completion_status: "completed" },
    };
    const events = [...setup.events, consult];
    candidate.event_store_hash = hashClinicalEvents(events);
    const context = { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) };
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-009")).toBe(true);
  });

  it("TM-04 adding another valid citation does not weaken verification", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const extra = setup.events.find((event) => event.event_type === "lab_result");
    expect(extra).toBeDefined();
    candidate.evidence_refs.push({
      event_id: extra!.event_id,
      source_doc_id: extra!.source.source_doc_id,
      source_span: extra!.source.source_span,
    });
    expect(verifyCandidateGap(candidate, setup.context).status).toBe("verified");
  });

  it("TM-05 display text does not affect evidence correctness", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "med_monitoring"));
    candidate.rationale.facts.display_note = "Coordinator-facing display text changed.";
    expect(verifyCandidateGap(candidate, setup.context).status).toBe("verified");
  });
});

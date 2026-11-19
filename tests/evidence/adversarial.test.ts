import { afterEach, describe, expect, it, vi } from "vitest";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { verifyCandidateGap } from "@/lib/evidence";
import { verifyEvidenceSpan } from "@/lib/evidence/verify-span";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Phase 7 red-team attacks A..J", () => {
  it("Attack A rejects a plausible but unsupported source span", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    candidate.evidence_refs[0]!.source_span =
      "Referral to Cardiology for palliative symptom management (chemotherapy and hospice planning). Please schedule within 14 days.";
    expect(verifyCandidateGap(candidate, setup.context).status).toBe("suppressed");
  });

  it("Attack B rejects the correct span under the wrong patient", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const foreign = setup.context.records.find((record) => record.patient_id !== candidate.patient_id)!;
    candidate.evidence_refs[0]!.source_doc_id = foreign.source_doc_id;
    expect(verifyCandidateGap(candidate, setup.context).status).toBe("suppressed");
  });

  it("Attack C rejects a referral whose matching consult now exists", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const base = setup.events.find((event) => event.event_type === "consult")!;
    const consult: CanonicalClinicalEvent = {
      ...clone(base),
      event_id: "attack-c-consult",
      date: "2026-03-30",
      event_type: "consult",
      typed: { specialty_raw: "oncology", specialty_normalized: "oncology", mode: "in_person", completion_status: "completed" },
    };
    const events = [...setup.events, consult];
    candidate.event_store_hash = hashClinicalEvents(events);
    const context = { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) };
    expect(verifyCandidateGap(candidate, context).status).toBe("suppressed");
  });

  it("Attack D rejects two CBC sources that collapse to one occurrence", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "duplicate_test"));
    const first = candidate.evidence_refs[0]!;
    candidate.evidence_refs = [first];
    candidate.trigger_event_ids = [candidate.metadata.first_event_id];
    candidate.metadata.second_event_id = candidate.metadata.first_event_id;
    candidate.metadata.second_date = candidate.metadata.first_date;
    candidate.metadata.days_between = 0;
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-010")).toBe(true);
  });

  it("Attack E rejects a modified benchmark window", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    candidate.window_days = 30;
    expect(verifyCandidateGap(candidate, setup.context).status).toBe("suppressed");
  });

  it("Attack F rejects source text changed after extraction", () => {
    const setup = mariaEvidenceSetup();
    const candidate = findCandidate(setup.candidates, "missed_followup");
    const records = setup.records.map((record) =>
      record.source_doc_id === candidate.evidence_refs[0]!.source_doc_id
        ? { ...record, text: `${record.text} Mutation after extraction.` }
        : record,
    );
    const context = { ...setup.context, records_by_id: new Map(records.map((record) => [record.source_doc_id, record])) };
    expect(verifyCandidateGap(candidate, context).status).toBe("suppressed");
  });

  it("Attack G rejects fuzzy support below 0.85", () => {
    const result = verifyEvidenceSpan(
      "Cardiology referral for routine follow-up after a completely unrelated outpatient episode and annual review.",
      "Referral to Medical Oncology for adjuvant therapy evaluation (endocrine therapy and radiation planning). Please schedule within 45 days.",
    );
    expect(result.score).toBeLessThan(0.85);
    expect(result.supported).toBe(false);
  });

  it("Attack H rejects a tiny generic phrase that fuzzy-matches elsewhere", () => {
    const result = verifyEvidenceSpan("routine follow", "Routine care was documented after the visit.");
    expect(result.supported).toBe(false);
  });

  it("Attack I works when no model or network is available", () => {
    vi.stubGlobal("fetch", () => {
      throw new Error("Model and network unavailable");
    });
    const setup = mariaEvidenceSetup();
    expect(setup.results.every((result) => result.status === "verified")).toBe(true);
  });

  it("Attack J works without ground-truth labels", () => {
    const setup = mariaEvidenceSetup();
    expect(JSON.stringify(setup.context)).not.toContain("ground_truth");
    expect(setup.results.every((result) => result.status === "verified")).toBe(true);
  });
});

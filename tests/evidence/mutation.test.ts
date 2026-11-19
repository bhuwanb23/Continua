import { describe, expect, it } from "vitest";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { collectEvidence } from "@/lib/evidence/collect";
import { bundleSemanticFingerprint, verifyEvidenceBundle } from "@/lib/evidence/verify-gap";
import { verifyCandidateGap } from "@/lib/evidence";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

describe("evidence mutation suite EV-M1..EV-M8", () => {
  it("EV-M1 rejects a nonexistent source document", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    candidate.evidence_refs[0]!.source_doc_id = "missing-document";
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.bundle.failures.some((failure) => failure.code === "EV-001")).toBe(true);
  });

  it("EV-M2 rejects another patient's source", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const foreign = setup.context.records.find((record) => record.patient_id !== candidate.patient_id);
    candidate.evidence_refs[0]!.source_doc_id = foreign!.source_doc_id;
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.bundle.failures.some((failure) => failure.code === "EV-002")).toBe(true);
  });

  it("EV-M3 rejects a changed quoted span", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "duplicate_test"));
    candidate.evidence_refs[0]!.source_span = "CBC with differential: normal.";
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.bundle.failures.some((failure) => failure.code === "EV-004" || failure.code === "EV-003")).toBe(true);
  });

  it("EV-M4 rejects a normalized specialty contradicted by its source", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const events = clone(setup.events).map((event) =>
      event.event_id === candidate.metadata.referral_event_id && event.event_type === "referral"
        ? { ...event, typed: { ...event.typed, specialty_normalized: "cardiology" } }
        : event,
    );
    candidate.event_store_hash = hashClinicalEvents(events);
    const result = verifyCandidateGap(candidate, { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) });
    expect(result.bundle.failures.some((failure) => failure.code === "EV-005")).toBe(true);
  });

  it("EV-M5 rejects removal of a required policy", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "med_monitoring"));
    const { bundle } = collectEvidence(candidate, setup.context);
    bundle.policy = [];
    const result = verifyEvidenceBundle(candidate, bundle, setup.context);
    expect(result.failures.some((failure) => failure.code === "EV-006")).toBe(true);
  });

  it("EV-M6 rejects a modified absence query window", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const { bundle } = collectEvidence(candidate, setup.context);
    bundle.absence[0]!.search_definition.end_date = "2026-05-08";
    const result = verifyEvidenceBundle(candidate, bundle, setup.context);
    expect(result.failures.some((failure) => failure.code === "EV-008")).toBe(true);
  });

  it("EV-M7 rejects zero absence evidence when a matching consult exists", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const base = setup.events.find((event) => event.event_type === "consult")!;
    const consult: CanonicalClinicalEvent = {
      ...clone(base),
      event_id: "consult-added-m7",
      date: "2026-04-02",
      event_type: "consult",
      typed: { specialty_raw: "oncology", specialty_normalized: "oncology", mode: "in_person", completion_status: "completed" },
    };
    const events = [...setup.events, consult];
    candidate.event_store_hash = hashClinicalEvents(events);
    const context = { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) };
    const result = verifyCandidateGap(candidate, context);
    expect(result.bundle.failures.some((failure) => failure.code === "EV-009")).toBe(true);
  });

  it("EV-M8 treats evidence ordering as semantically irrelevant", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "duplicate_test"));
    const { bundle } = collectEvidence(candidate, setup.context);
    const before = bundleSemanticFingerprint(bundle);
    bundle.positive.reverse();
    bundle.absence.reverse();
    bundle.policy.reverse();
    bundle.claims.reverse();
    const after = bundleSemanticFingerprint(bundle);
    expect(after).toBe(before);
    const result = verifyEvidenceBundle(candidate, bundle, setup.context);
    expect(result.failures).toEqual([]);
  });
});

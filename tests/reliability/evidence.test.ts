import { describe, expect, it } from "vitest";
import type { CandidateGap } from "@/lib/domain";
import { hashClinicalEvents } from "@/lib/clinical-events";
import {
  createEvidenceVerificationContext,
  verifyCandidateGap,
  verifyCandidateGaps,
} from "@/lib/evidence";
import { mariaEvidenceSetup } from "@/tests/support/evidence";

const setup = mariaEvidenceSetup();
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const followUp = (): CandidateGap => clone(setup.candidates.find((gap) => gap.gap_type === "missed_followup")!);

describe("evidence fail-closed behavior", () => {
  it("verifies the untouched Maria evidence package", () => {
    expect(setup.results.every((result) => result.status === "verified")).toBe(true);
  });

  it("EVID-01 suppresses when a source document is missing", () => {
    const context = createEvidenceVerificationContext(setup.events, [], {
      event_store_hash: setup.context.event_store_hash,
    });
    const results = verifyCandidateGaps(setup.candidates, context);
    expect(results.every((result) => result.status === "suppressed")).toBe(true);
  });

  it("EVID-02 suppresses a wrong-patient candidate", () => {
    const candidate = followUp();
    candidate.patient_id = "00000000-0000-5000-8000-000000000099";
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
  });

  it("EVID-03 suppresses an altered source span", () => {
    const events = clone(setup.events);
    const target = events.find((event) => event.event_id === followUp().trigger_event_ids[0]);
    if (target) target.source = { ...target.source, source_span: "A span that never existed in the record." };
    const context = createEvidenceVerificationContext(events, setup.records, {
      event_store_hash: hashClinicalEvents(events),
    });
    const candidate = followUp();
    candidate.event_store_hash = context.event_store_hash;
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
  });

  it("EVID-06 suppresses a stale event store", () => {
    const result = verifyCandidateGap(followUp(), {
      ...setup.context,
      event_store_hash: "0".repeat(64),
    });
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.map((failure) => failure.code)).toContain("EV-011");
  });

  it("EVID-07 suppresses an absence contradicted by a matching event", () => {
    const events = clone(setup.events);
    const consult = events.find((event) => event.event_type === "consult")!;
    const oncology = clone(consult);
    oncology.event_id = "00000000-0000-5000-8000-0000000000aa";
    oncology.date = "2026-04-01";
    oncology.typed = {
      ...(oncology.typed as unknown as Record<string, unknown>),
      specialty_raw: "oncology",
      specialty_normalized: "oncology",
    } as typeof oncology.typed;
    events.push(oncology);
    const context = createEvidenceVerificationContext(events, setup.records, {
      event_store_hash: hashClinicalEvents(events),
      evaluation_as_of_date: "2026-06-05",
    });
    const candidate = followUp();
    candidate.event_store_hash = context.event_store_hash;
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.map((failure) => failure.code)).toContain("EV-009");
  });

  it("keeps verified evidence inspectable", () => {
    const result = setup.results.find((item) => item.candidate.gap_type === "missed_followup")!;
    expect(result.verified_gap?.evidence_deep_dive.sources.length).toBeGreaterThan(0);
    expect(result.verified_gap?.evidence_deep_dive.absence_checks.length).toBeGreaterThan(0);
    expect(result.verified_gap?.evidence_bundle.claim_coverage).toBe(1);
  });
});

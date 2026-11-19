import { describe, expect, it } from "vitest";
import { verifyCandidateGap } from "@/lib/evidence";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

describe("critical normalized field support", () => {
  it("rejects a specialty changed only in the canonical event", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const events = clone(setup.events).map((event) =>
      event.event_id === candidate.metadata.referral_event_id && event.event_type === "referral"
        ? { ...event, typed: { ...event.typed, specialty_normalized: "cardiology" } }
        : event,
    );
    candidate.event_store_hash = hashClinicalEvents(events);
    const result = verifyCandidateGap(candidate, { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) });
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-005")).toBe(true);
  });

  it("rejects a referral that is completed in the current event store", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const events = clone(setup.events).map((event) =>
      event.event_id === candidate.metadata.referral_event_id && event.event_type === "referral"
        ? { ...event, typed: { ...event.typed, status: "completed" as const } }
        : event,
    );
    candidate.event_store_hash = hashClinicalEvents(events);
    const result = verifyCandidateGap(candidate, { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) });
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-010")).toBe(true);
  });

  it("rejects a duplicate-test identity unsupported by the source", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "duplicate_test"));
    candidate.metadata.normalized_identity = "lab:bmp";
    candidate.identity.test = "bmp";
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-005")).toBe(true);
  });

  it("rejects a monitoring medication identity unsupported by the source", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "med_monitoring"));
    candidate.metadata.medication = "warfarin";
    candidate.identity.drug = "warfarin";
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-005" || failure.code === "EV-007")).toBe(true);
  });
});

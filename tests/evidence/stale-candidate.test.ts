import { describe, expect, it } from "vitest";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { verifyCandidateGap } from "@/lib/evidence";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

describe("stale candidate detection", () => {
  it("rejects a candidate whose event-store hash no longer matches", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "med_monitoring"));
    const extra: CanonicalClinicalEvent = {
      ...clone(setup.events[0]!),
      event_id: "irrelevant-new-event",
      date: "2026-05-30",
      event_type: "followup",
      typed: { topic: "routine", mode: "phone", status: "completed" },
    };
    const events = [...setup.events, extra];
    const context = {
      ...setup.context,
      events,
      events_by_id: new Map(events.map((event) => [event.event_id, event])),
      event_store_hash: hashClinicalEvents(events),
    };
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-011")).toBe(true);
    expect(hashClinicalEvents(events)).not.toBe(candidate.event_store_hash);
  });

  it("rejects a candidate with no event-store identity", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "duplicate_test"));
    delete candidate.event_store_hash;
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-011")).toBe(true);
  });

  it("rejects a candidate from another detector version", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "duplicate_test"));
    candidate.detector_version = "gaps-v0" as typeof candidate.detector_version;
    const result = verifyCandidateGap(candidate, setup.context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-011")).toBe(true);
  });
});

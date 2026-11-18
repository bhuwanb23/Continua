import { describe, expect, it } from "vitest";
import { InMemoryTimelineRepository } from "@/lib/repositories/in-memory";
import { canonicalEvent } from "../support/clinical-events";

describe("accepted ClinicalEvent store", () => {
  it("returns only the requested patient in deterministic order", async () => {
    const later = canonicalEvent({ event_id: "event-2", date: "2026-05-01" });
    const earlier = canonicalEvent({ event_id: "event-1", date: "2026-04-01" });
    const other = canonicalEvent({ event_id: "event-3", patient_id: "patient-2" });
    const repository = new InMemoryTimelineRepository([later, other, earlier]);
    const events = await repository.listByPatient("patient-1");
    expect(events.map((event) => event.event_id)).toEqual(["event-1", "event-2"]);
  });
});

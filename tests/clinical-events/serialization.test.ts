import { describe, expect, it } from "vitest";
import { hashClinicalEvents, serializeClinicalEvents, sortClinicalEvents } from "@/lib/clinical-events";
import { canonicalEvent } from "../support/clinical-events";

describe("ClinicalEvent serialization", () => {
  it("sorts independently of input insertion order", () => {
    const later = canonicalEvent({ event_id: "event-2", date: "2026-05-01" });
    const earlier = canonicalEvent({ event_id: "event-1", date: "2026-04-01" });
    expect(serializeClinicalEvents([later, earlier])).toBe(serializeClinicalEvents([earlier, later]));
    expect(sortClinicalEvents([later, earlier])[0]?.date).toBe("2026-04-01");
  });

  it("produces a stable content hash", () => {
    const events = [canonicalEvent()];
    expect(hashClinicalEvents(events)).toBe(hashClinicalEvents(structuredClone(events)));
  });
});

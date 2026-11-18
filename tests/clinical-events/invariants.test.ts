import { describe, expect, it } from "vitest";
import { canonicalEvent } from "../support/clinical-events";
import { eventFingerprint } from "@/lib/clinical-events";

describe("ClinicalEvent v1 invariants", () => {
  it("keeps event identity, provenance, and patient ownership explicit", () => {
    const event = canonicalEvent();
    expect(event.patient_id).toBeTruthy();
    expect(event.source.source_doc_id).toBeTruthy();
    expect(event.source.source_span).toBeTruthy();
    expect(event.event_id).toBeTruthy();
  });

  it("contains no detector decision or clinical-risk fields", () => {
    const serialized = JSON.stringify(canonicalEvent()).toLowerCase();
    for (const forbidden of ["gap_type", "risk_score", "risk_level", "priority_band", "recommended_action"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("provides typed fields needed by future detectors without parsing description", () => {
    const event = canonicalEvent();
    expect(event.typed).toHaveProperty("specialty_normalized");
    expect(eventFingerprint(event)).not.toContain(event.description.toLowerCase());
  });
});

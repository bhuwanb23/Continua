import { describe, expect, it } from "vitest";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { collectEvidence } from "@/lib/evidence/collect";
import { verifyEvidenceBundle } from "@/lib/evidence/verify-gap";
import { verifyCandidateGap } from "@/lib/evidence";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { clone, findCandidate, mariaEvidenceSetup } from "../support/evidence";

describe("absence evidence", () => {
  it("records the exact Maria follow-up search and zero completions", () => {
    const setup = mariaEvidenceSetup();
    const result = setup.results.find((item) => item.candidate.gap_type === "missed_followup");
    const absence = result?.bundle.absence[0];
    expect(absence?.search_definition).toEqual({
      event_types: ["consult", "followup"],
      normalized_identity: "specialty:oncology",
      start_date: "2026-03-25",
      end_date: "2026-05-09",
    });
    expect(absence?.matching_event_count).toBe(0);
    expect(absence?.verified).toBe(true);
  });

  it("fails a stale follow-up gap when a qualifying consult now exists", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const base = setup.events.find((event) => event.event_type === "consult");
    expect(base).toBeDefined();
    const consult: CanonicalClinicalEvent = {
      ...clone(base!),
      event_id: "consult-oncology-new",
      date: "2026-04-01",
      event_type: "consult",
      typed: {
        specialty_raw: "oncology",
        specialty_normalized: "oncology",
        mode: "in_person",
        completion_status: "completed",
      },
    };
    const events = [...setup.events, consult];
    candidate.event_store_hash = hashClinicalEvents(events);
    const context = { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) };
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-009")).toBe(true);
  });

  it("rejects a modified absence window", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "missed_followup"));
    const { bundle } = collectEvidence(candidate, setup.context);
    const absence = bundle.absence[0]!;
    absence.search_definition.start_date = "2026-03-24";
    const result = verifyEvidenceBundle(candidate, bundle, setup.context);
    expect(result.failures.some((failure) => failure.code === "EV-008")).toBe(true);
  });

  it("fails monitoring when a qualifying A1C result now exists", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "med_monitoring"));
    const base = setup.events.find((event) => event.event_type === "lab_result");
    expect(base).toBeDefined();
    const lab: CanonicalClinicalEvent = {
      ...clone(base!),
      event_id: "a1c-monitoring-new",
      date: "2026-03-15",
      event_type: "lab_result",
      typed: {
        test_name_raw: "A1C",
        test_code_normalized: "a1c",
        value: 7.1,
        unit: "%",
        abnormal: true,
        series_status: "unknown",
      },
    };
    const events = [...setup.events, lab];
    candidate.event_store_hash = hashClinicalEvents(events);
    const context = { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) };
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-009")).toBe(true);
  });

  it("fails duplicate evidence when explicit-series context exists", () => {
    const setup = mariaEvidenceSetup();
    const candidate = clone(findCandidate(setup.candidates, "duplicate_test"));
    const base = setup.events.find((event) => event.event_type === "lab_result");
    expect(base).toBeDefined();
    const series: CanonicalClinicalEvent = {
      ...clone(base!),
      event_id: "cbc-series-new",
      date: "2026-04-25",
      event_type: "lab_result",
      typed: {
        test_name_raw: "CBC with differential",
        test_code_normalized: "cbc",
        series_status: "explicit_series",
      },
    };
    const events = [...setup.events, series];
    candidate.event_store_hash = hashClinicalEvents(events);
    const context = { ...setup.context, events, events_by_id: new Map(events.map((event) => [event.event_id, event])) };
    const result = verifyCandidateGap(candidate, context);
    expect(result.status).toBe("suppressed");
    expect(result.bundle.failures.some((failure) => failure.code === "EV-009")).toBe(true);
  });
});

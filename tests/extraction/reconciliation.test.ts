import { describe, expect, it } from "vitest";
import { reconcileClinicalEvents } from "@/lib/reconciliation";
import type { CanonicalClinicalEvent, LabResultEvent, SourceRecord } from "@/lib/domain";
import { deterministicId } from "@/lib/ids";
import { canonicalEvent, TEST_PATIENT_ID } from "../support/clinical-events";

function docId(key: string): string {
  return deterministicId("test-doc", key);
}

function eventId(key: string): string {
  return deterministicId("test-event", key);
}

function sourceRecord(key: string, date: string): SourceRecord {
  return {
    source_doc_id: docId(key),
    fixture_key: key,
    patient_id: TEST_PATIENT_ID,
    doc_type: "lab_report",
    provider: "Dr. Test",
    provider_type: "pcp",
    date,
    text: "CBC result.",
    dataset_version: "continua-synth-v1",
    generator_version: "generator-v1",
    synthetic: true,
  };
}

function labEvent(
  key: string,
  docKey: string,
  overrides: Partial<LabResultEvent> = {},
): CanonicalClinicalEvent {
  return canonicalEvent({
    event_id: eventId(key),
    event_type: "lab_result",
    date: "2026-04-20",
    description: "CBC result",
    provider_type: "pcp",
    mention_context: "contemporaneous",
    source: {
      source_doc_id: docId(docKey),
      source_span: "CBC result.",
      verification_method: "exact",
      verification_score: 1,
    },
    typed: {
      test_name_raw: "CBC",
      test_code_normalized: "cbc",
      value: 13.2,
      unit: "g/dL",
      abnormal: false,
      series_status: "unknown",
    },
    ...overrides,
  });
}

describe("cross-document reconciliation", () => {
  it("merges contemporaneous duplicates and keeps the earliest document as representative", () => {
    const records = [sourceRecord("lab", "2026-04-20"), sourceRecord("summary", "2026-04-28")];
    const original = labEvent("original", "lab");
    const copied = labEvent("copied", "summary", { description: "CBC copied into summary" });
    const result = reconcileClinicalEvents([copied, original], records);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.event_id).toBe(original.event_id);
    expect(result.ledger.merged_duplicates).toEqual([
      {
        event_id: copied.event_id,
        retained_event_id: original.event_id,
        fingerprint: expect.any(String),
        source_doc_id: docId("summary"),
      },
    ]);
  });

  it("breaks representative ties by source_doc_id", () => {
    const records = [sourceRecord("a-doc", "2026-04-20"), sourceRecord("b-doc", "2026-04-20")];
    const first = labEvent("z-event", "a-doc");
    const second = labEvent("a-event", "b-doc");
    const result = reconcileClinicalEvents([second, first], records);
    expect(result.events).toHaveLength(1);
    const expectedDoc = [docId("a-doc"), docId("b-doc")].sort()[0];
    expect(result.events[0]?.source.source_doc_id).toBe(expectedDoc);
  });

  it("never merges different result values or different dates", () => {
    const records = [sourceRecord("lab", "2026-04-20")];
    const base = labEvent("base", "lab");
    const differentValue = labEvent("value", "lab", {
      typed: {
        test_name_raw: "CBC",
        test_code_normalized: "cbc",
        value: 9.1,
        unit: "g/dL",
        abnormal: true,
        series_status: "unknown",
      },
    });
    const differentDate = labEvent("date", "lab", { date: "2026-05-01" });
    const result = reconcileClinicalEvents([base, differentValue, differentDate], records);
    expect(result.events).toHaveLength(3);
    expect(result.ledger.merged_duplicates).toHaveLength(0);
  });

  it("merges unknown mentions only when fingerprint and typed payload are identical", () => {
    const records = [sourceRecord("lab", "2026-04-20"), sourceRecord("copy", "2026-04-22")];
    const anchor = labEvent("anchor", "lab");
    const copied = labEvent("copied", "copy", { mention_context: "unknown" });
    const divergent = labEvent("divergent", "copy", {
      mention_context: "unknown",
      typed: {
        test_name_raw: "CBC",
        test_code_normalized: "cbc",
        value: 13.2,
        unit: "g/dL",
        abnormal: true,
        series_status: "unknown",
      },
    });
    const result = reconcileClinicalEvents([anchor, copied, divergent], records);
    expect(result.events).toHaveLength(2);
    expect(result.ledger.merged_duplicates).toEqual([
      {
        event_id: copied.event_id,
        retained_event_id: anchor.event_id,
        fingerprint: expect.any(String),
        source_doc_id: docId("copy"),
      },
    ]);
  });

  it("keeps unknown events separate from a contemporaneous occurrence with a different payload", () => {
    const records = [sourceRecord("lab", "2026-04-20")];
    const anchor = labEvent("anchor", "lab");
    const other = labEvent("other", "lab", {
      mention_context: "unknown",
      typed: {
        test_name_raw: "CBC",
        test_code_normalized: "cbc",
        value: 13.2,
        unit: "g/dL",
        abnormal: null,
        series_status: "unknown",
      },
    });
    const result = reconcileClinicalEvents([anchor, other], records);
    expect(result.events).toHaveLength(2);
    expect(result.ledger.merged_duplicates).toHaveLength(0);
  });

  it("produces identical output regardless of input order", () => {
    const records = [sourceRecord("lab", "2026-04-20"), sourceRecord("summary", "2026-04-28")];
    const events = [
      labEvent("one", "lab"),
      labEvent("two", "summary"),
      labEvent("three", "summary", { date: "2026-05-01" }),
      labEvent("four", "lab", { mention_context: "historical_reference" }),
    ];
    const forward = reconcileClinicalEvents(events, records);
    const backward = reconcileClinicalEvents([...events].reverse(), records);
    expect(JSON.stringify(forward)).toBe(JSON.stringify(backward));
  });
});
import { describe, expect, it } from "vitest";
import { reconcileClinicalEvents } from "@/lib/reconciliation";
import type { CanonicalClinicalEvent, LabResultEvent, MentionContext, SourceRecord } from "@/lib/domain";
import { deterministicId } from "@/lib/ids";
import { canonicalEvent, TEST_PATIENT_ID } from "../support/clinical-events";

function docId(key: string): string {
  return deterministicId("test-doc", key);
}

function eventId(key: string): string {
  return deterministicId("test-event", key);
}

function sourceRecord(key: string, date: string, docType: SourceRecord["doc_type"]): SourceRecord {
  return {
    source_doc_id: docId(key),
    fixture_key: key,
    patient_id: TEST_PATIENT_ID,
    doc_type: docType,
    provider: "Dr. Test",
    provider_type: docType === "lab_report" ? "lab" : "pcp",
    date,
    text: "CBC reviewed.",
    dataset_version: "continua-synth-v1",
    generator_version: "generator-v1",
    synthetic: true,
  };
}

function cbcEvent(
  key: string,
  docKey: string,
  mentionContext: MentionContext,
  overrides: Partial<LabResultEvent> = {},
): CanonicalClinicalEvent {
  return canonicalEvent({
    event_id: eventId(key),
    event_type: "lab_result",
    date: "2026-04-20",
    description: "CBC result",
    provider_type: "lab",
    mention_context: mentionContext,
    source: {
      source_doc_id: docId(docKey),
      source_span: "CBC reviewed.",
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

describe("historical mention reconciliation (EX-11)", () => {
  it("lab report 4/20 + PCP note 4/28 reviewing it yields one CBC occurrence", () => {
    const records = [
      sourceRecord("lab", "2026-04-20", "lab_report"),
      sourceRecord("pcp-note", "2026-04-28", "consult_note"),
    ];
    const performed = cbcEvent("performed", "lab", "contemporaneous");
    const mention = cbcEvent("mention", "pcp-note", "historical_reference", {
      description: "Reviewed CBC from 4/20",
      provider_type: "pcp",
    });
    const result = reconcileClinicalEvents([mention, performed], records);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.event_id).toBe(performed.event_id);
    expect(result.ledger.merged_duplicates).toHaveLength(0);
    expect(result.ledger.attached_provenance).toEqual([
      {
        event_id: mention.event_id,
        retained_event_id: performed.event_id,
        fingerprint: expect.any(String),
        source: mention.source,
      },
    ]);
  });

  it("retains an unmatched historical mention conservatively", () => {
    const records = [sourceRecord("pcp-note", "2026-04-28", "consult_note")];
    const mention = cbcEvent("mention", "pcp-note", "historical_reference");
    const result = reconcileClinicalEvents([mention], records);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.mention_context).toBe("historical_reference");
    expect(result.ledger.retained_historical).toEqual([
      {
        event_id: mention.event_id,
        fingerprint: expect.any(String),
        source_doc_id: docId("pcp-note"),
      },
    ]);
    expect(result.ledger.attached_provenance).toHaveLength(0);
  });

  it("attaches repeated historical mentions of the same prior event to one retained reference", () => {
    const records = [
      sourceRecord("note-a", "2026-04-28", "consult_note"),
      sourceRecord("note-b", "2026-05-02", "followup"),
    ];
    const first = cbcEvent("first", "note-a", "historical_reference");
    const second = cbcEvent("second", "note-b", "historical_reference");
    const result = reconcileClinicalEvents([second, first], records);
    expect(result.events).toHaveLength(1);
    expect(result.ledger.retained_historical).toHaveLength(1);
    expect(result.ledger.attached_provenance).toHaveLength(1);
    expect(result.ledger.attached_provenance[0]?.retained_event_id).toBe(result.events[0]?.event_id);
  });

  it("never attaches a historical mention to a different result value", () => {
    const records = [
      sourceRecord("lab", "2026-04-20", "lab_report"),
      sourceRecord("pcp-note", "2026-04-28", "consult_note"),
    ];
    const performed = cbcEvent("performed", "lab", "contemporaneous");
    const otherValue = cbcEvent("other", "pcp-note", "historical_reference", {
      typed: {
        test_name_raw: "CBC",
        test_code_normalized: "cbc",
        value: 8.4,
        unit: "g/dL",
        abnormal: true,
        series_status: "unknown",
      },
    });
    const result = reconcileClinicalEvents([performed, otherValue], records);
    expect(result.events).toHaveLength(2);
    expect(result.ledger.attached_provenance).toHaveLength(0);
    expect(result.ledger.retained_historical).toHaveLength(1);
  });
});
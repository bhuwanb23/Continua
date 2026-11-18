import { describe, expect, it } from "vitest";
import { FixtureDocumentExtractor } from "@/lib/extraction/fixture-extractor";
import { prepareExtractionEnvelope } from "@/lib/extraction/preprocess";
import type { CandidateClinicalEvent } from "@/lib/extraction/candidate-event";
import type { SourceRecord } from "@/lib/domain";
import { TEST_PATIENT_ID, TEST_SOURCE_DOC_ID } from "../support/clinical-events";

const record: SourceRecord = {
  source_doc_id: TEST_SOURCE_DOC_ID,
  fixture_key: "R1",
  patient_id: TEST_PATIENT_ID,
  doc_type: "referral",
  provider: "Dr. Test",
  provider_type: "pcp",
  date: "2026-03-25",
  text: "Referral to Medical Oncology. Please schedule within 45 days.",
  dataset_version: "continua-synth-v1",
  generator_version: "generator-v1",
  synthetic: true,
};

const referral: CandidateClinicalEvent = {
  event_type: "referral",
  date: "2026-03-25",
  description: "Referral to medical oncology",
  source_doc_id: TEST_SOURCE_DOC_ID,
  source_span: "Referral to Medical Oncology.",
  confidence: 0.9,
  mention_context: "contemporaneous",
  specialty_raw: "Medical Oncology",
  expected_window_days: 45,
  status: "placed",
};

describe("FixtureDocumentExtractor", () => {
  it("returns fixture candidates for a known document", async () => {
    const extractor = new FixtureDocumentExtractor({ [TEST_SOURCE_DOC_ID]: [referral] });
    const result = await extractor.extractDocument({ envelope: prepareExtractionEnvelope(record) });
    expect(result.candidates).toEqual([referral]);
    expect(result.metadata.status).toBe("ok");
    expect(result.metadata.live_or_cached).toBe("fixture");
    expect(result.metadata.candidate_event_count).toBe(1);
    expect(result.metadata.document_id).toBe(TEST_SOURCE_DOC_ID);
    expect(result.metadata.patient_id).toBe(TEST_PATIENT_ID);
  });

  it("returns zero events for an unknown document", async () => {
    const extractor = new FixtureDocumentExtractor({});
    const result = await extractor.extractDocument({ envelope: prepareExtractionEnvelope(record) });
    expect(result.candidates).toEqual([]);
    expect(result.metadata.candidate_event_count).toBe(0);
  });

  it("produces deterministic request ids across instances", async () => {
    const envelope = prepareExtractionEnvelope(record);
    const first = await new FixtureDocumentExtractor({}).extractDocument({ envelope });
    const second = await new FixtureDocumentExtractor({}).extractDocument({ envelope });
    expect(first.metadata.request_id).toBe(second.metadata.request_id);
  });
});

describe("prepareExtractionEnvelope", () => {
  it("whitelists record fields and never leaks fixture or scenario metadata", () => {
    const envelope = prepareExtractionEnvelope(record);
    expect(Object.keys(envelope).sort()).toEqual(
      [
        "content_hash",
        "document_date",
        "document_id",
        "document_type",
        "patient_id",
        "provider_display",
        "provider_type",
        "synthetic",
        "text",
      ].sort(),
    );
    expect(envelope.synthetic).toBe(true);
    expect(envelope.document_id).toBe(record.source_doc_id);
    expect(envelope.content_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("computes a stable content hash from the text", () => {
    const first = prepareExtractionEnvelope(record);
    const second = prepareExtractionEnvelope({ ...record, fixture_key: "R9" });
    expect(first.content_hash).toBe(second.content_hash);
  });
});
import { describe, expect, it } from "vitest";
import { asPatientExtractor, extractPatient } from "@/lib/extraction/batch";
import { MemoryExtractionCache } from "@/lib/extraction/cache";
import type {
  ClinicalEventDocumentExtractor,
  DocumentExtractionResult,
} from "@/lib/extraction/extractor";
import { FixtureDocumentExtractor } from "@/lib/extraction/fixture-extractor";
import { LlmRequestError } from "@/lib/extraction/provider";
import type { CandidateClinicalEvent } from "@/lib/schemas/candidate-event.schema";
import type { SourceRecord } from "@/lib/domain";
import { TEST_PATIENT_ID, TEST_SOURCE_DOC_ID } from "../support/clinical-events";

const DOC_2 = "00000000-0000-5000-8000-000000000004";

function makeRecord(sourceDocId: string, docType: SourceRecord["doc_type"], text: string): SourceRecord {
  return {
    source_doc_id: sourceDocId,
    fixture_key: `DOC-${sourceDocId.slice(-1)}`,
    patient_id: TEST_PATIENT_ID,
    doc_type: docType,
    provider: "Dr. Test",
    provider_type: docType === "lab_report" ? "lab" : "specialist",
    date: "2026-04-18",
    text,
    dataset_version: "continua-synth-v1",
    generator_version: "generator-v1",
    synthetic: true,
  };
}

const referralRecord = makeRecord(TEST_SOURCE_DOC_ID, "referral", "Referral to Medical Oncology. Please schedule within 45 days.");
const labRecord = makeRecord(DOC_2, "lab_report", "CBC: hemoglobin 13.2 g/dL.");

function referralCandidate(overrides: Partial<CandidateClinicalEvent> = {}): CandidateClinicalEvent {
  return {
    event_type: "referral",
    date: "2026-04-18",
    description: "Referral to medical oncology",
    source_doc_id: TEST_SOURCE_DOC_ID,
    source_span: "Referral to Medical Oncology.",
    specialty_raw: "Medical Oncology",
    expected_window_days: 45,
    status: "placed",
    confidence: 0.9,
    mention_context: "contemporaneous",
    ...overrides,
  } as CandidateClinicalEvent;
}

function labCandidate(): CandidateClinicalEvent {
  return {
    event_type: "lab_result",
    date: "2026-04-18",
    description: "CBC result",
    source_doc_id: DOC_2,
    source_span: "CBC: hemoglobin 13.2 g/dL.",
    test_name_raw: "CBC",
    value: 13.2,
    unit: "g/dL",
    series_status: "unknown",
    confidence: 0.9,
    mention_context: "contemporaneous",
  } as CandidateClinicalEvent;
}

class FailingExtractor implements ClinicalEventDocumentExtractor {
  readonly version = "failing-v1";
  readonly modelId = "failing";
  calls = 0;

  async extractDocument(): Promise<DocumentExtractionResult> {
    this.calls += 1;
    throw new LlmRequestError("Provider returned HTTP 503.", { retryable: true, status: 503 });
  }
}

const fastRetry = { sleep: async () => {}, baseDelayMs: 1 };

describe("extractPatient", () => {
  it("produces a COMPLETE canonical store from fixture candidates", async () => {
    const extractor = new FixtureDocumentExtractor({
      [TEST_SOURCE_DOC_ID]: [referralCandidate()],
      [DOC_2]: [labCandidate()],
    });
    const result = await extractPatient(extractor, [referralRecord, labRecord]);
    expect(result.status).toBe("COMPLETE");
    expect(result.store.accepted).toHaveLength(2);
    expect(result.store.rejected).toHaveLength(0);
    expect(result.store.metadata.extractor_version).toBe("fixture-extractor-v1");
    const referral = result.store.accepted.find((event) => event.event_type === "referral");
    expect(referral?.typed).toMatchObject({
      specialty_normalized: "oncology",
      expected_window_days: 45,
      window_source: "document",
    });
    expect(referral?.source.verification_method).toBe("exact");
    expect(result.documents.every((outcome) => outcome.metadata.live_or_cached === "fixture")).toBe(true);
  });

  it("marks the patient PARTIAL when one document fails after retries, with no fallback events", async () => {
    const failing = new FailingExtractor();
    const result = await extractPatient(failing, [referralRecord, labRecord], { retry: fastRetry });
    expect(result.status).toBe("FAILED");
    expect(result.store.accepted).toHaveLength(0);
    expect(failing.calls).toBe(6);
    expect(result.documents.every((outcome) => outcome.status === "failed")).toBe(true);
    expect(result.documents[0]?.metadata.attempt_count).toBe(3);
    expect(result.documents[0]?.candidates).toHaveLength(0);
  });

  it("marks the patient PARTIAL when only some documents fail", async () => {
    const fixture = new FixtureDocumentExtractor({ [TEST_SOURCE_DOC_ID]: [referralCandidate()] });
    const mixed: ClinicalEventDocumentExtractor = {
      version: "mixed-v1",
      modelId: "mixed",
      async extractDocument({ envelope }) {
        if (envelope.document_id === DOC_2) {
          throw new LlmRequestError("Provider returned HTTP 401.", { retryable: false, status: 401 });
        }
        return fixture.extractDocument({ envelope });
      },
    };
    const result = await extractPatient(mixed, [referralRecord, labRecord], { retry: fastRetry });
    expect(result.status).toBe("PARTIAL");
    expect(result.store.accepted).toHaveLength(1);
    const failed = result.documents.find((outcome) => outcome.document_id === DOC_2);
    expect(failed?.status).toBe("failed");
    expect(failed?.metadata.attempt_count).toBe(1);
  });

  it("rejects ungrounded candidates through provenance without keeping the fact", async () => {
    const extractor = new FixtureDocumentExtractor({
      [TEST_SOURCE_DOC_ID]: [referralCandidate({ source_span: "Invented oncology fact." } as Partial<CandidateClinicalEvent>)],
    });
    const result = await extractPatient(extractor, [referralRecord]);
    expect(result.status).toBe("COMPLETE");
    expect(result.store.accepted).toHaveLength(0);
    expect(result.store.rejected).toHaveLength(1);
    expect(result.store.rejected[0]?.code).toBe("CE-006");
  });

  it("applies the benchmark-policy window when the document states none", async () => {
    const record = makeRecord(TEST_SOURCE_DOC_ID, "referral", "Referral to Medical Oncology.");
    const extractor = new FixtureDocumentExtractor({
      [TEST_SOURCE_DOC_ID]: [referralCandidate({ expected_window_days: undefined } as Partial<CandidateClinicalEvent>)],
    });
    const result = await extractPatient(extractor, [record]);
    const referral = result.store.accepted[0];
    expect(referral?.typed).toMatchObject({ expected_window_days: 45, window_source: "benchmark_policy" });
  });

  it("serves cached candidates and canonical output on the second run", async () => {
    let calls = 0;
    const fixture = new FixtureDocumentExtractor({ [TEST_SOURCE_DOC_ID]: [referralCandidate()] });
    const counting: ClinicalEventDocumentExtractor = {
      version: fixture.version,
      modelId: fixture.modelId,
      async extractDocument(request) {
        calls += 1;
        return fixture.extractDocument(request);
      },
    };
    const candidateCache = new MemoryExtractionCache();
    const canonicalCache = new MemoryExtractionCache();
    const first = await extractPatient(counting, [referralRecord], { candidateCache, canonicalCache });
    expect(first.status).toBe("COMPLETE");
    expect(calls).toBe(1);

    const second = await extractPatient(counting, [referralRecord], { candidateCache, canonicalCache });
    expect(calls).toBe(1);
    expect(second.store.accepted).toEqual(first.store.accepted);
    expect(second.documents[0]?.metadata.live_or_cached).toBe("cached");
    expect(second.documents[0]?.metadata.latency_ms).toBe(0);

    const candidateOnly = await extractPatient(counting, [referralRecord], { candidateCache });
    expect(calls).toBe(1);
    expect(candidateOnly.documents[0]?.metadata.live_or_cached).toBe("cached");
  });

  it("bridges into the Phase 1 patient-level extractor interface", async () => {
    const fixture = new FixtureDocumentExtractor({ [TEST_SOURCE_DOC_ID]: [referralCandidate()] });
    const bridge = asPatientExtractor(fixture);
    const result = await bridge.extract({ records: [referralRecord] });
    expect(result.extractor_version).toBe("fixture-extractor-v1");
    expect(result.events).toHaveLength(1);
    expect(result.extraction_confidence).toBeCloseTo(0.9);
  });
});
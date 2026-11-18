import { describe, expect, it } from "vitest";
import { LlmDocumentExtractor } from "@/lib/extraction/llm-extractor";
import { LlmRequestError, type LlmCompletion, type LlmProvider } from "@/lib/extraction/provider";
import { prepareExtractionEnvelope } from "@/lib/extraction/preprocess";
import type { SourceRecord } from "@/lib/domain";
import { TEST_PATIENT_ID, TEST_SOURCE_DOC_ID } from "../support/clinical-events";

const record: SourceRecord = {
  source_doc_id: TEST_SOURCE_DOC_ID,
  fixture_key: "DOC-1",
  patient_id: TEST_PATIENT_ID,
  doc_type: "referral",
  provider: "Dr. Test",
  provider_type: "specialist",
  date: "2026-04-18",
  text: "Referral to Medical Oncology. Please schedule within 45 days.",
  dataset_version: "continua-synth-v1",
  generator_version: "generator-v1",
  synthetic: true,
};

function validEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event_type: "referral",
    date: "2026-04-18",
    description: "Referral to medical oncology",
    source_doc_id: TEST_SOURCE_DOC_ID,
    source_span: "Referral to Medical Oncology.",
    specialty_raw: "Medical Oncology",
    expected_window_days: 45,
    status: "placed",
    ...overrides,
  };
}

function stubProvider(texts: string[], usage?: LlmCompletion["usage"]) {
  const calls: Array<{ system: string; user: string }> = [];
  const provider: LlmProvider = {
    id: "stub",
    model: "stub-model",
    async complete(req) {
      calls.push({ system: req.system, user: req.user });
      const text = texts.shift();
      if (text === undefined) throw new Error("No stubbed completion left.");
      return usage ? { text, usage, status: 200 } : { text, status: 200 };
    },
  };
  return { provider, calls };
}

function modelResponse(events: unknown[], patientId = TEST_PATIENT_ID): string {
  return JSON.stringify({ patient_id: patientId, events });
}

describe("LlmDocumentExtractor", () => {
  it("extracts candidates through the runtime gate with full live metadata", async () => {
    const { provider, calls } = stubProvider(
      [modelResponse([validEvent()])],
      { input_tokens: 300, output_tokens: 80 },
    );
    const extractor = new LlmDocumentExtractor(provider);
    const envelope = prepareExtractionEnvelope(record);
    const result = await extractor.extractDocument({ envelope });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.event_type).toBe("referral");
    expect(result.candidates[0]?.confidence).toBe(0.5);
    expect(result.metadata.provider).toBe("stub");
    expect(result.metadata.model).toBe("stub-model");
    expect(result.metadata.prompt_version).toBe("extraction-prompt-v1");
    expect(result.metadata.candidate_schema_version).toBe("candidate-event-v1");
    expect(result.metadata.live_or_cached).toBe("live");
    expect(result.metadata.status).toBe("ok");
    expect(result.metadata.attempt_count).toBe(1);
    expect(result.metadata.input_tokens).toBe(300);
    expect(result.metadata.output_tokens).toBe(80);
    expect(result.metadata.latency_ms).toBeGreaterThanOrEqual(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.user).toContain("<document>");
    expect(calls[0]?.user).toContain(record.text);
    expect(calls[0]?.user).not.toContain("fixture_key");
  });

  it("produces a deterministic request_id for identical inputs", async () => {
    const first = stubProvider([modelResponse([validEvent()])]);
    const second = stubProvider([modelResponse([validEvent()])]);
    const envelope = prepareExtractionEnvelope(record);
    const a = await new LlmDocumentExtractor(first.provider).extractDocument({ envelope });
    const b = await new LlmDocumentExtractor(second.provider).extractDocument({ envelope });
    expect(a.metadata.request_id).toBe(b.metadata.request_id);
  });

  it("strips unsupported model keys instead of trusting them", async () => {
    const { provider } = stubProvider([
      modelResponse([validEvent({ patient_risk: "high", gap_type: "missed_referral" })]),
    ]);
    const result = await new LlmDocumentExtractor(provider).extractDocument({
      envelope: prepareExtractionEnvelope(record),
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).not.toHaveProperty("patient_risk");
    expect(result.candidates[0]).not.toHaveProperty("gap_type");
  });

  it("accepts markdown-fenced JSON", async () => {
    const { provider } = stubProvider(["```json\n" + modelResponse([validEvent()]) + "\n```"]);
    const result = await new LlmDocumentExtractor(provider).extractDocument({
      envelope: prepareExtractionEnvelope(record),
    });
    expect(result.candidates).toHaveLength(1);
  });

  it("throws retryable errors for malformed JSON and envelope failures", async () => {
    const malformed = stubProvider(["this is not json"]);
    const error = await new LlmDocumentExtractor(malformed.provider)
      .extractDocument({ envelope: prepareExtractionEnvelope(record) })
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(LlmRequestError);
    expect((error as LlmRequestError).retryable).toBe(true);

    const badEnvelope = stubProvider([JSON.stringify({ events: [] })]);
    const envelopeError = await new LlmDocumentExtractor(badEnvelope.provider)
      .extractDocument({ envelope: prepareExtractionEnvelope(record) })
      .catch((cause: unknown) => cause);
    expect(envelopeError).toBeInstanceOf(LlmRequestError);
    expect((envelopeError as LlmRequestError).retryable).toBe(true);
  });

  it("rejects responses whose patient_id does not match the request", async () => {
    const { provider } = stubProvider([
      modelResponse([validEvent()], "00000000-0000-5000-8000-0000000000ff"),
    ]);
    const error = await new LlmDocumentExtractor(provider)
      .extractDocument({ envelope: prepareExtractionEnvelope(record) })
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(LlmRequestError);
    expect((error as LlmRequestError).message).toContain("patient_id");
  });

  it("chunks oversized documents and merges candidates across requests", async () => {
    const longRecord: SourceRecord = {
      ...record,
      text: "Referral to Medical Oncology.\n\n" + "Filler paragraph. ".repeat(666),
    };
    const { provider, calls } = stubProvider([modelResponse([validEvent()]), modelResponse([])]);
    const result = await new LlmDocumentExtractor(provider).extractDocument({
      envelope: prepareExtractionEnvelope(longRecord),
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]?.user).toContain("chunk_id");
    expect(result.candidates).toHaveLength(1);
    expect(result.metadata.candidate_event_count).toBe(1);
  });
});
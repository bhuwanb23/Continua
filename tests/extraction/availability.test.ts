import { describe, expect, it } from "vitest";
import type { SourceRecord } from "@/lib/domain";
import { ConfigError, loadEnv } from "@/lib/config/env";
import { extractPatient } from "@/lib/extraction/batch";
import { LlmDocumentExtractor } from "@/lib/extraction/llm-extractor";
import { createLlmProvider, LlmRequestError, type LlmProvider } from "@/lib/extraction/provider";
import { TEST_PATIENT_ID, TEST_SOURCE_DOC_ID } from "../support/clinical-events";

const DOC_2 = "00000000-0000-5000-8000-000000000004";
const fastRetry = { sleep: async () => {}, baseDelayMs: 1 };

function makeRecord(sourceDocId: string, text: string): SourceRecord {
  return {
    source_doc_id: sourceDocId,
    fixture_key: `DOC-${sourceDocId.slice(-1)}`,
    patient_id: TEST_PATIENT_ID,
    doc_type: "consult_note",
    provider: "Dr. Test",
    provider_type: "pcp",
    date: "2026-04-18",
    text,
    dataset_version: "continua-synth-v1",
    generator_version: "generator-v1",
    synthetic: true,
  };
}

const recordA = makeRecord(TEST_SOURCE_DOC_ID, "Referral to Medical Oncology. Please schedule within 45 days.");
const recordB = makeRecord(DOC_2, "CBC: hemoglobin 13.2 g/dL.");

function failingProvider(error: () => LlmRequestError): { provider: LlmProvider; calls: () => number } {
  let calls = 0;
  return {
    provider: {
      id: "stub",
      model: "stub-model",
      async complete() {
        calls += 1;
        throw error();
      },
    },
    calls: () => calls,
  };
}

function validResponse(documentId: string): string {
  return JSON.stringify({
    patient_id: TEST_PATIENT_ID,
    events: [
      {
        event_type: "referral",
        date: "2026-04-18",
        description: "Referral to medical oncology",
        source_doc_id: documentId,
        source_span: "Referral to Medical Oncology.",
        specialty_raw: "Medical Oncology",
        expected_window_days: 45,
        status: "placed",
      },
    ],
  });
}

describe("availability degradation", () => {
  it("refuses to construct a keyed provider without an API key", () => {
    const config = loadEnv({ LLM_PROVIDER: "openrouter", LLM_MODEL: "test-model" });
    expect(() => createLlmProvider(config)).toThrow(ConfigError);
  });

  it("permits keyless ollama configuration", () => {
    const config = loadEnv({ LLM_PROVIDER: "ollama", LLM_MODEL: "llama3" });
    expect(createLlmProvider(config).id).toBe("ollama");
  });

  it("degrades to FAILED after three attempts on HTTP 429, with no fake events", async () => {
    const { provider, calls } = failingProvider(
      () => new LlmRequestError("Provider returned HTTP 429.", { retryable: true, status: 429 }),
    );
    const result = await extractPatient(new LlmDocumentExtractor(provider), [recordA], { retry: fastRetry });
    expect(result.status).toBe("FAILED");
    expect(result.store.accepted).toHaveLength(0);
    expect(calls()).toBe(3);
    expect(result.documents[0]?.metadata.attempt_count).toBe(3);
    expect(result.documents[0]?.error).toContain("429");
  });

  it("degrades to FAILED after three attempts on request timeout", async () => {
    const { provider, calls } = failingProvider(
      () => new LlmRequestError("LLM request timed out.", { retryable: true }),
    );
    const result = await extractPatient(new LlmDocumentExtractor(provider), [recordA], { retry: fastRetry });
    expect(result.status).toBe("FAILED");
    expect(result.store.accepted).toHaveLength(0);
    expect(calls()).toBe(3);
  });

  it("treats truncated JSON as retryable and never emits partial events", async () => {
    let calls = 0;
    const provider: LlmProvider = {
      id: "stub",
      model: "stub-model",
      async complete() {
        calls += 1;
        return { text: `{"patient_id": "${TEST_PATIENT_ID}", "events": [`, status: 200 };
      },
    };
    const result = await extractPatient(new LlmDocumentExtractor(provider), [recordA], { retry: fastRetry });
    expect(result.status).toBe("FAILED");
    expect(result.store.accepted).toHaveLength(0);
    expect(calls).toBe(3);
  });

  it("marks the patient PARTIAL when one document truncates and another succeeds", async () => {
    const provider: LlmProvider = {
      id: "stub",
      model: "stub-model",
      async complete(req) {
        if (req.user.includes(DOC_2)) {
          return { text: `{"patient_id": "${TEST_PATIENT_ID}", "events": [`, status: 200 };
        }
        return { text: validResponse(TEST_SOURCE_DOC_ID), status: 200 };
      },
    };
    const result = await extractPatient(new LlmDocumentExtractor(provider), [recordA, recordB], { retry: fastRetry });
    expect(result.status).toBe("PARTIAL");
    expect(result.store.accepted).toHaveLength(1);
    expect(result.store.accepted[0]?.source.source_doc_id).toBe(TEST_SOURCE_DOC_ID);
    const failed = result.documents.find((outcome) => outcome.document_id === DOC_2);
    expect(failed?.status).toBe("failed");
    expect(failed?.candidates).toHaveLength(0);
  });

  it("does not retry non-retryable auth failures", async () => {
    const { provider, calls } = failingProvider(
      () => new LlmRequestError("Provider returned HTTP 401.", { retryable: false, status: 401 }),
    );
    const result = await extractPatient(new LlmDocumentExtractor(provider), [recordA], { retry: fastRetry });
    expect(result.status).toBe("FAILED");
    expect(calls()).toBe(1);
    expect(result.documents[0]?.metadata.attempt_count).toBe(1);
  });
});
import { performance } from "node:perf_hooks";
import { deterministicId } from "@/lib/ids";
import { EXTRACTOR_VERSION } from "@/lib/domain/versions";
import type { Logger } from "@/lib/logging/logger";
import type { CandidateClinicalEvent } from "@/lib/schemas/candidate-event.schema";
import { CANDIDATE_SCHEMA_VERSION, gateCandidateResponse } from "./candidate-event";
import { chunkDocument } from "./chunking";
import type { ClinicalEventDocumentExtractor, DocumentExtractionResult } from "./extractor";
import type { ExtractionEnvelope } from "./preprocess";
import { buildExtractionPrompt, EXTRACTION_JSON_SCHEMA, PROMPT_VERSION } from "./prompt";
import { LlmRequestError, type LlmProvider } from "./provider";

export interface LlmExtractorOptions {
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  logger?: Logger;
  version?: string;
}

function parseModelJson(text: string): Record<string, unknown> {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new LlmRequestError("Model response is not valid JSON.", { retryable: true, cause: error });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new LlmRequestError("Model response must be a JSON object.", { retryable: true });
  }
  return parsed as Record<string, unknown>;
}

/**
 * Provider-backed document extractor. The model outputs only facts; the
 * runtime gate, provenance verifier, and deterministic normalization decide
 * everything else. Retry policy lives one layer up (batch/retry).
 */
export class LlmDocumentExtractor implements ClinicalEventDocumentExtractor {
  readonly version: string;

  constructor(
    private readonly provider: LlmProvider,
    private readonly options: LlmExtractorOptions = {},
  ) {
    this.version = options.version ?? EXTRACTOR_VERSION;
  }

  get modelId(): string {
    return this.provider.model;
  }

  async extractDocument({ envelope }: { envelope: ExtractionEnvelope }): Promise<DocumentExtractionResult> {
    const started = performance.now();
    const request_id = deterministicId(
      "llm-extraction",
      envelope.content_hash,
      this.provider.model,
      PROMPT_VERSION,
      this.version,
    );
    const chunks = chunkDocument(envelope);
    const candidates: CandidateClinicalEvent[] = [];
    let inputTokens = 0;
    let outputTokens = 0;
    let sawUsage = false;

    for (const chunk of chunks) {
      const prompt = buildExtractionPrompt(envelope, chunks.length > 1 ? chunk : undefined);
      const completion = await this.provider.complete({
        system: prompt.system,
        user: prompt.user,
        jsonSchema: EXTRACTION_JSON_SCHEMA,
        temperature: this.options.temperature ?? 0,
        maxOutputTokens: this.options.maxOutputTokens ?? 4096,
        timeoutMs: this.options.timeoutMs ?? 60000,
      });
      if (completion.usage) {
        sawUsage = true;
        inputTokens += completion.usage.input_tokens;
        outputTokens += completion.usage.output_tokens;
      }

      const parsed = parseModelJson(completion.text);
      // extraction_metadata is attached server-side; model claims are ignored.
      const gated = gateCandidateResponse(
        {
          ...parsed,
          extraction_metadata: {
            model: this.provider.model,
            prompt_version: PROMPT_VERSION,
            request_id,
          },
        },
        this.options.logger,
      );
      if (gated.envelope_error) {
        throw new LlmRequestError(`Malformed extraction response: ${gated.envelope_error}`, { retryable: true });
      }
      if (gated.patient_id !== envelope.patient_id) {
        throw new LlmRequestError("Model response patient_id does not match the request.", { retryable: true });
      }
      candidates.push(...gated.candidates);
    }

    return {
      candidates,
      metadata: {
        request_id,
        patient_id: envelope.patient_id,
        document_id: envelope.document_id,
        provider: this.provider.id,
        model: this.provider.model,
        prompt_version: PROMPT_VERSION,
        candidate_schema_version: CANDIDATE_SCHEMA_VERSION,
        latency_ms: Math.round(performance.now() - started),
        attempt_count: 1,
        status: "ok",
        candidate_event_count: candidates.length,
        ...(sawUsage ? { input_tokens: inputTokens, output_tokens: outputTokens } : {}),
        live_or_cached: "live",
      },
    };
  }
}
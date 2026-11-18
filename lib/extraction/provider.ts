import { ConfigError } from "@/lib/errors";
import type { ServerConfig } from "@/lib/config/env";

export interface LlmCompletionRequest {
  system: string;
  user: string;
  jsonSchema?: unknown;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
}

export interface LlmCompletion {
  text: string;
  usage?: { input_tokens: number; output_tokens: number };
  status: number;
}

export interface LlmProvider {
  readonly id: string;
  readonly model: string;
  complete(request: LlmCompletionRequest): Promise<LlmCompletion>;
}

/** Transient failures (429/5xx/timeout/network) are retryable; auth and bad requests are not. */
export class LlmRequestError extends Error {
  readonly retryable: boolean;
  readonly status: number | undefined;

  constructor(message: string, options: { retryable: boolean; status?: number; cause?: unknown } ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "LlmRequestError";
    this.retryable = options.retryable;
    this.status = options.status;
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

async function fetchWithTimeout(
  fetchImpl: FetchLike,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  providerId: string,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new LlmRequestError(`Provider ${providerId} timed out after ${timeoutMs}ms.`, {
        retryable: true,
        cause: error,
      });
    }
    throw new LlmRequestError(`Provider ${providerId} network failure.`, {
      retryable: true,
      cause: error,
    });
  } finally {
    clearTimeout(timer);
  }
}

export interface OpenAiCompatibleOptions {
  id: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  fetchImpl?: FetchLike;
  headers?: Record<string, string>;
}

/**
 * OpenAI-compatible chat completions (OpenRouter, Ollama /v1). Structured
 * output degrades gracefully: json_schema → json_object → prompt-enforced
 * JSON. The runtime candidate gate is always the safety boundary.
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly id: string;
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: FetchLike;
  private readonly headers: Record<string, string>;

  constructor(options: OpenAiCompatibleOptions) {
    this.id = options.id;
    this.model = options.model;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
    this.headers = options.headers ?? {};
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletion> {
    const formats: Array<Record<string, unknown> | undefined> = request.jsonSchema
      ? [
          {
            type: "json_schema",
            json_schema: { name: "clinical_event_extraction", strict: false, schema: request.jsonSchema },
          },
          { type: "json_object" },
          undefined,
        ]
      : [{ type: "json_object" }, undefined];

    let lastError: LlmRequestError | undefined;
    for (const responseFormat of formats) {
      const body: Record<string, unknown> = {
        model: this.model,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.user },
        ],
        temperature: request.temperature,
        max_tokens: request.maxOutputTokens,
      };
      if (responseFormat) body["response_format"] = responseFormat;

      const headers: Record<string, string> = { "content-type": "application/json", ...this.headers };
      if (this.apiKey) headers["authorization"] = `Bearer ${this.apiKey}`;

      const response = await fetchWithTimeout(
        this.fetchImpl,
        `${this.baseUrl}/chat/completions`,
        { method: "POST", headers, body: JSON.stringify(body) },
        request.timeoutMs,
        this.id,
      );
      if (!response.ok) {
        const error = new LlmRequestError(`Provider ${this.id} returned HTTP ${response.status}.`, {
          retryable: isRetryableStatus(response.status),
          status: response.status,
        });
        // Unsupported response_format is a capability gap, not a transient
        // failure: fall through to the next format instead of retrying.
        if (!error.retryable && responseFormat && response.status !== 401 && response.status !== 403) {
          lastError = error;
          continue;
        }
        throw error;
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = payload.choices?.[0]?.message?.content;
      if (typeof text !== "string") {
        throw new LlmRequestError(`Provider ${this.id} returned no completion text.`, { retryable: true });
      }
      const usage =
        payload.usage?.prompt_tokens !== undefined && payload.usage?.completion_tokens !== undefined
          ? { input_tokens: payload.usage.prompt_tokens, output_tokens: payload.usage.completion_tokens }
          : undefined;
      return usage ? { text, usage, status: response.status } : { text, status: response.status };
    }
    throw lastError ?? new LlmRequestError(`Provider ${this.id} request failed.`, { retryable: false });
  }
}

/** Recursively convert the flat JSON schema to Gemini's responseSchema dialect. */
export function toGeminiResponseSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiResponseSchema);
  if (!schema || typeof schema !== "object") return schema;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (key === "additionalProperties" || key === "$schema") continue;
    if (key === "type" && Array.isArray(value)) {
      const types = value.filter((item) => item !== "null");
      output["type"] = types[0] ?? "string";
      if (value.includes("null")) output["nullable"] = true;
      continue;
    }
    output[key] = toGeminiResponseSchema(value);
  }
  return output;
}

export interface GeminiOptions {
  model: string;
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
}

export class GeminiProvider implements LlmProvider {
  readonly id = "gemini";
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: GeminiOptions) {
    this.model = options.model;
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletion> {
    const generationConfig: Record<string, unknown> = {
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      responseMimeType: "application/json",
    };
    const withSchema = request.jsonSchema !== undefined;
    if (withSchema) generationConfig["responseSchema"] = toGeminiResponseSchema(request.jsonSchema);

    const body = {
      systemInstruction: { parts: [{ text: request.system }] },
      contents: [{ role: "user", parts: [{ text: request.user }] }],
      generationConfig,
    };
    const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent`;
    const init: RequestInit = {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify(body),
    };

    let response = await fetchWithTimeout(this.fetchImpl, url, init, request.timeoutMs, this.id);
    if (!response.ok && withSchema && !isRetryableStatus(response.status) && response.status !== 401 && response.status !== 403) {
      delete generationConfig["responseSchema"];
      response = await fetchWithTimeout(
        this.fetchImpl,
        url,
        { ...init, body: JSON.stringify(body) },
        request.timeoutMs,
        this.id,
      );
    }
    if (!response.ok) {
      throw new LlmRequestError(`Provider ${this.id} returned HTTP ${response.status}.`, {
        retryable: isRetryableStatus(response.status),
        status: response.status,
      });
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const parts = payload.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((part) => part.text ?? "").join("");
    if (!text) {
      throw new LlmRequestError(`Provider ${this.id} returned no completion text.`, { retryable: true });
    }
    const usage =
      payload.usageMetadata?.promptTokenCount !== undefined && payload.usageMetadata?.candidatesTokenCount !== undefined
        ? {
            input_tokens: payload.usageMetadata.promptTokenCount,
            output_tokens: payload.usageMetadata.candidatesTokenCount,
          }
        : undefined;
    return usage ? { text, usage, status: response.status } : { text, status: response.status };
  }
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://localhost:11434/v1",
};

export function createLlmProvider(config: ServerConfig, fetchImpl?: FetchLike): LlmProvider {
  if (!config.llmProvider) throw new ConfigError("LLM provider not configured.");
  if (!config.llmModel) throw new ConfigError("LLM_MODEL must be set for live extraction.");
  const provider = config.llmProvider;

  if (provider === "gemini") {
    if (!config.llmApiKey) throw new ConfigError("LLM provider not configured.");
    return new GeminiProvider({
      model: config.llmModel,
      apiKey: config.llmApiKey,
      ...(config.llmBaseUrl ? { baseUrl: config.llmBaseUrl } : {}),
      ...(fetchImpl ? { fetchImpl } : {}),
    });
  }

  const baseUrl = config.llmBaseUrl ?? DEFAULT_BASE_URLS[provider];
  if (!baseUrl) throw new ConfigError(`Unsupported LLM provider "${provider}".`);
  if (provider !== "ollama" && !config.llmApiKey) throw new ConfigError("LLM provider not configured.");
  return new OpenAiCompatibleProvider({
    id: provider,
    baseUrl,
    model: config.llmModel,
    ...(config.llmApiKey ? { apiKey: config.llmApiKey } : {}),
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}
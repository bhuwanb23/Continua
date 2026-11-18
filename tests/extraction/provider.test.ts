import { describe, expect, it } from "vitest";
import {
  createLlmProvider,
  GeminiProvider,
  LlmRequestError,
  OpenAiCompatibleProvider,
  toGeminiResponseSchema,
} from "@/lib/extraction/provider";
import { EXTRACTION_JSON_SCHEMA } from "@/lib/extraction/prompt";
import { loadEnv } from "@/lib/config/env";
import { ConfigError } from "@/lib/errors";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

function openAiPayload(text: string) {
  return {
    choices: [{ message: { content: text } }],
    usage: { prompt_tokens: 120, completion_tokens: 45 },
  };
}

function stubFetch(responses: Array<Response | Error>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = async (url: string, init: RequestInit): Promise<Response> => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error("No stubbed response left.");
    if (next instanceof Error) throw next;
    return next;
  };
  return { fetchImpl, calls };
}

const request = {
  system: "system prompt",
  user: "user prompt",
  jsonSchema: EXTRACTION_JSON_SCHEMA,
  temperature: 0,
  maxOutputTokens: 1024,
  timeoutMs: 5000,
};

describe("OpenAiCompatibleProvider", () => {
  it("sends auth, model, messages, and json_schema response format; parses usage", async () => {
    const { fetchImpl, calls } = stubFetch([jsonResponse(openAiPayload('{"events":[]}'))]);
    const provider = new OpenAiCompatibleProvider({
      id: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1/",
      model: "model-a",
      apiKey: "sk-test",
      fetchImpl,
    });
    const result = await provider.complete(request);
    expect(result.text).toBe('{"events":[]}');
    expect(result.usage).toEqual({ input_tokens: 120, output_tokens: 45 });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://openrouter.ai/api/v1/chat/completions");
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers["authorization"]).toBe("Bearer sk-test");
    const body = JSON.parse(String(calls[0]?.init.body)) as Record<string, unknown>;
    expect(body["model"]).toBe("model-a");
    expect((body["response_format"] as Record<string, unknown>)["type"]).toBe("json_schema");
  });

  it("degrades json_schema → json_object → prompt-enforced JSON on capability errors", async () => {
    const { fetchImpl, calls } = stubFetch([
      jsonResponse({ error: "unsupported response_format" }, 400),
      jsonResponse({ error: "unsupported response_format" }, 400),
      jsonResponse(openAiPayload("{}")),
    ]);
    const provider = new OpenAiCompatibleProvider({
      id: "ollama",
      baseUrl: "http://localhost:11434/v1",
      model: "llama3",
      fetchImpl,
    });
    const result = await provider.complete(request);
    expect(result.text).toBe("{}");
    expect(calls).toHaveLength(3);
    const formats = calls.map((call) => {
      const body = JSON.parse(String(call.init.body)) as Record<string, unknown>;
      return (body["response_format"] as Record<string, unknown> | undefined)?.["type"];
    });
    expect(formats).toEqual(["json_schema", "json_object", undefined]);
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers["authorization"]).toBeUndefined();
  });

  it("marks 429 and 5xx retryable without format fallback", async () => {
    for (const status of [429, 503]) {
      const { fetchImpl, calls } = stubFetch([jsonResponse({}, status)]);
      const provider = new OpenAiCompatibleProvider({
        id: "openrouter",
        baseUrl: "https://openrouter.ai/api/v1",
        model: "model-a",
        apiKey: "sk-test",
        fetchImpl,
      });
      const error = await provider.complete(request).catch((cause: unknown) => cause);
      expect(error).toBeInstanceOf(LlmRequestError);
      expect((error as LlmRequestError).retryable).toBe(true);
      expect((error as LlmRequestError).status).toBe(status);
      expect(calls).toHaveLength(1);
    }
  });

  it("marks auth failures non-retryable and does not fall back", async () => {
    const { fetchImpl, calls } = stubFetch([jsonResponse({}, 401)]);
    const provider = new OpenAiCompatibleProvider({
      id: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "model-a",
      apiKey: "sk-bad",
      fetchImpl,
    });
    const error = await provider.complete(request).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(LlmRequestError);
    expect((error as LlmRequestError).retryable).toBe(false);
    expect(calls).toHaveLength(1);
  });

  it("treats timeouts and network failures as retryable", async () => {
    const hangingFetch = (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    const provider = new OpenAiCompatibleProvider({
      id: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "model-a",
      apiKey: "sk-test",
      fetchImpl: hangingFetch,
    });
    const error = await provider
      .complete({ ...request, timeoutMs: 20 })
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(LlmRequestError);
    expect((error as LlmRequestError).retryable).toBe(true);
    expect((error as LlmRequestError).message).toContain("timed out");

    const { fetchImpl } = stubFetch([new Error("ECONNREFUSED")]);
    const offline = new OpenAiCompatibleProvider({
      id: "ollama",
      baseUrl: "http://localhost:11434/v1",
      model: "llama3",
      fetchImpl,
    });
    const networkError = await offline.complete(request).catch((cause: unknown) => cause);
    expect(networkError).toBeInstanceOf(LlmRequestError);
    expect((networkError as LlmRequestError).retryable).toBe(true);
  });
});

describe("GeminiProvider", () => {
  it("sanitizes the JSON schema and maps usage metadata", async () => {
    const { fetchImpl, calls } = stubFetch([
      jsonResponse({
        candidates: [{ content: { parts: [{ text: '{"events":' }, { text: "[]}" }] } }],
        usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 30 },
      }),
    ]);
    const provider = new GeminiProvider({ model: "gemini-test", apiKey: "g-key", fetchImpl });
    const result = await provider.complete(request);
    expect(result.text).toBe('{"events":[]}');
    expect(result.usage).toEqual({ input_tokens: 200, output_tokens: 30 });
    expect(calls[0]?.url).toContain("/models/gemini-test:generateContent");
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers["x-goog-api-key"]).toBe("g-key");
    const body = JSON.parse(String(calls[0]?.init.body)) as {
      generationConfig: { responseSchema: unknown };
    };
    const serialized = JSON.stringify(body.generationConfig.responseSchema);
    expect(serialized).not.toContain("additionalProperties");
    expect(serialized).toContain('"nullable":true');
    expect(serialized).not.toContain('"type":["');
  });

  it("retries without responseSchema when the schema is rejected", async () => {
    const { fetchImpl, calls } = stubFetch([
      jsonResponse({ error: "invalid schema" }, 400),
      jsonResponse({ candidates: [{ content: { parts: [{ text: "{}" }] } }] }),
    ]);
    const provider = new GeminiProvider({ model: "gemini-test", apiKey: "g-key", fetchImpl });
    const result = await provider.complete(request);
    expect(result.text).toBe("{}");
    expect(calls).toHaveLength(2);
    const secondBody = JSON.parse(String(calls[1]?.init.body)) as {
      generationConfig: Record<string, unknown>;
    };
    expect(secondBody.generationConfig["responseSchema"]).toBeUndefined();
    expect(secondBody.generationConfig["responseMimeType"]).toBe("application/json");
  });

  it("converts type arrays to nullable single types", () => {
    const converted = toGeminiResponseSchema({
      type: "object",
      additionalProperties: false,
      properties: { value: { type: ["number", "string", "null"] } },
    }) as Record<string, unknown>;
    expect(converted).not.toHaveProperty("additionalProperties");
    expect((converted["properties"] as Record<string, unknown>)["value"]).toEqual({
      type: "number",
      nullable: true,
    });
  });
});

describe("createLlmProvider", () => {
  it("builds providers from server config with default base URLs", () => {
    const openrouter = createLlmProvider(
      loadEnv({ LLM_PROVIDER: "openrouter", LLM_API_KEY: "sk-test", LLM_MODEL: "model-a" }),
    );
    expect(openrouter.id).toBe("openrouter");
    expect(openrouter.model).toBe("model-a");

    const ollama = createLlmProvider(loadEnv({ LLM_PROVIDER: "ollama", LLM_MODEL: "llama3" }));
    expect(ollama.id).toBe("ollama");

    const gemini = createLlmProvider(
      loadEnv({ LLM_PROVIDER: "gemini", LLM_API_KEY: "g-key", LLM_MODEL: "gemini-test" }),
    );
    expect(gemini.id).toBe("gemini");
  });

  it("fails clearly on missing model, missing key, or unknown provider", () => {
    expect(() => createLlmProvider(loadEnv({ LLM_PROVIDER: "openrouter", LLM_API_KEY: "sk-test" }))).toThrow(
      ConfigError,
    );
    expect(() => createLlmProvider(loadEnv({ LLM_PROVIDER: "openrouter", LLM_MODEL: "model-a" }))).toThrow(
      ConfigError,
    );
    expect(() => createLlmProvider(loadEnv({ LLM_PROVIDER: "mystery", LLM_MODEL: "x" }))).toThrow(ConfigError);
  });
});
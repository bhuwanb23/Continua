import { describe, expect, it } from "vitest";
import { isRetryableExtractionError, withRetry } from "@/lib/extraction/retry";
import { LlmRequestError } from "@/lib/extraction/provider";

const noSleep = async () => {};

describe("withRetry", () => {
  it("retries transient failures with exponential backoff up to 3 total attempts", async () => {
    const delays: number[] = [];
    const attempts: number[] = [];
    const result = await withRetry(
      async (attempt) => {
        attempts.push(attempt);
        if (attempt < 3) throw new LlmRequestError("Provider returned HTTP 503.", { retryable: true, status: 503 });
        return "ok";
      },
      { baseDelayMs: 100, sleep: async (ms) => { delays.push(ms); } },
    );
    expect(result).toBe("ok");
    expect(attempts).toEqual([1, 2, 3]);
    expect(delays).toEqual([100, 200]);
  });

  it("never retries non-retryable failures", async () => {
    let calls = 0;
    const error = await withRetry(
      async () => {
        calls += 1;
        throw new LlmRequestError("Provider returned HTTP 401.", { retryable: false, status: 401 });
      },
      { sleep: noSleep },
    ).catch((cause: unknown) => cause);
    expect(calls).toBe(1);
    expect(error).toBeInstanceOf(LlmRequestError);

    let plainCalls = 0;
    await withRetry(
      async () => {
        plainCalls += 1;
        throw new Error("normalization failure");
      },
      { sleep: noSleep },
    ).catch(() => undefined);
    expect(plainCalls).toBe(1);
  });

  it("gives up after the attempt bound and surfaces the last error", async () => {
    let calls = 0;
    const error = await withRetry(
      async () => {
        calls += 1;
        throw new LlmRequestError("timeout", { retryable: true });
      },
      { sleep: noSleep },
    ).catch((cause: unknown) => cause);
    expect(calls).toBe(3);
    expect(error).toBeInstanceOf(LlmRequestError);
  });

  it("reports retry events through onRetry", async () => {
    const seen: Array<{ attempt: number; delayMs: number }> = [];
    await withRetry(
      async (attempt) => {
        if (attempt < 2) throw new LlmRequestError("429", { retryable: true, status: 429 });
        return 1;
      },
      { baseDelayMs: 10, sleep: noSleep, onRetry: (info) => seen.push({ attempt: info.attempt, delayMs: info.delayMs }) },
    );
    expect(seen).toEqual([{ attempt: 1, delayMs: 10 }]);
  });

  it("classifies only retryable LlmRequestErrors as retryable", () => {
    expect(isRetryableExtractionError(new LlmRequestError("x", { retryable: true }))).toBe(true);
    expect(isRetryableExtractionError(new LlmRequestError("x", { retryable: false }))).toBe(false);
    expect(isRetryableExtractionError(new Error("x"))).toBe(false);
    expect(isRetryableExtractionError(null)).toBe(false);
  });
});
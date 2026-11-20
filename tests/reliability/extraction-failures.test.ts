import { describe, expect, it } from "vitest";
import { LlmRequestError } from "@/lib/extraction/provider";
import {
  backoffDelayMs,
  isRetryableFailure,
  maxAttemptsFor,
  retryRuleFor,
  retryWithPolicy,
} from "@/lib/reliability/retries";
import { createFaultInjector, InjectedFault } from "@/lib/reliability/fault-injection";

describe("extraction provider failure handling", () => {
  it("freezes the retry matrix", () => {
    expect(retryRuleFor("rate_limit").max_attempts).toBe(3);
    expect(retryRuleFor("timeout").retryable).toBe("yes");
    expect(retryRuleFor("transient_5xx").retryable).toBe("yes");
    expect(retryRuleFor("invalid_json").retryable).toBe("bounded");
    expect(retryRuleFor("invalid_api_key").retryable).toBe("no");
    expect(retryRuleFor("provenance").retryable).toBe("no");
    expect(retryRuleFor("ownership").retryable).toBe("no");
    expect(retryRuleFor("unsupported_schema").retryable).toBe("no");
    expect(retryRuleFor("missing_document").retryable).toBe("no");
  });

  it("caps retries at three attempts and never retries trust failures", async () => {
    expect(maxAttemptsFor("rate_limit")).toBe(3);
    expect(maxAttemptsFor("invalid_api_key")).toBe(1);
    expect(maxAttemptsFor("provenance")).toBe(1);
    expect(isRetryableFailure("transient_5xx")).toBe(true);
    expect(isRetryableFailure("ownership")).toBe(false);
  });

  it("recovers from a transient 429 with bounded attempts", async () => {
    let calls = 0;
    const result = await retryWithPolicy({
      kind: "rate_limit",
      run: async () => {
        calls += 1;
        if (calls < 3) {
          throw new LlmRequestError("rate limited", { retryable: true, status: 429 });
        }
        return "ok";
      },
    });
    expect(result.value).toBe("ok");
    expect(result.attempts).toBe(3);
    expect(result.delays_ms).toEqual([500, 1000]);
    expect(calls).toBe(3);
  });

  it("fails an invalid API key without retrying", async () => {
    let calls = 0;
    await expect(
      retryWithPolicy({
        kind: "invalid_api_key",
        run: async () => {
          calls += 1;
          throw new LlmRequestError("unauthorized", { retryable: false, status: 401 });
        },
      }),
    ).rejects.toThrow(/unauthorized/);
    expect(calls).toBe(1);
  });

  it("bounds malformed JSON retries at three attempts", async () => {
    let calls = 0;
    await expect(
      retryWithPolicy({
        kind: "invalid_json",
        run: async () => {
          calls += 1;
          throw new LlmRequestError("not valid JSON", { retryable: true });
        },
      }),
    ).rejects.toThrow(/not valid JSON/);
    expect(calls).toBe(3);
  });

  it("uses deterministic exponential backoff", () => {
    expect(backoffDelayMs(1)).toBe(500);
    expect(backoffDelayMs(2)).toBe(1000);
    expect(backoffDelayMs(3)).toBe(2000);
    expect(backoffDelayMs(10)).toBe(4000);
  });

  it("keeps a total LLM outage from silently producing events", async () => {
    const injector = createFaultInjector(["FAIL_LLM"]);
    expect(() => injector.guard("FAIL_LLM", () => ["event"])).toThrow(InjectedFault);
    expect(injector.activations()).toHaveLength(1);
    expect(injector.guard("DELAY_API", () => "safe")).toBe("safe");
  });
});

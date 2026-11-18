import { LlmRequestError } from "./provider";

export interface RetryOptions {
  /** Total attempts including the first. Frozen policy: 3. */
  maxAttempts?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
}

/**
 * Only transient provider failures and malformed responses are retryable.
 * Provenance, normalization, and schema-content failures are data problems
 * and must never be retried.
 */
export function isRetryableExtractionError(error: unknown): boolean {
  return error instanceof LlmRequestError && error.retryable;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const sleep = options.sleep ?? defaultSleep;
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryableExtractionError(error)) throw error;
      const delayMs = baseDelayMs * 2 ** (attempt - 1);
      options.onRetry?.({ attempt, delayMs, error });
      await sleep(delayMs);
    }
  }
}
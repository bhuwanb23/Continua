/**
 * Frozen retry policy. Retries are transport/format recovery only: a retry never
 * loosens the prompt, schema, provenance, or patient-ownership constraints.
 */
export const EXTRACTION_MAX_ATTEMPTS = 3 as const;

export type RetryDisposition = "yes" | "bounded" | "no";

export interface RetryRule {
  failure: string;
  retryable: RetryDisposition;
  max_attempts: number;
  notes: string;
}

export const RETRY_MATRIX: ReadonlyArray<RetryRule> = [
  { failure: "429 rate limit", retryable: "yes", max_attempts: 3, notes: "Exponential backoff." },
  { failure: "timeout", retryable: "yes", max_attempts: 3, notes: "Transport recovery." },
  { failure: "transient 5xx", retryable: "yes", max_attempts: 3, notes: "500/502/503." },
  { failure: "invalid JSON", retryable: "bounded", max_attempts: 3, notes: "Format recovery, same prompt." },
  { failure: "invalid API key", retryable: "no", max_attempts: 1, notes: "Auth cannot heal by retry." },
  { failure: "provenance failure", retryable: "no", max_attempts: 1, notes: "Trust constraint." },
  { failure: "patient ownership failure", retryable: "no", max_attempts: 1, notes: "Trust constraint." },
  {
    failure: "unsupported schema field",
    retryable: "no",
    max_attempts: 1,
    notes: "Validation path, not transport.",
  },
  { failure: "missing document", retryable: "no", max_attempts: 1, notes: "Data problem." },
];

export const FAILURE_KINDS = [
  "rate_limit",
  "timeout",
  "transient_5xx",
  "invalid_json",
  "invalid_api_key",
  "provenance",
  "ownership",
  "unsupported_schema",
  "missing_document",
] as const;
export type FailureKind = (typeof FAILURE_KINDS)[number];

const KIND_TO_FAILURE: Record<FailureKind, string> = {
  rate_limit: "429 rate limit",
  timeout: "timeout",
  transient_5xx: "transient 5xx",
  invalid_json: "invalid JSON",
  invalid_api_key: "invalid API key",
  provenance: "provenance failure",
  ownership: "patient ownership failure",
  unsupported_schema: "unsupported schema field",
  missing_document: "missing document",
};

export function retryRuleFor(kind: FailureKind): RetryRule {
  const rule = RETRY_MATRIX.find((entry) => entry.failure === KIND_TO_FAILURE[kind]);
  if (!rule) throw new Error(`No frozen retry rule for ${kind}`);
  return rule;
}

export function isRetryableFailure(kind: FailureKind): boolean {
  return retryRuleFor(kind).retryable !== "no";
}

export function maxAttemptsFor(kind: FailureKind): number {
  const rule = retryRuleFor(kind);
  return rule.retryable === "no" ? 1 : Math.min(rule.max_attempts, EXTRACTION_MAX_ATTEMPTS);
}

/** Deterministic exponential backoff: 500ms, 1000ms, capped. */
export function backoffDelayMs(
  attempt: number,
  baseDelayMs = 500,
  capMs = 4_000,
  jitterMs = 0,
): number {
  if (!Number.isFinite(attempt) || attempt < 1) throw new Error("attempt must be >= 1");
  if (jitterMs < 0 || !Number.isFinite(jitterMs)) throw new Error("jitterMs must be finite and >= 0");
  const exponential = baseDelayMs * 2 ** Math.min(attempt - 1, 10);
  return Math.min(capMs, exponential) + jitterMs;
}

export interface RetryOutcome<T> {
  value: T;
  attempts: number;
  delays_ms: number[];
}

/**
 * Bounded retry with an injected sleep, so tests never wait on real timers.
 * `shouldRetry` decides from the error; the caller's constraints never change.
 */
export async function retryWithPolicy<T>(options: {
  kind: FailureKind;
  run: (attempt: number) => Promise<T>;
  sleep?: (ms: number) => Promise<void>;
  shouldRetry?: (error: unknown) => boolean;
}): Promise<RetryOutcome<T>> {
  const maxAttempts = maxAttemptsFor(options.kind);
  const sleep = options.sleep ?? (async () => undefined);
  const delays: number[] = [];
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return { value: await options.run(attempt), attempts: attempt, delays_ms: delays };
    } catch (error) {
      lastError = error;
      const allowed = options.shouldRetry ? options.shouldRetry(error) : isRetryableFailure(options.kind);
      if (!allowed || attempt >= maxAttempts) break;
      const delay = backoffDelayMs(attempt);
      delays.push(delay);
      await sleep(delay);
    }
  }
  throw lastError;
}

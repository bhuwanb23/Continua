const TRUTH_TOKENS = [
  "ground_truth",
  "ground-truth",
  "negative_manifest",
  "truth-events",
  "truth_events",
  "scenario_id",
  "extraction_gold",
] as const;

export function assertFiniteScore(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number, received ${String(value)}`);
  }
}

export function assertScoreInRange(value: unknown, label: string): asserts value is number {
  assertFiniteScore(value, label);
  if (value < 0 || value > 100) {
    throw new Error(`${label} must be between 0 and 100, received ${value}`);
  }
}

export interface QueueLikeItem {
  rank: number;
  patient_id: string;
  patient_priority_score: number;
}

export function assertQueueIntegrity(items: readonly QueueLikeItem[]): void {
  const seen = new Set<string>();
  let expectedRank = 1;
  for (const item of items) {
    if (!item.patient_id) throw new Error("Queue item is missing a patient_id");
    if (seen.has(item.patient_id)) throw new Error(`Duplicate queue patient ${item.patient_id}`);
    if (item.rank !== expectedRank) {
      throw new Error(`Queue rank ${item.rank} does not follow ${expectedRank - 1}`);
    }
    assertScoreInRange(item.patient_priority_score, `score for ${item.patient_id}`);
    seen.add(item.patient_id);
    expectedRank += 1;
  }
}

export function containsTruthToken(text: string): boolean {
  const lowered = text.toLowerCase();
  return TRUTH_TOKENS.some((token) => lowered.includes(token));
}

/** Stable serialization used for semantic comparisons and golden artifacts. */
export function stableJson(value: unknown): string {
  const seen = new WeakSet<object>();
  const normalize = (input: unknown): unknown => {
    if (input === null || typeof input !== "object") return input;
    if (seen.has(input as object)) throw new Error("Cannot serialize cyclic value");
    seen.add(input as object);
    if (Array.isArray(input)) {
      const output = input.map(normalize);
      seen.delete(input);
      return output;
    }
    const record = input as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      output[key] = normalize(record[key]);
    }
    seen.delete(input);
    return output;
  };
  return JSON.stringify(normalize(value));
}

export function semanticEquals(left: unknown, right: unknown): boolean {
  return stableJson(left) === stableJson(right);
}

export interface SemanticDifference {
  path: string;
  before: unknown;
  after: unknown;
}

export function semanticDiff(
  before: unknown,
  after: unknown,
  path = "$",
): SemanticDifference[] {
  if (Object.is(before, after)) return [];
  if (
    before === null ||
    after === null ||
    typeof before !== "object" ||
    typeof after !== "object"
  ) {
    return [{ path, before, after }];
  }
  if (Array.isArray(before) || Array.isArray(after)) {
    if (!Array.isArray(before) || !Array.isArray(after)) {
      return [{ path, before, after }];
    }
    if (before.length !== after.length) {
      return [{ path: `${path}.length`, before: before.length, after: after.length }];
    }
    return before.flatMap((value, index) => semanticDiff(value, after[index], `${path}[${index}]`));
  }
  const beforeRecord = before as Record<string, unknown>;
  const afterRecord = after as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)])].sort();
  return keys.flatMap((key) =>
    semanticDiff(beforeRecord[key], afterRecord[key], `${path}.${key}`),
  );
}

/** Request metadata legitimately changes between identical GETs. */
export function withoutRequestMetadata(body: Record<string, unknown>): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...body };
  const meta = clone.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const rest = { ...(meta as Record<string, unknown>) };
    delete rest.request_id;
    clone.meta = rest;
  }
  delete clone.request_id;
  return clone;
}

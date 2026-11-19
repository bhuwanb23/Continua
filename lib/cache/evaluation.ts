import { sha256Text } from "./hashes";

/** Patient-level label tokens that must never reach the runtime cache (Phase 10.69). */
export const LEAKAGE_TOKENS = [
  "truth_gap_id",
  "scenario_id",
  "expected_result",
  "ground_truth",
  "negative_manifest",
  "truth_event_id",
] as const;

export const FORBIDDEN_LABEL_TOKENS = ["difficulty", ...LEAKAGE_TOKENS] as const;

/** Volumes that carry label-level methodology internals rather than demo metrics. */
const DROPPED_REPORT_SECTIONS = ["funnel", "metadata", "preflight"] as const;

function containsLabelToken(value: string): boolean {
  return FORBIDDEN_LABEL_TOKENS.some((token) => value.includes(token));
}

function stripLabelKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripLabelKeys);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (containsLabelToken(key)) continue;
      result[key] = stripLabelKeys(entry);
    }
    return result;
  }
  if (typeof value === "string" && containsLabelToken(value)) return "[redacted]";
  return value;
}

export interface CacheEvaluationArtifact extends Record<string, unknown> {
  benchmark_run_id: string;
  benchmark_version: string;
  status: string;
  source_report_sha256: string;
}

/**
 * Projects the frozen Phase-9 report into the cache-safe evaluation artifact:
 * aggregate metrics survive, label-level internals (funnel ids, label hashes,
 * difficulty splits) never enter the runtime cache.
 */
export function projectEvaluationReport(report: Record<string, unknown>): CacheEvaluationArtifact {
  const sanitized = stripLabelKeys(report) as Record<string, unknown>;
  for (const section of DROPPED_REPORT_SECTIONS) delete sanitized[section];
  const extraction = sanitized.extraction;
  if (extraction && typeof extraction === "object") {
    delete (extraction as Record<string, unknown>).by_difficulty;
  }
  return {
    ...sanitized,
    benchmark_run_id: String(report.run_id ?? "unknown"),
    benchmark_version: String(report.benchmark_version ?? "continua-benchmark-v1"),
    status: String(report.status ?? "UNKNOWN"),
    source_report_sha256: sha256Text(JSON.stringify(report)),
  };
}

export function findLabelTokens(value: unknown, path = "$"): string[] {
  const found: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((entry, index) => found.push(...findLabelTokens(entry, `${path}[${index}]`)));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (containsLabelToken(key)) found.push(`${path}.${key}`);
      found.push(...findLabelTokens(entry, `${path}.${key}`));
    }
  } else if (typeof value === "string" && containsLabelToken(value)) {
    found.push(path);
  }
  return found;
}

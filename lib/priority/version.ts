import { createHash } from "node:crypto";
import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";
import type { VerifiedGapForPriority } from "./types";

export interface PriorityContext {
  evaluation_as_of_date: string;
  event_store_hash?: string;
  verified_gap_set_hash: string;
  config: PriorityConfig;
}

export interface PriorityContextOptions {
  evaluation_as_of_date: string;
  event_store_hash?: string;
  verified_gap_set_hash?: string;
  config?: PriorityConfig;
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function compareJson(left: unknown, right: unknown): number {
  const leftText = JSON.stringify(left);
  const rightText = JSON.stringify(right);
  if (leftText < rightText) return -1;
  if (leftText > rightText) return 1;
  return 0;
}

function canonicalGapForHash(gap: VerifiedGapForPriority): Record<string, unknown> {
  return {
    gap_id: gap.gap_id,
    patient_id: gap.patient_id,
    gap_type: gap.gap_type,
    severity: gap.severity,
    title: gap.title,
    temporal_state: gap.candidate.temporal_state,
    window_days: gap.candidate.window_days ?? null,
    due_date: gap.candidate.due_date ?? null,
    metadata: gap.candidate.metadata,
    positive: [...gap.evidence_bundle.positive]
      .map((item) => {
        const record = item as unknown as Record<string, unknown>;
        return [record["event_id"] ?? null, record["source_doc_id"] ?? null, record["quoted_span"] ?? null];
      })
      .sort(compareJson),
    absence: [...gap.evidence_bundle.absence]
      .map((item) => {
        const record = item as unknown as Record<string, unknown>;
        return [record["evidence_id"] ?? null, record["search_definition"] ?? null];
      })
      .sort(compareJson),
    policy: [...gap.evidence_bundle.policy]
      .map((item) => {
        const record = item as unknown as Record<string, unknown>;
        return [record["policy_id"] ?? null, record["rule"] ?? null, record["source"] ?? null];
      })
      .sort(compareJson),
    claims: [...gap.evidence_bundle.claims]
      .map((claim) => {
        const record = claim as unknown as Record<string, unknown>;
        return [record["claim_id"] ?? null, record["supported"] ?? null];
      })
      .sort(compareJson),
    verification: {
      evidence_version: gap.verification.evidence_version,
      detector_version: gap.verification.detector_version,
      gap_policy_version: gap.verification.gap_policy_version,
      event_store_hash: gap.verification.event_store_hash,
      evaluation_as_of_date: gap.verification.evaluation_as_of_date,
    },
  };
}

/** Stable fingerprint of the eligible verified-gap set, independent of input order. */
export function hashVerifiedGapSet(gaps: readonly VerifiedGapForPriority[]): string {
  const canonical = [...gaps]
    .sort((left, right) => {
      if (left.gap_id < right.gap_id) return -1;
      if (left.gap_id > right.gap_id) return 1;
      return 0;
    })
    .map(canonicalGapForHash);
  return createHash("sha256").update(stableStringify(canonical)).digest("hex");
}

export function createPriorityContext(
  gaps: readonly VerifiedGapForPriority[],
  options: PriorityContextOptions,
): PriorityContext {
  return {
    evaluation_as_of_date: options.evaluation_as_of_date,
    ...(options.event_store_hash === undefined ? {} : { event_store_hash: options.event_store_hash }),
    verified_gap_set_hash: options.verified_gap_set_hash ?? hashVerifiedGapSet(gaps),
    config: options.config ?? DEFAULT_PRIORITY_CONFIG,
  };
}

export function priorityPanelIsFresh(
  panel: { verified_gap_set_hash: string },
  currentVerifiedGaps: readonly VerifiedGapForPriority[],
): boolean {
  return panel.verified_gap_set_hash === hashVerifiedGapSet(currentVerifiedGaps);
}

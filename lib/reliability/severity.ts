import type { ReliabilityOutcome } from "./types";

export const RELIABILITY_SEVERITIES = ["R0", "R1", "R2", "R3"] as const;
export type ReliabilitySeverity = (typeof RELIABILITY_SEVERITIES)[number];

export interface SeverityDefinition {
  id: ReliabilitySeverity;
  label: "BLOCKER" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  release_blocking: boolean;
}

/**
 * Fused with the Phase-15 safety severity ladder: a failure that can produce
 * untrusted clinical-like output outranks any availability concern.
 */
export const SEVERITY_DEFINITIONS: Record<ReliabilitySeverity, SeverityDefinition> = {
  R0: {
    id: "R0",
    label: "BLOCKER",
    description:
      "Wrong-patient output, ungrounded gap, ground-truth leakage, silent corruption, real PHI exposure, or autonomous clinical action.",
    release_blocking: true,
  },
  R1: {
    id: "R1",
    label: "HIGH",
    description:
      "Materially wrong workflow output: queue ordering, stale verified gap, wrong due date, or incomplete analysis presented as complete.",
    release_blocking: true,
  },
  R2: {
    id: "R2",
    label: "MEDIUM",
    description:
      "Feature unavailable or degraded without unsafe data; may ship only with a documented workaround and explicit acceptance.",
    release_blocking: false,
  },
  R3: {
    id: "R3",
    label: "LOW",
    description: "Cosmetic or non-critical issue that does not block the flagship path.",
    release_blocking: false,
  },
};

/** UNSAFE_FAILURE is release blocking regardless of the severity row. */
export function blocksRelease(
  severity: ReliabilitySeverity,
  outcome: ReliabilityOutcome,
): boolean {
  return outcome === "UNSAFE_FAILURE" || severity === "R0" || severity === "R1";
}

export const FAILURE_PRIORITY_ORDER = [
  "trust_safety",
  "data_integrity",
  "correctness",
  "determinism",
  "availability",
  "performance",
  "visual_polish",
] as const;

export type FailurePriority = (typeof FAILURE_PRIORITY_ORDER)[number];

/**
 * When two mitigations conflict, the earlier dimension always wins. Suppressing
 * a gap is preferable to displaying an ungrounded one.
 */
export function preferredPriority(left: FailurePriority, right: FailurePriority): FailurePriority {
  return FAILURE_PRIORITY_ORDER.indexOf(left) <= FAILURE_PRIORITY_ORDER.indexOf(right) ? left : right;
}

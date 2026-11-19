import {
  CANDIDATE_GAP_SCHEMA_VERSION,
  DETECTOR_VERSION,
  EVIDENCE_SCHEMA_VERSION,
  GAP_POLICY_VERSION,
  VERIFIED_GAP_SCHEMA_VERSION,
} from "@/lib/domain";
import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";
import type { EligibilityReason, IneligibleGap, VerifiedGapForPriority } from "./types";

export type EligibilityResult =
  | { eligible: true; gap: VerifiedGapForPriority }
  | { eligible: false; ineligible: IneligibleGap };

export interface EligibilityOptions {
  evaluation_as_of_date: string;
  event_store_hash?: string;
  config?: PriorityConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function daysBetween(left: string, right: string): number | null {
  const leftMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(left);
  const rightMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(right);
  if (!leftMatch || !rightMatch) return null;
  const leftMs = Date.UTC(Number(leftMatch[1]), Number(leftMatch[2]) - 1, Number(leftMatch[3]));
  const rightMs = Date.UTC(Number(rightMatch[1]), Number(rightMatch[2]) - 1, Number(rightMatch[3]));
  return Math.round((leftMs - rightMs) / 86_400_000);
}

function reject(
  gap: unknown,
  reason: EligibilityReason,
  detail: string,
): EligibilityResult {
  const record = isRecord(gap) ? gap : {};
  return {
    eligible: false,
    ineligible: {
      gap_id: asString(record["gap_id"]),
      patient_id: asString(record["patient_id"]),
      reason,
      failure_code: reason === "STALE_EVENT_STORE" || reason === "STALE_EVALUATION_DATE" ? "PR-011" : "PR-001",
      detail,
    },
  };
}

function structurallyVerifiedGap(gap: unknown): gap is VerifiedGapForPriority {
  if (!isRecord(gap)) return false;
  if (!isRecord(gap["candidate"]) || !isRecord(gap["evidence_bundle"]) || !isRecord(gap["verification"])) {
    return false;
  }
  const candidate = gap["candidate"];
  const bundle = gap["evidence_bundle"];
  const verification = gap["verification"];
  return (
    asString(gap["gap_id"]) !== null &&
    asString(gap["patient_id"]) !== null &&
    asString(gap["gap_type"]) !== null &&
    asString(gap["severity"]) !== null &&
    isRecord(candidate["metadata"]) &&
    Array.isArray(bundle["positive"]) &&
    Array.isArray(bundle["absence"]) &&
    Array.isArray(bundle["policy"]) &&
    Array.isArray(bundle["claims"]) &&
    Array.isArray(bundle["failures"]) &&
    asString(verification["event_store_hash"]) !== null
  );
}

export function evaluateGapEligibility(
  value: unknown,
  options: EligibilityOptions,
): EligibilityResult {
  if (!structurallyVerifiedGap(value)) {
    return reject(value, "MALFORMED_GAP", "Priority input does not have the VerifiedGap v1 structure.");
  }

  const gap = value;
  const config = options.config ?? DEFAULT_PRIORITY_CONFIG;

  if (gap.schema_version !== VERIFIED_GAP_SCHEMA_VERSION) {
    return reject(gap, "MALFORMED_GAP", `Expected ${VERIFIED_GAP_SCHEMA_VERSION}.`);
  }
  if (gap.grounded !== true) {
    return reject(gap, "UNGROUNDED", "VerifiedGap must carry grounded: true.");
  }
  if (gap.candidate.schema_version !== CANDIDATE_GAP_SCHEMA_VERSION) {
    return reject(gap, "MALFORMED_GAP", "Candidate schema version is not candidate-gap-v1.");
  }

  if (
    gap.candidate.gap_id !== gap.gap_id ||
    gap.candidate.patient_id !== gap.patient_id ||
    gap.candidate.gap_type !== gap.gap_type ||
    gap.candidate.severity !== gap.severity
  ) {
    return reject(gap, "MALFORMED_GAP", "Candidate identity does not match the VerifiedGap identity.");
  }
  if (gap.candidate.metadata.kind !== gap.gap_type) {
    return reject(gap, "MALFORMED_METADATA", "Candidate metadata kind does not match the gap type.");
  }
  if (!(gap.severity in config.severity_weights)) {
    return reject(gap, "MALFORMED_GAP", `Unsupported workflow severity: ${gap.severity}.`);
  }

  if (
    gap.evidence_bundle.schema_version !== EVIDENCE_SCHEMA_VERSION ||
    gap.evidence_bundle.gap_id !== gap.gap_id ||
    gap.evidence_bundle.patient_id !== gap.patient_id ||
    gap.evidence_bundle.verification_status !== "verified" ||
    gap.evidence_bundle.failures.length > 0
  ) {
    return reject(gap, "EVIDENCE_UNVERIFIED", "Evidence bundle is not a verified evidence-v1 bundle.");
  }

  const positive = gap.evidence_bundle.positive;
  const absence = gap.evidence_bundle.absence;
  const policy = gap.evidence_bundle.policy;
  if (positive.length === 0 || absence.length === 0 || policy.length === 0) {
    return reject(gap, "EVIDENCE_UNVERIFIED", "A verified gap must include positive, absence, and policy evidence.");
  }
  if (!positive.every((item) => item.verified) || !absence.every((item) => item.verified) || !policy.every((item) => item.verified)) {
    return reject(gap, "EVIDENCE_UNVERIFIED", "One or more evidence items is not verified.");
  }

  const requiredClaims = gap.evidence_bundle.claims.filter((claim) => claim.required);
  if (
    gap.evidence_bundle.required_claim_count !== requiredClaims.length ||
    gap.evidence_bundle.supported_claim_count !== gap.evidence_bundle.claims.filter((claim) => claim.supported).length ||
    gap.evidence_bundle.claim_coverage !== 1 ||
    requiredClaims.some((claim) => !claim.supported)
  ) {
    return reject(gap, "CLAIMS_UNSUPPORTED", "Required evidence claims are not fully supported.");
  }

  if (
    gap.verification.evidence_version !== EVIDENCE_SCHEMA_VERSION ||
    gap.verification.detector_version !== DETECTOR_VERSION ||
    gap.verification.gap_policy_version !== GAP_POLICY_VERSION ||
    gap.candidate.detector_version !== DETECTOR_VERSION ||
    gap.candidate.policy_version !== GAP_POLICY_VERSION
  ) {
    return reject(gap, "VERSION_MISMATCH", "Gap was not produced by the frozen detector, policy, and evidence versions.");
  }

  if (
    gap.verification.event_store_hash !== gap.candidate.event_store_hash ||
    (options.event_store_hash !== undefined && gap.verification.event_store_hash !== options.event_store_hash)
  ) {
    return reject(gap, "STALE_EVENT_STORE", "Gap event-store hash does not match the current priority input snapshot.");
  }

  if (
    gap.verification.evaluation_as_of_date !== options.evaluation_as_of_date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(options.evaluation_as_of_date)
  ) {
    return reject(gap, "STALE_EVALUATION_DATE", "Gap evaluation date does not match the frozen priority date.");
  }

  const metadata = gap.candidate.metadata;
  if (gap.gap_type === "duplicate_test") {
    if (metadata.kind !== "duplicate_test") {
      return reject(gap, "MALFORMED_METADATA", "Duplicate gap does not carry duplicate-test metadata.");
    }
    const daysBetweenEvents = asFiniteNumber(metadata.days_between);
    if (daysBetweenEvents === null || daysBetweenEvents < 0 || daysBetweenEvents > 3650) {
      return reject(gap, "MALFORMED_METADATA", "Duplicate test metadata has an invalid days_between value.");
    }
  } else {
    if (metadata.kind !== gap.gap_type) {
      return reject(gap, "MALFORMED_METADATA", "Temporal gap does not carry matching metadata.");
    }
    const overdueDays = asFiniteNumber(metadata.overdue_days);
    const dueDate = asString(metadata.due_date);
    const asOf = asString(metadata.evaluation_as_of_date);
    const windowDays = metadata.kind === "missed_followup"
      ? asFiniteNumber(metadata.expected_window_days)
      : asFiniteNumber(metadata.monitoring_window_days);
    if (overdueDays === null || dueDate === null || asOf === null || windowDays === null || windowDays <= 0) {
      return reject(gap, "MALFORMED_METADATA", "Temporal gap metadata is incomplete or non-finite.");
    }
    if (asOf !== options.evaluation_as_of_date) {
      return reject(gap, "STALE_EVALUATION_DATE", "Gap metadata evaluation date is not the frozen priority date.");
    }
    const expectedOverdue = daysBetween(options.evaluation_as_of_date, dueDate);
    if (expectedOverdue === null || Math.max(0, expectedOverdue) !== overdueDays) {
      return reject(gap, "MALFORMED_METADATA", "overdue_days does not match the frozen evaluation date and due date.");
    }
  }

  return { eligible: true, gap };
}

export function filterEligibleGaps(
  gaps: readonly unknown[],
  options: EligibilityOptions,
): { eligible: VerifiedGapForPriority[]; ineligible: IneligibleGap[] } {
  const eligible: VerifiedGapForPriority[] = [];
  const ineligible: IneligibleGap[] = [];
  for (const gap of gaps) {
    const result = evaluateGapEligibility(gap, options);
    if (result.eligible) eligible.push(result.gap);
    else ineligible.push(result.ineligible);
  }
  return { eligible, ineligible };
}

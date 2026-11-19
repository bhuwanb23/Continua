import type { CandidateSeverity, GapType, VerifiedGap } from "@/lib/domain";

export const PRIORITY_SCHEMA_VERSION = "priority-v1" as const;
export const GAP_PRIORITY_SCHEMA_VERSION = "gap-priority-v1" as const;
export const PATIENT_PRIORITY_SCHEMA_VERSION = "patient-priority-v1" as const;
export const PRIORITY_PANEL_SCHEMA_VERSION = "priority-panel-v1" as const;
export const QUEUE_SCHEMA_VERSION = "priority-queue-v1" as const;

export const PRIORITY_VERSION = "priority-v1" as const;

export const WORKFLOW_PRIORITY_BANDS = ["P1", "P2", "P3", "P4", "NONE"] as const;
export type WorkflowPriorityBand = (typeof WORKFLOW_PRIORITY_BANDS)[number];

export const GAP_PRIORITY_BANDS = ["P1", "P2", "P3", "P4"] as const;
export type GapPriorityBand = (typeof GAP_PRIORITY_BANDS)[number];

export const PRIORITY_FAILURE_CODES = [
  "PR-001",
  "PR-002",
  "PR-003",
  "PR-004",
  "PR-005",
  "PR-006",
  "PR-007",
  "PR-008",
  "PR-009",
  "PR-010",
  "PR-011",
  "PR-012",
] as const;
export type PriorityFailureCode = (typeof PRIORITY_FAILURE_CODES)[number];

export const PRIORITY_FAILURE_DESCRIPTIONS: Record<PriorityFailureCode, string> = {
  "PR-001": "Unverified gap ranked.",
  "PR-002": "Formula mismatch.",
  "PR-003": "Temporal factor incorrect.",
  "PR-004": "Severity mapping incorrect.",
  "PR-005": "Actionability mapping incorrect.",
  "PR-006": "Secondary bonus exceeds cap.",
  "PR-007": "Patient score normalization wrong.",
  "PR-008": "Non-deterministic tie.",
  "PR-009": "Demographic field affected priority.",
  "PR-010": "Patient-specific exception.",
  "PR-011": "Stale priority calculated from an outdated gap set.",
  "PR-012": "Score/band mismatch.",
};

export type EligibilityReason =
  | "MALFORMED_GAP"
  | "UNGROUNDED"
  | "EVIDENCE_UNVERIFIED"
  | "CLAIMS_UNSUPPORTED"
  | "VERSION_MISMATCH"
  | "STALE_EVENT_STORE"
  | "STALE_EVALUATION_DATE"
  | "MALFORMED_METADATA";

export interface IneligibleGap {
  gap_id: string | null;
  patient_id: string | null;
  reason: EligibilityReason;
  failure_code: "PR-001" | "PR-011";
  detail: string;
}

export type TemporalBucket =
  | "not_overdue"
  | "overdue_1_7"
  | "overdue_8_30"
  | "overdue_31_60"
  | "overdue_61_90"
  | "overdue_over_90"
  | "duplicate_not_applicable";

export type ActionabilityClass = "direct_coordinator_action" | "review_with_provider";

export interface GapPriorityBreakdown {
  severity: CandidateSeverity;
  severity_weight: number;
  temporal_factor: number;
  temporal_bucket: TemporalBucket;
  overdue_days: number | null;
  window_days: number | null;
  overdue_ratio: number | null;
  actionability_class: ActionabilityClass;
  actionability_weight: number;
}

export interface GapInterventionPriority {
  schema_version: typeof GAP_PRIORITY_SCHEMA_VERSION;
  gap_id: string;
  patient_id: string;
  gap_type: GapType;
  severity: CandidateSeverity;
  raw_score: number;
  gap_priority_score: number;
  priority_band: GapPriorityBand;
  breakdown: GapPriorityBreakdown;
  priority_version: typeof PRIORITY_VERSION;
  evidence_version: string;
  detector_version: string;
  verified_gap_set_hash: string;
  evaluation_as_of_date: string;
}

export interface PatientPriorityBreakdown {
  top_gap_id: string | null;
  top_gap_raw: number;
  top_gap_overdue_days: number | null;
  verified_gap_count: number;
  secondary_gap_count: number;
  secondary_raw_sum: number;
  secondary_factor: number;
  secondary_bonus: number;
  patient_raw_score: number;
}

export interface PatientInterventionPriority {
  schema_version: typeof PATIENT_PRIORITY_SCHEMA_VERSION;
  patient_id: string;
  patient_priority_score: number;
  priority_band: WorkflowPriorityBand;
  /** Null means the patient has no verified gap and is not queue-eligible. */
  rank: number | null;
  breakdown: PatientPriorityBreakdown;
  priority_version: typeof PRIORITY_VERSION;
  verified_gap_set_hash: string;
  evaluation_as_of_date: string;
}

export interface PriorityPanel {
  schema_version: typeof PRIORITY_PANEL_SCHEMA_VERSION;
  priority_version: typeof PRIORITY_VERSION;
  evidence_version: string;
  detector_version: string;
  verified_gap_set_hash: string;
  evaluation_as_of_date: string;
  gap_priorities: GapInterventionPriority[];
  patient_priorities: PatientInterventionPriority[];
  ineligible_gaps: IneligibleGap[];
  ranked_patient_count: number;
}

export interface PriorityTopGap {
  gap_id: string;
  gap_type: GapType;
  title: string;
  severity: CandidateSeverity;
  gap_priority_score: number;
  priority_band: GapPriorityBand;
}

export interface PriorityExplanation {
  why_band: string;
  top_verified_issue: string;
  workflow_severity: CandidateSeverity;
  overdue_days: number | null;
  days_between: number | null;
  action: string;
  other_verified_issues: number;
  factors: GapPriorityBreakdown;
  patient_aggregation: PatientPriorityBreakdown;
  arithmetic: string;
  disclaimer: string;
}

export interface QueueItem {
  rank: number;
  patient_id: string;
  display_name: string;
  patient_priority_score: number;
  priority_band: Exclude<WorkflowPriorityBand, "NONE">;
  top_gap: PriorityTopGap;
  verified_gap_count: number;
  headline: string;
  recommended_coordinator_action: string;
  priority_breakdown: PatientPriorityBreakdown;
  explanation: PriorityExplanation;
  priority_version: typeof PRIORITY_VERSION;
}

export interface QueueApiResponse {
  schema_version: typeof QUEUE_SCHEMA_VERSION;
  panel_id: string;
  k: number;
  items: QueueItem[];
  priority_version: typeof PRIORITY_VERSION;
  evaluation_as_of_date: string;
  disclaimer: string;
}

/** Type-level trust boundary: priority consumes Phase 7 VerifiedGap only. */
export type VerifiedGapForPriority = VerifiedGap;

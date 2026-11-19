import type { GapType } from "./gap";

export const CANDIDATE_GAP_SCHEMA_VERSION = "candidate-gap-v1" as const;
export const GAP_POLICY_VERSION = "gap-policy-v1" as const;
export type CandidateDetectorVersion = "gaps-v1";

export const TEMPORAL_STATES = ["OPEN", "DUE_SOON", "OVERDUE", "RESOLVED"] as const;
export type TemporalState = (typeof TEMPORAL_STATES)[number];

export const CANDIDATE_SEVERITIES = ["high", "medium", "low"] as const;
export type CandidateSeverity = (typeof CANDIDATE_SEVERITIES)[number];

export const COORDINATOR_ACTIONS = [
  "Verify referral status and coordinate follow-up.",
  "Review repeat test history and confirm whether the repeat was intended.",
  "Verify monitoring status and coordinate follow-up if unresolved.",
] as const;
export type CoordinatorAction = (typeof COORDINATOR_ACTIONS)[number];

export interface EvidenceRef {
  event_id: string;
  source_doc_id: string;
  source_span: string;
}

export interface CandidateGapIdentity {
  specialty?: string;
  test?: string;
  modality?: string;
  body_region?: string;
  drug?: string;
  monitoring_target?: string;
  event_ids?: string[];
  [key: string]: unknown;
}

interface CandidateGapBase {
  schema_version: typeof CANDIDATE_GAP_SCHEMA_VERSION;
  gap_id: string;
  patient_id: string;
  gap_type: GapType;
  detector_version: CandidateDetectorVersion;
  policy_version: typeof GAP_POLICY_VERSION;
  event_store_hash?: string;
  severity: CandidateSeverity;
  identity: CandidateGapIdentity;
  trigger_event_ids: string[];
  evidence_refs: EvidenceRef[];
  window_days?: number;
  due_date?: string;
  temporal_state: TemporalState;
  metadata: GapMetadata;
  rationale: GapRationale;
  recommended_coordinator_action: CoordinatorAction;
}

export interface MissedFollowupMetadata {
  kind: "missed_followup";
  specialty: string;
  referral_event_id: string;
  referral_date: string;
  expected_window_days: number;
  due_date: string;
  evaluation_as_of_date: string;
  overdue_days: number;
  referral_status: string;
  supporting_referral_event_ids: string[];
}

export interface DuplicateTestMetadata {
  kind: "duplicate_test";
  diagnostic_kind: "lab" | "imaging";
  normalized_identity: string;
  first_event_id: string;
  second_event_id: string;
  first_date: string;
  second_date: string;
  days_between: number;
  occurrence_count: number;
  event_ids: string[];
}

export interface MedicationMonitoringMetadata {
  kind: "med_monitoring";
  medication: string;
  medication_start_event_id: string;
  medication_start_date: string;
  monitoring_target: string;
  monitoring_window_days: number;
  due_date: string;
  evaluation_as_of_date: string;
  overdue_days: number;
}

export type GapMetadata = MissedFollowupMetadata | DuplicateTestMetadata | MedicationMonitoringMetadata;

export interface GapRationale {
  rule: string;
  facts: Record<string, string | number | boolean | null>;
}

export interface MissedFollowupCandidate extends CandidateGapBase {
  gap_type: "missed_followup";
  metadata: MissedFollowupMetadata;
}

export interface DuplicateTestCandidate extends CandidateGapBase {
  gap_type: "duplicate_test";
  metadata: DuplicateTestMetadata;
}

export interface MedicationMonitoringCandidate extends CandidateGapBase {
  gap_type: "med_monitoring";
  metadata: MedicationMonitoringMetadata;
}

export type CandidateGap = MissedFollowupCandidate | DuplicateTestCandidate | MedicationMonitoringCandidate;

export interface DetectionContext {
  evaluation_as_of_date: string;
  policy_version: typeof GAP_POLICY_VERSION;
  detector_version: CandidateDetectorVersion;
  event_store_hash?: string;
}

export interface GapDetector {
  readonly name: string;
  readonly version: string;
  detect(events: import("./clinical-event").CanonicalClinicalEvent[], context: DetectionContext): CandidateGap[];
}

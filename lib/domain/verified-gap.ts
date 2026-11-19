import type { CandidateGap, CandidateSeverity } from "./candidate-gap";
import type { GapType } from "./gap";

export const EVIDENCE_SCHEMA_VERSION = "evidence-v1" as const;
export const VERIFIED_GAP_SCHEMA_VERSION = "verified-gap-v1" as const;

export const EVIDENCE_FAILURE_CODES = [
  "EV-001",
  "EV-002",
  "EV-003",
  "EV-004",
  "EV-005",
  "EV-006",
  "EV-007",
  "EV-008",
  "EV-009",
  "EV-010",
  "EV-011",
  "EV-012",
] as const;
export type EvidenceFailureCode = (typeof EVIDENCE_FAILURE_CODES)[number];

export const EVIDENCE_FAILURE_DESCRIPTIONS: Record<EvidenceFailureCode, string> = {
  "EV-001": "Document not found.",
  "EV-002": "Patient mismatch.",
  "EV-003": "Event/source mismatch.",
  "EV-004": "Exact/fuzzy span failed.",
  "EV-005": "Critical normalized field unsupported.",
  "EV-006": "Policy missing.",
  "EV-007": "Policy version mismatch.",
  "EV-008": "Absence query invalid.",
  "EV-009": "Absence contradicted by matching event.",
  "EV-010": "Required claim unsupported.",
  "EV-011": "Stale event-store version.",
  "EV-012": "Malformed evidence bundle.",
};

export const VERIFICATION_STAGES = [
  "candidate",
  "document",
  "ownership",
  "span",
  "fields",
  "absence",
  "policy",
  "claims",
] as const;
export type VerificationStage = (typeof VERIFICATION_STAGES)[number];

export type InternalVerificationStatus =
  | "VERIFIED"
  | "SOURCE_MISSING"
  | "PATIENT_MISMATCH"
  | "SPAN_FAILED"
  | "EVENT_MISMATCH"
  | "POLICY_MISSING"
  | "ABSENCE_QUERY_INVALID"
  | "INSUFFICIENT_SUPPORT";

export interface VerificationFailure {
  code: EvidenceFailureCode;
  stage: VerificationStage;
  message: string;
  evidence_id?: string;
  event_id?: string;
  source_doc_id?: string;
}

export interface PositiveSourceEvidence {
  evidence_id: string;
  kind: "source_span";
  patient_id: string;
  event_id: string;
  event_type: string;
  source_doc_id: string;
  quoted_span: string;
  span_start?: number;
  span_end?: number;
  verification_method: "exact" | "fuzzy";
  verification_score: number;
  verified: boolean;
}

export interface AbsenceSearchDefinition {
  event_types: string[];
  normalized_identity: string;
  start_date: string;
  end_date: string;
}

export interface AbsenceEvidence {
  evidence_id: string;
  kind: "absence";
  patient_id: string;
  search_definition: AbsenceSearchDefinition;
  matching_event_count: number;
  matching_event_ids: string[];
  event_store_version: string;
  evaluation_as_of_date: string;
  verified: boolean;
}

export type PolicySource = "benchmark_policy" | "document_extracted";

export interface PolicyEvidence {
  evidence_id: string;
  kind: "policy";
  patient_id: string;
  policy_id: string;
  policy_version: string;
  rule: string;
  source: PolicySource;
  verified: boolean;
}

export type EvidenceItem = PositiveSourceEvidence | AbsenceEvidence | PolicyEvidence;

export interface EvidenceClaim {
  claim_id: string;
  claim: string;
  value?: string | number | boolean;
  required: boolean;
  supported: boolean;
  evidence_ids: string[];
}

export interface EvidenceBundle {
  schema_version: typeof EVIDENCE_SCHEMA_VERSION;
  gap_id: string;
  patient_id: string;
  positive: PositiveSourceEvidence[];
  absence: AbsenceEvidence[];
  policy: PolicyEvidence[];
  claims: EvidenceClaim[];
  required_claim_count: number;
  supported_claim_count: number;
  claim_coverage: number;
  verification_status: "verified" | "failed";
  failures: VerificationFailure[];
}

export interface EvidenceAuditStep {
  step:
    | "candidate_received"
    | "evidence_collected"
    | "documents_verified"
    | "spans_verified"
    | "fields_verified"
    | "absence_verified"
    | "policies_verified"
    | "decision";
  status: "pass" | "fail" | "info";
  detail: string;
  evidence_id?: string;
}

export interface StructuredRationaleClaim {
  claim: string;
  value?: string | number | boolean;
  evidence_id: string;
}

export interface StructuredRationale {
  rule: string;
  claims: StructuredRationaleClaim[];
  text: string;
}

export interface EvidenceSourceDeepDive {
  evidence_id: string;
  event_id: string;
  event_type: string;
  source_doc_id: string;
  document_type: string;
  provider: string;
  document_date: string;
  quoted_span: string;
  span_start?: number;
  span_end?: number;
  source_text_excerpt: string;
  normalization: string;
}

export interface AbsenceDeepDive {
  evidence_id: string;
  event_types: string[];
  normalized_identity: string;
  window_start: string;
  window_end: string;
  matching_event_count: number;
}

export interface PolicyDeepDive {
  evidence_id: string;
  policy_id: string;
  policy_version: string;
  rule: string;
  source: PolicySource;
  display: string;
}

export interface EvidenceDeepDive {
  sources: EvidenceSourceDeepDive[];
  absence_checks: AbsenceDeepDive[];
  policy_checks: PolicyDeepDive[];
}

export interface VerifiedGapVerification {
  evidence_version: typeof EVIDENCE_SCHEMA_VERSION;
  clinical_event_schema: string;
  extractor_version: string;
  detector_version: string;
  gap_policy_version: string;
  dataset_version: string;
  event_store_hash: string;
  evaluation_as_of_date: string;
  verified_at: string;
}

export interface VerifiedGap {
  schema_version: typeof VERIFIED_GAP_SCHEMA_VERSION;
  gap_id: string;
  patient_id: string;
  gap_type: GapType;
  severity: CandidateSeverity;
  title: string;
  candidate: CandidateGap;
  evidence_bundle: EvidenceBundle;
  grounded: true;
  rationale: StructuredRationale;
  explanation: string;
  recommended_coordinator_action: CandidateGap["recommended_coordinator_action"];
  evidence_deep_dive: EvidenceDeepDive;
  verification: VerifiedGapVerification;
}

export interface SuppressionRecord {
  gap_id: string;
  patient_id: string;
  gap_type: GapType;
  status: "suppressed";
  failure_codes: EvidenceFailureCode[];
  primary_failure_code: EvidenceFailureCode;
  event_id?: string;
  source_doc_id?: string;
  evidence_version: typeof EVIDENCE_SCHEMA_VERSION;
  message: string;
}

export interface GapVerificationResult {
  candidate: CandidateGap;
  status: "verified" | "suppressed";
  internal_status: InternalVerificationStatus;
  verified_gap: VerifiedGap | null;
  bundle: EvidenceBundle;
  suppression: SuppressionRecord | null;
  audit: EvidenceAuditStep[];
}

export interface EvidenceApiSource {
  evidence_id: string;
  event_id: string;
  source_doc_id: string;
  document_type: string;
  provider: string;
  document_date: string;
  quoted_span: string;
  span_start?: number;
  span_end?: number;
  excerpt: string;
}

export interface EvidenceApiClaim {
  claim: string;
  value?: string | number | boolean;
  evidence_ids: string[];
}

export interface EvidenceApiResponse {
  gap_id: string;
  verification_status: "verified";
  claims: EvidenceApiClaim[];
  sources: EvidenceApiSource[];
  absence_checks: AbsenceDeepDive[];
  policy_checks: PolicyDeepDive[];
  disclaimer: string;
}

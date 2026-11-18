import type { CanonicalClinicalEvent } from "./clinical-event";
import type { ClinicalEventSchemaVersion } from "./versions";

export const REJECTION_CODES = [
  "CE-001",
  "CE-002",
  "CE-003",
  "CE-004",
  "CE-005",
  "CE-006",
  "CE-007",
  "CE-008",
  "CE-009",
  "CE-010",
] as const;

export type ClinicalEventRejectionCode = (typeof REJECTION_CODES)[number];

export interface ClinicalEventRejection {
  code: ClinicalEventRejectionCode;
  stage: "clinical_event_validation" | "normalization" | "identity";
  reason: string;
  candidate_event: unknown;
}

export interface ClinicalEventStore {
  accepted: CanonicalClinicalEvent[];
  rejected: ClinicalEventRejection[];
  metadata: {
    clinical_event_schema: ClinicalEventSchemaVersion;
    normalization_version: string;
    extractor_version: string;
  };
}

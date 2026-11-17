import type { PriorityBand } from "./gap";

export interface GapPriorityFactors {
  severity_weight: number;
  overdue_factor: number;
  evidence_confidence: number;
  actionability_weight: number;
  gap_type_weight: number;
}

/** The contribution of a single gap. Never a patient-level rank. */
export interface GapPriority {
  gap_id: string;
  gap_priority_score: number;
  band: PriorityBand;
  raw_score: number;
  factors: GapPriorityFactors;
}

/** The patient's queue rank. Never a clinical risk score. safety-allow: negation */
export interface PatientInterventionPriority {
  patient_id: string;
  patient_priority_score: number;
  band: PriorityBand;
  primary_gap_id: string | null;
  additional_gap_bonus: number;
  raw_score: number;
}

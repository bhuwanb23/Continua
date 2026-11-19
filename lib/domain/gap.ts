export const GAP_TYPES = [
  "missed_followup",
  "duplicate_test",
  "med_monitoring",
] as const;

export type GapType = (typeof GAP_TYPES)[number];

/**
 * SPEC-1.2 workflow bands. P1–P4 describe coordinator queue position; they
 * are not clinical acuity labels. NONE means no verified coordination gap.
 */
export const PRIORITY_BANDS = ["P1", "P2", "P3", "P4", "NONE"] as const;

export type PriorityBand = (typeof PRIORITY_BANDS)[number];

export const GAP_SEVERITIES = ["high", "med", "low"] as const;

export type GapSeverity = (typeof GAP_SEVERITIES)[number];

export interface GapEvidenceRef {
  doc_id: string;
  quoted_span: string;
  event_id: string;
}

export interface Gap {
  gap_id: string;
  patient_id: string;
  gap_type: GapType;
  severity: GapSeverity;
  title: string;
  trigger_event_ids: string[];
  window_days: number;
  overdue_days: number;
  due_date?: string | undefined;
  evidence: GapEvidenceRef[];
  recommended_coordinator_action: string;
  estimated_impact: string;
  priority_band: PriorityBand;
  gap_priority_score: number;
  confidence: number;
  detector_version: string;
  grounded: boolean;
}

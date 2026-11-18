import type {
  CanonicalClinicalEvent,
  EvalResult,
  Gap,
  Patient,
  PatientInterventionPriority,
  PriorityBand,
  SourceRecord,
} from "@/lib/domain";
import type { CachedArtifact } from "./contract";

export interface PanelSummary {
  panel_id: string;
  name: string;
  patient_count: number;
  flagged_patient_count: number;
  gap_counts: Record<string, number>;
  generated_at: string;
}

export interface QueueItem {
  rank: number;
  patient_id: string;
  name: string;
  priority_band: PriorityBand;
  patient_priority_score: number;
  headline: string;
  top_gap_id: string | null;
}

export interface ImpactSummary {
  patient_count: number;
  gaps_detected: number;
  patients_with_gaps: number;
}

export type PanelCache = CachedArtifact<PanelSummary>;
export type PatientsCache = CachedArtifact<Patient[]>;
export type PatientPrioritiesCache = CachedArtifact<PatientInterventionPriority[]>;
export type RecordsCache = CachedArtifact<SourceRecord[]>;
export type TimelinesCache = CachedArtifact<CanonicalClinicalEvent[]>;
export type GapsCache = CachedArtifact<Gap[]>;
export type QueueCache = CachedArtifact<QueueItem[]>;
export type ImpactCache = CachedArtifact<ImpactSummary>;
export type EvaluationCache = CachedArtifact<EvalResult>;

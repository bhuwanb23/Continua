import type { EventType, ProviderType, SeriesStatus } from "@/lib/domain";

export type Specialty =
  | "primary_care"
  | "oncology"
  | "cardiology"
  | "endocrinology"
  | "surgery"
  | "laboratory"
  | "imaging"
  | "pharmacy";

export type Cohort = "oncology" | "cardio" | "metabolic" | "mixed";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type GapType = "missed_followup" | "duplicate_test" | "med_monitoring";

export type ScenarioId =
  | "T01"
  | "T02"
  | "T03"
  | "T04"
  | "T05"
  | "T06"
  | "HN-01"
  | "HN-02"
  | "HN-03"
  | "HN-04"
  | "HN-05"
  | "HN-06"
  | "HN-07"
  | "HN-08"
  | "HN-09"
  | "HN-10"
  | "HN-11"
  | "HN-12"
  | "HN-13"
  | "HN-14"
  | "HN-15"
  | "CLEAN";

export interface SyntheticProvider {
  provider_id: string;
  fixture_key: string;
  display_name: string;
  specialty: Specialty;
  organization: string;
  synthetic: true;
}

export interface SyntheticPatient {
  patient_id: string;
  fixture_key: string;
  display_name: string;
  birth_year: number;
  sex: "F" | "M" | "X";
  demo_age: number;
  primary_condition: string;
  primary_diagnosis: string;
  care_pathway: Specialty;
  cohort: Cohort;
  difficulty: Difficulty;
  last_contact_date: string;
  dataset_version: string;
  synthetic: true;
}

export interface DatasetRecord {
  source_doc_id: string;
  fixture_key: string;
  patient_id: string;
  doc_type:
    | "referral"
    | "consult_note"
    | "lab_report"
    | "imaging_report"
    | "medication_list"
    | "discharge_summary"
    | "followup"
    | "other";
  provider: string;
  provider_type: ProviderType;
  date: string;
  text: string;
  dataset_version: string;
  generator_version: string;
  synthetic: true;
  template_id: string;
  content_hash: string;
  date_precision?: "day" | "month";
  series_status?: SeriesStatus;
  duplicate_of?: string;
}

export interface TruthEvent {
  event_id: string;
  patient_id: string;
  date: string;
  event_type: EventType;
  description: string;
  provider_id: string;
  provider: string;
  provider_type: ProviderType;
  specialty: string | null;
  window_days: number | null;
  typed: Record<string, unknown>;
  source_doc_id: string;
  source_span: string;
  confidence: number;
  series_status: SeriesStatus;
  scenario_id: ScenarioId;
  date_precision: "day" | "month";
}

export interface GapTruth {
  gap_truth_id: string;
  patient_id: string;
  gap_type: GapType;
  trigger_event_id: string;
  source_doc_ids: string[];
  expected_window_days: number;
  evaluation_as_of_date: string;
  scenario_id: ScenarioId;
}

export interface NegativeTruth {
  patient_id: string;
  scenario_id: ScenarioId;
  detector: GapType | "all";
  expected: "no_gap";
  reason: string;
}

export interface ExtractionGoldEvent {
  event_id: string;
  patient_id: string;
  event_type: EventType;
  date: string;
  normalized_entity: string | null;
  provider: string;
  source_doc_id: string;
  source_span: string;
}

export interface DatasetManifest {
  dataset_version: string;
  generator_version: string;
  seed: number;
  evaluation_as_of_date: string;
  synthetic: true;
  patient_count: number;
  provider_count: number;
  document_count: number;
  positive_patients: number;
  negative_patients: number;
  gap_counts: Record<GapType, number>;
  total_gaps: number;
  hard_negative_families: string[];
  extraction_gold_patients: number;
  extraction_gold_events: number;
  hashes: Record<string, string>;
  content_hash: string;
  frozen_at: string;
}

export interface GeneratedDataset {
  manifest: DatasetManifest;
  files: Record<string, unknown>;
  patients: SyntheticPatient[];
  providers: SyntheticProvider[];
  records: DatasetRecord[];
  truthEvents: TruthEvent[];
  groundTruth: GapTruth[];
  negativeManifest: NegativeTruth[];
  extractionGold: ExtractionGoldEvent[];
}

import type {
  ClinicalEvent,
  EvalResult,
  Gap,
  Patient,
  SourceRecord,
} from "@/lib/domain";
import type { CachedArtifact } from "@/lib/cache/contract";

export interface PatientRepository {
  getById(patientId: string): Promise<Patient | null>;
  list(): Promise<Patient[]>;
}

export interface RecordRepository {
  listByPatient(patientId: string): Promise<SourceRecord[]>;
}

export interface TimelineRepository {
  listByPatient(patientId: string): Promise<ClinicalEvent[]>;
}

export interface GapRepository {
  getById(gapId: string): Promise<Gap | null>;
  listByPatient(patientId: string): Promise<Gap[]>;
}

export interface EvaluationRepository {
  getLatest(): Promise<EvalResult | null>;
}

export interface DemoCacheRepository {
  get<T>(key: string): Promise<CachedArtifact<T> | null>;
  set<T>(key: string, artifact: CachedArtifact<T>): Promise<void>;
}

import type {
  CanonicalClinicalEvent,
  EvalResult,
  Gap,
  Patient,
  SourceRecord,
  VerifiedGap,
} from "@/lib/domain";
import type { EvidenceBundle } from "@/lib/domain";
import type { GapInterventionPriority, PatientInterventionPriority } from "@/lib/priority/types";
import type { CachedArtifact } from "@/lib/cache/contract";
import type { DemoCacheIndexes } from "@/lib/cache/indexes";
import type { CacheManifest } from "@/lib/cache/manifest";
import type {
  DemoImpactArtifact,
  DemoMariaArtifact,
  DemoPanelArtifact,
  DemoQueueArtifact,
} from "@/lib/cache/validate";
import type { DemoCacheReadiness } from "./demo-cache-store";

/** Frozen benchmark report; shape is owned by Phase 9 (`final-report.json`). */
export type BenchmarkReportArtifact = Record<string, unknown> & {
  benchmark_version?: string;
  run_id?: string;
  status?: string;
};

export interface PanelRepository {
  getPanel(): Promise<DemoPanelArtifact>;
}

export interface PatientRepository {
  getById(patientId: string): Promise<Patient | null>;
  list(): Promise<Patient[]>;
}

export interface RecordRepository {
  listByPatient(patientId: string): Promise<SourceRecord[]>;
  getById(sourceDocId: string): Promise<SourceRecord | null>;
}

export interface TimelineRepository {
  listByPatient(patientId: string): Promise<CanonicalClinicalEvent[]>;
}

export interface GapRepository {
  getById(gapId: string): Promise<Gap | null>;
  listByPatient(patientId: string): Promise<Gap[]>;
}

export interface VerifiedGapRepository {
  getById(gapId: string): Promise<VerifiedGap | null>;
  listByPatient(patientId: string): Promise<VerifiedGap[]>;
  listAll(): Promise<VerifiedGap[]>;
}

export interface EvidenceRepository {
  getByGapId(gapId: string): Promise<EvidenceBundle | null>;
  getDeepDive(gapId: string): Promise<Record<string, unknown> | null>;
}

export interface PriorityRepository {
  getPatientPriority(patientId: string): Promise<PatientInterventionPriority | null>;
  listPatientPriorities(): Promise<PatientInterventionPriority[]>;
  getGapPriority(gapId: string): Promise<GapInterventionPriority | null>;
  getQueue(k?: number): Promise<DemoQueueArtifact>;
}

/** Legacy Phase-1 evaluation boundary (`EvalResult`). Kept for older callers. */
export interface EvaluationRepository {
  getLatest(): Promise<EvalResult | null>;
}

export interface BenchmarkEvaluationRepository {
  getReport(): Promise<BenchmarkReportArtifact>;
}

export interface ImpactRepository {
  get(): Promise<DemoImpactArtifact>;
}

export interface MariaRepository {
  get(): Promise<DemoMariaArtifact>;
}

export interface DemoCacheRepository {
  get<T>(key: string): Promise<CachedArtifact<T> | null>;
  set<T>(key: string, artifact: CachedArtifact<T>): Promise<void>;
}

export interface JsonDemoRepositoryConfig {
  cacheDir: string;
}

export interface JsonDemoRepositoryState {
  state: DemoCacheReadiness;
  manifest: CacheManifest;
  indexes: DemoCacheIndexes;
  ready: boolean;
}

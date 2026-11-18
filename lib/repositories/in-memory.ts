import type {
  CanonicalClinicalEvent,
  EvalResult,
  Gap,
  Patient,
  SourceRecord,
} from "@/lib/domain";
import type { CachedArtifact } from "@/lib/cache/contract";
import type {
  DemoCacheRepository,
  EvaluationRepository,
  GapRepository,
  PatientRepository,
  RecordRepository,
  TimelineRepository,
} from "./types";
import { sortClinicalEvents } from "@/lib/clinical-events";

export class InMemoryPatientRepository implements PatientRepository {
  private readonly patients = new Map<string, Patient>();

  constructor(patients: Patient[] = []) {
    for (const patient of patients) {
      this.patients.set(patient.patient_id, patient);
    }
  }

  async getById(patientId: string): Promise<Patient | null> {
    return this.patients.get(patientId) ?? null;
  }

  async list(): Promise<Patient[]> {
    return [...this.patients.values()];
  }
}

export class InMemoryRecordRepository implements RecordRepository {
  constructor(private readonly records: SourceRecord[] = []) {}

  async listByPatient(patientId: string): Promise<SourceRecord[]> {
    return this.records.filter((record) => record.patient_id === patientId);
  }
}

export class InMemoryTimelineRepository implements TimelineRepository {
  constructor(private readonly events: CanonicalClinicalEvent[] = []) {}

  async listByPatient(patientId: string): Promise<CanonicalClinicalEvent[]> {
    return sortClinicalEvents(this.events.filter((event) => event.patient_id === patientId));
  }
}

export class InMemoryGapRepository implements GapRepository {
  private readonly gaps = new Map<string, Gap>();

  constructor(gaps: Gap[] = []) {
    for (const gap of gaps) {
      this.gaps.set(gap.gap_id, gap);
    }
  }

  async getById(gapId: string): Promise<Gap | null> {
    return this.gaps.get(gapId) ?? null;
  }

  async listByPatient(patientId: string): Promise<Gap[]> {
    return [...this.gaps.values()].filter((gap) => gap.patient_id === patientId);
  }
}

export class InMemoryEvaluationRepository implements EvaluationRepository {
  constructor(private latest: EvalResult | null = null) {}

  async getLatest(): Promise<EvalResult | null> {
    return this.latest;
  }
}

export class InMemoryDemoCacheRepository implements DemoCacheRepository {
  private readonly store = new Map<string, CachedArtifact<unknown>>();

  async get<T>(key: string): Promise<CachedArtifact<T> | null> {
    const artifact = this.store.get(key);
    return artifact ? (artifact as CachedArtifact<T>) : null;
  }

  async set<T>(key: string, artifact: CachedArtifact<T>): Promise<void> {
    this.store.set(key, artifact as CachedArtifact<unknown>);
  }
}

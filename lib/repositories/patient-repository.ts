import type { Patient } from "@/lib/domain";
import type { DemoCacheStore } from "./demo-cache-store";
import type { PatientRepository } from "./types";

export class JsonPatientRepository implements PatientRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async getById(patientId: string): Promise<Patient | null> {
    return this.store.requireIndexes().patientById.get(patientId) ?? null;
  }

  async list(): Promise<Patient[]> {
    return [...this.store.requireIndexes().patientById.values()];
  }
}

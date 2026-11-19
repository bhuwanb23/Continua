import type { SourceRecord } from "@/lib/domain";
import type { DemoCacheStore } from "./demo-cache-store";
import type { RecordRepository } from "./types";

export class JsonRecordRepository implements RecordRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async listByPatient(patientId: string): Promise<SourceRecord[]> {
    return [...(this.store.requireIndexes().recordsByPatient.get(patientId) ?? [])];
  }

  async getById(sourceDocId: string): Promise<SourceRecord | null> {
    return this.store.requireIndexes().recordById.get(sourceDocId) ?? null;
  }
}

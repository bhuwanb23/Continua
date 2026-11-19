import type { VerifiedGap } from "@/lib/domain";
import type { DemoCacheStore } from "./demo-cache-store";
import type { VerifiedGapRepository } from "./types";

export class JsonVerifiedGapRepository implements VerifiedGapRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async getById(gapId: string): Promise<VerifiedGap | null> {
    return this.store.requireIndexes().gapById.get(gapId) ?? null;
  }

  async listByPatient(patientId: string): Promise<VerifiedGap[]> {
    return [...(this.store.requireIndexes().gapsByPatient.get(patientId) ?? [])];
  }

  async listAll(): Promise<VerifiedGap[]> {
    return [...this.store.requireIndexes().gapById.values()];
  }
}

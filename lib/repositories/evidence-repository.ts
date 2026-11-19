import type { EvidenceBundle } from "@/lib/domain";
import type { DemoCacheStore } from "./demo-cache-store";
import type { EvidenceRepository } from "./types";

export class JsonEvidenceRepository implements EvidenceRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async getByGapId(gapId: string): Promise<EvidenceBundle | null> {
    return this.store.requireIndexes().evidenceByGap.get(gapId) ?? null;
  }

  async getDeepDive(gapId: string): Promise<Record<string, unknown> | null> {
    return this.store.requireIndexes().deepDiveByGap.get(gapId) ?? null;
  }
}

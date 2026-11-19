import type { DemoImpactArtifact } from "@/lib/cache/validate";
import type { DemoCacheStore } from "./demo-cache-store";
import type { ImpactRepository } from "./types";

export class JsonImpactRepository implements ImpactRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async get(): Promise<DemoImpactArtifact> {
    return this.store.requireCache().impact;
  }
}

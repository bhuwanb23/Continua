import type { DemoPanelArtifact } from "@/lib/cache/validate";
import type { DemoCacheStore } from "./demo-cache-store";
import type { PanelRepository } from "./types";

export class JsonPanelRepository implements PanelRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async getPanel(): Promise<DemoPanelArtifact> {
    return this.store.requireCache().panel;
  }
}

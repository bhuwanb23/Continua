import { sortClinicalEvents } from "@/lib/clinical-events";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import type { DemoCacheStore } from "./demo-cache-store";
import type { TimelineRepository } from "./types";

export class JsonTimelineRepository implements TimelineRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async listByPatient(patientId: string): Promise<CanonicalClinicalEvent[]> {
    return sortClinicalEvents(this.store.requireIndexes().timelineByPatient.get(patientId) ?? []);
  }
}

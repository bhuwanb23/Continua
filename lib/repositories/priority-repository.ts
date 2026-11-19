import type { DemoQueueArtifact } from "@/lib/cache/validate";
import type { GapInterventionPriority, PatientInterventionPriority } from "@/lib/priority/types";
import type { DemoCacheStore } from "./demo-cache-store";
import type { PriorityRepository } from "./types";

export class JsonPriorityRepository implements PriorityRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async getPatientPriority(patientId: string): Promise<PatientInterventionPriority | null> {
    return this.store.requireIndexes().priorityByPatient.get(patientId) ?? null;
  }

  async listPatientPriorities(): Promise<PatientInterventionPriority[]> {
    return [...this.store.requireIndexes().priorityByPatient.values()];
  }

  async getGapPriority(gapId: string): Promise<GapInterventionPriority | null> {
    return this.store.requireIndexes().priorityByGap.get(gapId) ?? null;
  }

  /** Returns the stored frozen queue; `k` can only shorten it, never re-rank it. */
  async getQueue(k?: number): Promise<DemoQueueArtifact> {
    const queue = this.store.requireCache().queue;
    if (k === undefined) return queue;
    if (!Number.isInteger(k) || k < 1) throw new Error(`Queue size k must be a positive integer; received ${k}.`);
    return { ...queue, k: Math.min(k, queue.k), items: queue.items.slice(0, Math.min(k, queue.k)) };
  }
}

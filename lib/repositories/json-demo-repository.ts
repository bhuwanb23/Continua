import type { CacheManifest } from "@/lib/cache/manifest";
import { cacheDirFor } from "@/lib/cache/validate";
import { DemoCacheStore, type DemoCacheReadiness, type DemoCacheStartupReport } from "./demo-cache-store";
import { JsonPanelRepository } from "./panel-repository";
import { JsonPatientRepository } from "./patient-repository";
import { JsonRecordRepository } from "./record-repository";
import { JsonTimelineRepository } from "./timeline-repository";
import { JsonVerifiedGapRepository } from "./verified-gap-repository";
import { JsonEvidenceRepository } from "./evidence-repository";
import { JsonPriorityRepository } from "./priority-repository";
import { JsonBenchmarkEvaluationRepository } from "./evaluation-repository";
import { JsonImpactRepository } from "./impact-repository";
import type { MariaRepository } from "./types";

class JsonMariaRepository implements MariaRepository {
  constructor(private readonly store: DemoCacheStore) {}

  async get() {
    return this.store.requireCache().maria;
  }
}

export interface JsonDemoRepositoryOptions {
  cacheDir?: string;
  verifyHashes?: boolean;
  frozenReport?: Record<string, unknown>;
  benchmarkGaps?: Array<{ patient_id: string; gap_type: string; title: string }>;
}

/**
 * P0 read path: validates `continua-demo-cache-v1` once, then serves typed reads
 * from memory. No LLM, detector, evidence recomputation, database, or network.
 */
export class JsonDemoRepository {
  readonly store: DemoCacheStore;
  readonly panels: JsonPanelRepository;
  readonly patients: JsonPatientRepository;
  readonly records: JsonRecordRepository;
  readonly timelines: JsonTimelineRepository;
  readonly verifiedGaps: JsonVerifiedGapRepository;
  readonly evidence: JsonEvidenceRepository;
  readonly priorities: JsonPriorityRepository;
  readonly evaluation: JsonBenchmarkEvaluationRepository;
  readonly impact: JsonImpactRepository;
  readonly maria: JsonMariaRepository;

  constructor(options: JsonDemoRepositoryOptions = {}) {
    this.store = new DemoCacheStore({
      dir: options.cacheDir ?? cacheDirFor(),
      ...(options.verifyHashes === undefined ? {} : { verifyHashes: options.verifyHashes }),
      ...(options.frozenReport === undefined ? {} : { frozenReport: options.frozenReport }),
      ...(options.benchmarkGaps === undefined ? {} : { benchmarkGaps: options.benchmarkGaps }),
    });
    this.panels = new JsonPanelRepository(this.store);
    this.patients = new JsonPatientRepository(this.store);
    this.records = new JsonRecordRepository(this.store);
    this.timelines = new JsonTimelineRepository(this.store);
    this.verifiedGaps = new JsonVerifiedGapRepository(this.store);
    this.evidence = new JsonEvidenceRepository(this.store);
    this.priorities = new JsonPriorityRepository(this.store);
    this.evaluation = new JsonBenchmarkEvaluationRepository(this.store);
    this.impact = new JsonImpactRepository(this.store);
    this.maria = new JsonMariaRepository(this.store);
  }

  initialize(): DemoCacheStartupReport {
    return this.store.initialize();
  }

  getState(): DemoCacheReadiness {
    return this.store.getState();
  }

  getStartupReport(): DemoCacheStartupReport | null {
    return this.store.getStartupReport();
  }

  getManifest(): CacheManifest {
    return this.store.requireCache().manifest;
  }
}

let sharedRepository: JsonDemoRepository | null = null;

/** Process-wide initialized repository for server read paths. */
export function getJsonDemoRepository(): JsonDemoRepository {
  if (!sharedRepository) {
    sharedRepository = new JsonDemoRepository();
    sharedRepository.initialize();
  }
  return sharedRepository;
}

export function resetJsonDemoRepository(): void {
  sharedRepository = null;
}

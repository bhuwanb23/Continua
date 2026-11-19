import { performance } from "node:perf_hooks";
import type { Patient } from "@/lib/domain";
import { buildDemoCacheIndexes, type DemoCacheIndexes } from "@/lib/cache/indexes";
import { verifyCacheSyntheticBoundary, loadDatasetProvenance } from "@/lib/safety/synthetic-only";
import { auditGapCopy } from "@/lib/safety/output-guard";
import { loadBenchmarkReport, loadBenchmarkVerifiedGaps } from "@/lib/cache/benchmark-report";
import {
  cacheDirFor,
  loadDemoCache,
  validateLoadedCache,
  type CacheValidationReport,
  type DemoPatientSummary,
  type LoadedDemoCache,
} from "@/lib/cache/validate";

export type DemoCacheReadiness = "UNINITIALIZED" | "VALIDATING" | "READY" | "INVALID";

export type DemoCacheErrorCode = "DEMO_CACHE_INVALID" | "DEMO_CACHE_UNINITIALIZED";

export class DemoCacheUnavailableError extends Error {
  readonly code: DemoCacheErrorCode;

  constructor(code: DemoCacheErrorCode, message: string) {
    super(message);
    this.name = "DemoCacheUnavailableError";
    this.code = code;
  }
}

export interface DemoCacheStartupReport {
  state: DemoCacheReadiness;
  cache_version: string | null;
  patient_count: number;
  artifact_count: number;
  validation_duration_ms: number;
  index_build_duration_ms: number;
  hash_validation: boolean;
  status: CacheValidationReport["status"] | "FAIL";
  failure: string | null;
}

export function toDomainPatient(summary: DemoPatientSummary): Patient {
  return {
    patient_id: summary.patient_id,
    fixture_key: summary.fixture_key,
    name: summary.display_name,
    age: summary.age,
    sex: summary.sex,
    primary_diagnosis: summary.primary_condition,
    last_contact_date: summary.last_contact_date,
  };
}

export interface DemoCacheStoreOptions {
  dir?: string;
  verifyHashes?: boolean;
  frozenReport?: Record<string, unknown>;
  benchmarkGaps?: Array<{ patient_id: string; gap_type: string; title: string }>;
}

/**
 * One validated, immutable in-memory view of `continua-demo-cache-v1`.
 *
 * Startup validates once (manifest, hashes, references, queue, benchmark,
 * impact classes, leakage) and then serves every read from maps.
 */
export class DemoCacheStore {
  private readonly options: DemoCacheStoreOptions;
  private cache: LoadedDemoCache | null = null;
  private indexes: DemoCacheIndexes | null = null;
  private state: DemoCacheReadiness = "UNINITIALIZED";
  private failure: string | null = null;
  private report: DemoCacheStartupReport | null = null;

  constructor(options: DemoCacheStoreOptions = {}) {
    this.options = options;
  }

  getState(): DemoCacheReadiness {
    return this.state;
  }

  getStartupReport(): DemoCacheStartupReport | null {
    return this.report;
  }

  getFailure(): string | null {
    return this.failure;
  }

  initialize(): DemoCacheStartupReport {
    if (this.state === "READY" && this.report) return this.report;
    this.state = "VALIDATING";
    const startedAt = performance.now();
    try {
      const cache = loadDemoCache(this.options.dir ?? cacheDirFor());
      const frozenReport = this.options.frozenReport ?? loadBenchmarkReport();
      const benchmarkGaps = this.options.benchmarkGaps ?? loadBenchmarkVerifiedGaps();
      const validation = validateLoadedCache(cache, frozenReport, benchmarkGaps);
      const failures = validation.flatMap((check) => check.failures.map((failure) => `${check.name}: ${failure}`));
      const boundary = verifyCacheSyntheticBoundary({
        panelSynthetic: cache.panel.synthetic,
        manifestDatasetVersion: cache.manifest.dataset_version,
        records: cache.records,
        datasetProvenance: loadDatasetProvenance(),
      });
      if (!boundary.ok) failures.push(...boundary.failures.map((failure) => `synthetic boundary: ${failure}`));
      const copyAudit = auditGapCopy(cache.verifiedGaps);
      if (!copyAudit.passed) {
        failures.push(...copyAudit.issues.map((issue) => `output language: ${issue.gap_id} ${issue.field} ${issue.code}`));
      }
      const validationDuration = performance.now() - startedAt;
      if (failures.length > 0) {
        this.state = "INVALID";
        this.failure = failures.slice(0, 10).join("; ");
        this.report = {
          state: this.state,
          cache_version: cache.manifest.cache_version,
          patient_count: cache.patients.length,
          artifact_count: Object.keys(cache.manifest.artifacts).length,
          validation_duration_ms: round(validationDuration),
          index_build_duration_ms: 0,
          hash_validation: this.options.verifyHashes !== false,
          status: "FAIL",
          failure: this.failure,
        };
        return this.report;
      }

      const indexStart = performance.now();
      this.cache = cache;
      this.indexes = buildDemoCacheIndexes({
        patients: cache.patients.map(toDomainPatient),
        records: cache.records,
        timelines: cache.timelines.map((timeline) => ({ patient_id: timeline.patient_id, events: timeline.events })),
        verifiedGaps: cache.verifiedGaps,
        gapPriorities: cache.priorities.gap_priorities,
        patientPriorities: cache.priorities.patient_priorities,
        deepDives: cache.evidence.deep_dives,
      });
      const indexDuration = performance.now() - indexStart;
      this.state = "READY";
      this.failure = null;
      this.report = {
        state: this.state,
        cache_version: cache.manifest.cache_version,
        patient_count: cache.patients.length,
        artifact_count: Object.keys(cache.manifest.artifacts).length,
        validation_duration_ms: round(validationDuration),
        index_build_duration_ms: round(indexDuration),
        hash_validation: this.options.verifyHashes !== false,
        status: "PASS",
        failure: null,
      };
      return this.report;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.cache = null;
      this.indexes = null;
      this.state = "INVALID";
      this.failure = message;
      this.report = {
        state: this.state,
        cache_version: null,
        patient_count: 0,
        artifact_count: 0,
        validation_duration_ms: round(performance.now() - startedAt),
        index_build_duration_ms: 0,
        hash_validation: this.options.verifyHashes !== false,
        status: "FAIL",
        failure: message,
      };
      return this.report;
    }
  }

  /** Throws instead of serving partial or unvalidated data. */
  requireCache(): LoadedDemoCache {
    if (this.state === "UNINITIALIZED") {
      throw new DemoCacheUnavailableError("DEMO_CACHE_UNINITIALIZED", "Demo cache has not been initialized.");
    }
    if (this.state !== "READY" || !this.cache) {
      throw new DemoCacheUnavailableError(
        "DEMO_CACHE_INVALID",
        `Demo cache failed validation: ${this.failure ?? "unknown cause"}`,
      );
    }
    return this.cache;
  }

  requireIndexes(): DemoCacheIndexes {
    this.requireCache();
    if (!this.indexes) {
      throw new DemoCacheUnavailableError("DEMO_CACHE_INVALID", "Demo cache indexes are unavailable.");
    }
    return this.indexes;
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

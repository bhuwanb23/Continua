import { createHash } from "node:crypto";
import type {
  ClinicalEventRejection,
  ClinicalEventStore,
  ExtractionResult,
  SourceRecord,
} from "@/lib/domain";
import { CLINICAL_EVENT_SCHEMA_VERSION, EVALUATION_AS_OF_DATE } from "@/lib/domain/versions";
import { NORMALIZATION_VERSION } from "@/lib/normalization";
import { canonicalizeClinicalEvents } from "@/lib/clinical-events";
import { rejectClinicalEvent } from "@/lib/clinical-events/rejection";
import { verifyProvenance } from "@/lib/provenance";
import { RECONCILIATION_VERSION, reconcileClinicalEvents, type ReconciliationLedger } from "@/lib/reconciliation";
import { CACHE_VERSION, type CacheMetadata } from "@/lib/cache/contract";
import { deterministicId } from "@/lib/ids";
import type { Logger } from "@/lib/logging/logger";
import type { CandidateClinicalEvent } from "@/lib/schemas/candidate-event.schema";
import { adaptCandidateEvent } from "./candidate-adapter";
import { CANDIDATE_SCHEMA_VERSION } from "./candidate-event";
import { candidateCacheKey, canonicalCacheKey, type ExtractionCacheRepository } from "./cache";
import type { ClinicalEventExtractor } from "./clinical-event-extractor";
import type {
  ClinicalEventDocumentExtractor,
  DocumentExtractionResult,
  ExtractionRequestMetadata,
} from "./extractor";
import { prepareExtractionEnvelope } from "./preprocess";
import { PROMPT_VERSION } from "./prompt-version";
import { withRetry, type RetryOptions } from "./retry";
import { patientExtractionStatus, type PatientExtractionStatus } from "./status";

export interface PatientExtractionOptions {
  concurrency?: number;
  retry?: RetryOptions;
  candidateCache?: ExtractionCacheRepository;
  canonicalCache?: ExtractionCacheRepository;
  logger?: Logger;
  evaluationAsOfDate?: string;
  datasetVersion?: string;
}

export interface DocumentExtractionOutcome {
  document_id: string;
  status: "ok" | "failed";
  metadata: ExtractionRequestMetadata;
  candidates: CandidateClinicalEvent[];
  error?: string;
}

export interface PatientExtractionResult {
  patient_id: string;
  status: PatientExtractionStatus;
  store: ClinicalEventStore;
  ledger: ReconciliationLedger;
  documents: DocumentExtractionOutcome[];
}

interface CanonicalCacheData {
  store: ClinicalEventStore;
  ledger: ReconciliationLedger;
  documents: DocumentExtractionOutcome[];
}

function cacheMetadata(options: PatientExtractionOptions, extractorVersion: string, modelId: string): CacheMetadata {
  return {
    cache_version: CACHE_VERSION,
    dataset_version: options.datasetVersion ?? "continua-synth-v1",
    detector_version: "extraction-only",
    priority_version: "extraction-only",
    generated_at: options.evaluationAsOfDate ?? EVALUATION_AS_OF_DATE,
    extractor_version: extractorVersion,
    prompt_version: PROMPT_VERSION,
    schema_version: CANDIDATE_SCHEMA_VERSION,
    model_id: modelId,
    normalization_version: NORMALIZATION_VERSION,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    for (;;) {
      const index = next;
      next += 1;
      const item = items[index];
      if (item === undefined) return;
      results[index] = await fn(item);
    }
  });
  await Promise.all(workers);
  return results;
}

async function extractDocumentOutcome(
  extractor: ClinicalEventDocumentExtractor,
  record: SourceRecord,
  options: PatientExtractionOptions,
): Promise<DocumentExtractionOutcome> {
  const envelope = prepareExtractionEnvelope(record);
  const key = candidateCacheKey({
    content_hash: envelope.content_hash,
    model_id: extractor.modelId,
    prompt_version: PROMPT_VERSION,
    candidate_schema_version: CANDIDATE_SCHEMA_VERSION,
  });

  const cached = options.candidateCache
    ? await options.candidateCache.get<DocumentExtractionResult>(key)
    : null;
  if (cached) {
    const metadata: ExtractionRequestMetadata = {
      ...cached.data.metadata,
      live_or_cached: "cached",
      latency_ms: 0,
    };
    options.logger?.info("EXTRACTION_REQUEST", { ...metadata });
    return { document_id: envelope.document_id, status: "ok", metadata, candidates: cached.data.candidates };
  }

  let attempts = 0;
  try {
    const result = await withRetry(
      async (attempt) => {
        attempts = attempt;
        return extractor.extractDocument({ envelope });
      },
      {
        ...options.retry,
        onRetry: (info) => {
          options.logger?.warn("EXTRACTION_RETRY", {
            patient_id: envelope.patient_id,
            document_id: envelope.document_id,
            attempt: info.attempt,
            delay_ms: info.delayMs,
          });
          options.retry?.onRetry?.(info);
        },
      },
    );
    const metadata: ExtractionRequestMetadata = { ...result.metadata, attempt_count: attempts };
    options.logger?.info("EXTRACTION_REQUEST", { ...metadata });
    await options.candidateCache?.set(key, {
      metadata: cacheMetadata(options, extractor.version, extractor.modelId),
      data: result,
    });
    return { document_id: envelope.document_id, status: "ok", metadata, candidates: result.candidates };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const metadata: ExtractionRequestMetadata = {
      request_id: deterministicId("failed-extraction", envelope.content_hash, extractor.modelId, PROMPT_VERSION),
      patient_id: envelope.patient_id,
      document_id: envelope.document_id,
      provider: "unknown",
      model: extractor.modelId,
      prompt_version: PROMPT_VERSION,
      candidate_schema_version: CANDIDATE_SCHEMA_VERSION,
      latency_ms: 0,
      attempt_count: attempts,
      status: "failed",
      candidate_event_count: 0,
      live_or_cached: "live",
      error: message,
    };
    options.logger?.error("EXTRACTION_REQUEST_FAILED", { ...metadata });
    // A failed document never produces fallback events.
    return { document_id: envelope.document_id, status: "failed", metadata, candidates: [], error: message };
  }
}

function emptyStore(extractorVersion: string): ClinicalEventStore {
  return {
    accepted: [],
    rejected: [],
    metadata: {
      clinical_event_schema: CLINICAL_EVENT_SCHEMA_VERSION,
      normalization_version: NORMALIZATION_VERSION,
      extractor_version: extractorVersion,
    },
  };
}

export async function extractPatient(
  extractor: ClinicalEventDocumentExtractor,
  records: SourceRecord[],
  options: PatientExtractionOptions = {},
): Promise<PatientExtractionResult> {
  const patientId = records[0]?.patient_id;
  if (!patientId) {
    return {
      patient_id: "",
      status: "FAILED",
      store: emptyStore(extractor.version),
      ledger: {
        reconciliation_version: RECONCILIATION_VERSION,
        merged_duplicates: [],
        attached_provenance: [],
        retained_historical: [],
      },
      documents: [],
    };
  }

  const sortedRecords = [...records].sort((left, right) => left.source_doc_id.localeCompare(right.source_doc_id));
  const combinedHash = createHash("sha256")
    .update(
      sortedRecords
        .map((record) => prepareExtractionEnvelope(record).content_hash)
        .join("|"),
    )
    .digest("hex");
  const canonicalKey = canonicalCacheKey({
    content_hash: combinedHash,
    model_id: extractor.modelId,
    prompt_version: PROMPT_VERSION,
    candidate_schema_version: CANDIDATE_SCHEMA_VERSION,
    normalization_version: NORMALIZATION_VERSION,
    clinical_event_schema: CLINICAL_EVENT_SCHEMA_VERSION,
    reconciliation_version: RECONCILIATION_VERSION,
  });

  const cachedCanonical = options.canonicalCache
    ? await options.canonicalCache.get<CanonicalCacheData>(canonicalKey)
    : null;
  if (cachedCanonical) {
    const documents = cachedCanonical.data.documents.map((outcome) => ({
      ...outcome,
      metadata: { ...outcome.metadata, live_or_cached: "cached" as const, latency_ms: 0 },
    }));
    return {
      patient_id: patientId,
      status: patientExtractionStatus(documents.map((outcome) => outcome.status)),
      store: cachedCanonical.data.store,
      ledger: cachedCanonical.data.ledger,
      documents,
    };
  }

  const documents = await mapWithConcurrency(sortedRecords, options.concurrency ?? 4, (record) =>
    extractDocumentOutcome(extractor, record, options),
  );

  const provenanceRejections: ClinicalEventRejection[] = [];
  const adapted: Array<Record<string, unknown>> = [];
  for (const outcome of documents) {
    const record = sortedRecords.find((item) => item.source_doc_id === outcome.document_id);
    if (!record) continue;
    for (const candidate of outcome.candidates) {
      const provenance = verifyProvenance(
        {
          source_doc_id: candidate.source_doc_id,
          patient_id: patientId,
          source_span: candidate.source_span,
        },
        { patient_id: patientId, records: sortedRecords },
      );
      if (!provenance.ok) {
        provenanceRejections.push(rejectClinicalEvent(provenance.code, provenance.reason, candidate));
        continue;
      }
      adapted.push(adaptCandidateEvent(candidate, { patient_id: patientId, record, source: provenance.source }));
    }
  }

  const canonical = canonicalizeClinicalEvents(adapted, {
    patient_id: patientId,
    records: sortedRecords,
    evaluation_as_of_date: options.evaluationAsOfDate ?? EVALUATION_AS_OF_DATE,
    extractor_version: extractor.version,
  });
  const reconciled = reconcileClinicalEvents(canonical.accepted, sortedRecords);
  const rejected = [...provenanceRejections, ...canonical.rejected];
  const store: ClinicalEventStore = {
    accepted: reconciled.events,
    rejected,
    metadata: {
      clinical_event_schema: CLINICAL_EVENT_SCHEMA_VERSION,
      normalization_version: NORMALIZATION_VERSION,
      extractor_version: extractor.version,
    },
  };

  for (const outcome of documents) {
    outcome.metadata.accepted_event_count = reconciled.events.filter(
      (event) => event.source.source_doc_id === outcome.document_id,
    ).length;
    outcome.metadata.rejected_event_count = rejected.filter((rejection) => {
      const candidate = rejection.candidate_event as { source_doc_id?: unknown } | null;
      return candidate?.source_doc_id === outcome.document_id;
    }).length;
  }

  const status = patientExtractionStatus(documents.map((outcome) => outcome.status));
  options.logger?.info("PATIENT_EXTRACTION_STATUS", {
    patient_id: patientId,
    status,
    document_count: documents.length,
    accepted_event_count: store.accepted.length,
    rejected_event_count: store.rejected.length,
  });

  await options.canonicalCache?.set(canonicalKey, {
    metadata: cacheMetadata(options, extractor.version, extractor.modelId),
    data: { store, ledger: reconciled.ledger, documents },
  });

  return { patient_id: patientId, status, store, ledger: reconciled.ledger, documents };
}

export async function extractPanel(
  extractor: ClinicalEventDocumentExtractor,
  panel: Array<{ patient_id: string; records: SourceRecord[] }>,
  options: PatientExtractionOptions & { patientConcurrency?: number } = {},
): Promise<PatientExtractionResult[]> {
  return mapWithConcurrency(panel, options.patientConcurrency ?? 2, (entry) =>
    extractPatient(extractor, entry.records, options),
  );
}

/** Bridge into the unchanged Phase 1 patient-level extractor boundary. */
export function asPatientExtractor(
  extractor: ClinicalEventDocumentExtractor,
  options: PatientExtractionOptions = {},
): ClinicalEventExtractor {
  return {
    version: extractor.version,
    async extract({ records }): Promise<ExtractionResult> {
      const result = await extractPatient(extractor, records, options);
      const events = result.store.accepted;
      return {
        events,
        extraction_confidence:
          events.length === 0
            ? 0
            : events.reduce((sum, event) => sum + event.extraction_confidence, 0) / events.length,
        extractor_version: extractor.version,
      };
    },
  };
}
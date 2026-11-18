import { deterministicId } from "@/lib/ids";
import type { CandidateClinicalEvent } from "@/lib/schemas/candidate-event.schema";
import { CANDIDATE_SCHEMA_VERSION } from "./candidate-event";
import type {
  ClinicalEventDocumentExtractor,
  DocumentExtractionResult,
} from "./extractor";
import type { ExtractionEnvelope } from "./preprocess";

/**
 * Deterministic document-level extractor for tests, CI, and offline demos.
 * Fixtures are keyed by source_doc_id; unknown documents yield zero events.
 */
export class FixtureDocumentExtractor implements ClinicalEventDocumentExtractor {
  readonly version: string;
  readonly modelId = "fixture";

  constructor(
    private readonly fixtures: Record<string, CandidateClinicalEvent[]>,
    options: { version?: string } = {},
  ) {
    this.version = options.version ?? "fixture-extractor-v1";
  }

  async extractDocument({ envelope }: { envelope: ExtractionEnvelope }): Promise<DocumentExtractionResult> {
    const candidates = this.fixtures[envelope.document_id] ?? [];
    return {
      candidates,
      metadata: {
        request_id: deterministicId("fixture-extraction", envelope.document_id, this.version),
        patient_id: envelope.patient_id,
        document_id: envelope.document_id,
        provider: "fixture",
        model: this.modelId,
        prompt_version: "fixture",
        candidate_schema_version: CANDIDATE_SCHEMA_VERSION,
        latency_ms: 0,
        attempt_count: 1,
        status: "ok",
        candidate_event_count: candidates.length,
        live_or_cached: "fixture",
      },
    };
  }
}
import type { ExtractionResult, SourceRecord } from "@/lib/domain";
import { canonicalizeClinicalEvents } from "@/lib/clinical-events";

export interface ExtractionInput {
  records: SourceRecord[];
}

/**
 * The boundary every extractor implements. Phase 1 ships no LLM implementation.
 */
export interface ClinicalEventExtractor {
  readonly version: string;
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}

/**
 * Returns a pre-built result. Keeps detector tests independent of any model.
 */
export class FixtureClinicalEventExtractor implements ClinicalEventExtractor {
  readonly version: string;

  constructor(private readonly result: ExtractionResult) {
    this.version = result.extractor_version;
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const patientId = input.records[0]?.patient_id;
    if (!patientId) return { ...this.result, events: [] };
    const canonical = canonicalizeClinicalEvents(this.result.events, {
      patient_id: patientId,
      records: input.records,
      extractor_version: this.version,
    });
    return {
      ...this.result,
      events: canonical.accepted,
      extraction_confidence:
        canonical.accepted.length === 0
          ? this.result.extraction_confidence
          : canonical.accepted.reduce((sum, event) => sum + event.extraction_confidence, 0) / canonical.accepted.length,
    };
  }
}

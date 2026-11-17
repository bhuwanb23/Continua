import type { ExtractionResult, SourceRecord } from "@/lib/domain";

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

  async extract(): Promise<ExtractionResult> {
    return this.result;
  }
}

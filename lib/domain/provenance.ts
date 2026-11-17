export interface SourceVersions {
  dataset_version: string;
  generator_version: string;
  extractor_version?: string | undefined;
  detector_version?: string | undefined;
  priority_version?: string | undefined;
}

/** Attached to every synthetic source document. */
export interface SourceProvenance {
  dataset_version: string;
  generator_version: string;
  synthetic: true;
  fixture_key: string;
}

/** Attached to every derived artifact. */
export interface DerivedProvenance {
  source_versions: SourceVersions;
  generated_by: string;
  generated_at: string;
  synthetic: true;
}

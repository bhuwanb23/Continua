import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DATASET_VERSION,
  EVALUATION_AS_OF_DATE,
  EVAL_VERSION,
  EXTRACTOR_VERSION,
  NORMALIZATION_VERSION,
} from "@/lib/domain/versions";
import { loadEnv } from "@/lib/config/env";
import { DETECTOR_VERSION, type VersionMetadata } from "@/lib/domain";
import { EVIDENCE_VERSION } from "@/lib/evidence/version";
import { PRIORITY_VERSION } from "@/lib/priority";
import { PROMPT_VERSION } from "@/lib/extraction/prompt-version";
import type { BenchmarkConfig, BenchmarkMetadata, BenchmarkStatus, GitState } from "./types";
import { BENCHMARK_VERSION } from "./config";

export function extractionMetadataFor(path: string): Record<string, unknown> | null {
  const metadataPath = join(path, "..", "metadata.json");
  if (!existsSync(metadataPath)) return null;
  try {
    return JSON.parse(readFileSync(metadataPath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function providerState(): { configured: boolean; model: string | null } {
  try {
    const env = loadEnv(process.env);
    return {
      configured: Boolean(env.llmProvider && (env.llmApiKey || env.llmProvider === "ollama")),
      model: env.llmModel ?? null,
    };
  } catch {
    return { configured: false, model: null };
  }
}

export function buildMetadata(input: {
  config: BenchmarkConfig;
  status: BenchmarkStatus;
  git: GitState;
  timestamp: string;
  hashes: Record<string, string>;
  inputHashes: Record<string, string>;
  patientCount: number;
  notes?: string[];
}): BenchmarkMetadata {
  const extractionMeta = extractionMetadataFor(input.config.extracted_events_path);
  const provider = providerState();
  const fixtureVersion =
    typeof extractionMeta?.["extractor_version"] === "string" ? extractionMeta["extractor_version"] : null;
  const schema =
    typeof extractionMeta?.["clinical_event_schema"] === "string"
      ? extractionMeta["clinical_event_schema"]
      : "clinical-event-v1.1";
  const versions: VersionMetadata = {
    spec_version: "1.0",
    dataset_version: DATASET_VERSION,
    eval_version: EVAL_VERSION,
    extractor_version: EXTRACTOR_VERSION,
    detector_version: DETECTOR_VERSION,
    priority_version: PRIORITY_VERSION,
    api_version: "v1",
    clinical_event_schema: schema,
    normalization_version: NORMALIZATION_VERSION,
  };

  return {
    run_id: input.config.run_id,
    timestamp: input.timestamp,
    mode: input.config.mode,
    benchmark_version: BENCHMARK_VERSION,
    status: input.status,
    git: input.git,
    dataset_version: versions.dataset_version,
    eval_version: versions.eval_version,
    extractor_version: versions.extractor_version,
    fixture_extractor_version: fixtureVersion,
    prompt_version: PROMPT_VERSION,
    normalization_version: versions.normalization_version,
    detector_version: versions.detector_version,
    gap_policy_version: "gap-policy-v1",
    evidence_version: EVIDENCE_VERSION,
    priority_version: versions.priority_version,
    clinical_event_schema: versions.clinical_event_schema,
    evaluation_as_of_date: EVALUATION_AS_OF_DATE,
    partition: input.config.partition,
    partition_patients: input.patientCount,
    provider_configured: provider.configured,
    provider_model: provider.model,
    extraction_source: input.config.extraction_source,
    extraction_is_live: input.config.extraction_source === "live",
    benchmark_hashes: input.hashes,
    input_hashes: input.inputHashes,
    notes: [
      "Synthetic records only; this is not clinical validation.",
      ...(input.config.extraction_source === "fixture_replay"
        ? ["Extraction is a deterministic fixture replay. Its extraction metrics do not measure live model quality."]
        : []),
      ...(provider.configured ? [] : ["No live provider was configured; LLM-only baseline is NOT_RUN."]),
      ...(input.notes ?? []),
    ],
  };
}

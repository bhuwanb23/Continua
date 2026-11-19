import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const SYNTHETIC_DATASET_VERSION = "continua-synth-v1";

export const SYNTHETIC_GENERATOR_VERSION = "generator-v1";

export interface DatasetProvenance {
  dataset_version: string;
  synthetic: boolean;
  generator_version: string;
  seed: number;
  content_hash: string;
  record_count?: number;
  patient_count?: number;
}

export interface ProvenanceCheck {
  ok: boolean;
  failures: string[];
}

export function verifyDatasetProvenance(input: unknown): ProvenanceCheck {
  const failures: string[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, failures: ["provenance is not an object"] };
  }
  const value = input as Partial<DatasetProvenance>;
  if (value.dataset_version !== SYNTHETIC_DATASET_VERSION) {
    failures.push(`dataset_version ${String(value.dataset_version)} is not ${SYNTHETIC_DATASET_VERSION}`);
  }
  if (value.synthetic !== true) {
    failures.push("synthetic flag is not true");
  }
  if (value.generator_version !== SYNTHETIC_GENERATOR_VERSION) {
    failures.push(`generator_version ${String(value.generator_version)} is not ${SYNTHETIC_GENERATOR_VERSION}`);
  }
  if (typeof value.seed !== "number") {
    failures.push("seed is missing or not a number");
  }
  if (typeof value.content_hash !== "string" || value.content_hash.length < 16) {
    failures.push("content_hash is missing or too short");
  }
  return { ok: failures.length === 0, failures };
}

export function loadDatasetProvenance(root = process.cwd()): DatasetProvenance {
  const path = join(root, "data", "synthetic", SYNTHETIC_DATASET_VERSION, "manifest.json");
  if (!existsSync(path)) {
    throw new Error(`Missing synthetic dataset manifest: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as DatasetProvenance;
}

export interface CacheSyntheticBoundaryInput {
  panelSynthetic: unknown;
  manifestDatasetVersion: string;
  records: Array<{ synthetic?: unknown; dataset_version?: unknown; source_doc_id?: string }>;
  datasetProvenance: DatasetProvenance;
}

export function verifyCacheSyntheticBoundary(input: CacheSyntheticBoundaryInput): ProvenanceCheck {
  const failures: string[] = [];

  if (input.panelSynthetic !== true) {
    failures.push("panel.json synthetic flag is not true");
  }

  if (input.manifestDatasetVersion !== SYNTHETIC_DATASET_VERSION) {
    failures.push(`cache manifest dataset_version ${input.manifestDatasetVersion} is not ${SYNTHETIC_DATASET_VERSION}`);
  }

  const datasetCheck = verifyDatasetProvenance(input.datasetProvenance);
  failures.push(...datasetCheck.failures.map((failure) => `dataset provenance: ${failure}`));

  for (const record of input.records) {
    if (record.synthetic !== true) {
      failures.push(`record ${String(record.source_doc_id ?? "<unknown>")} has synthetic !== true`);
    }
    if (record.dataset_version !== SYNTHETIC_DATASET_VERSION) {
      failures.push(`record ${String(record.source_doc_id ?? "<unknown>")} has dataset_version ${String(record.dataset_version)}`);
    }
  }

  return { ok: failures.length === 0, failures };
}

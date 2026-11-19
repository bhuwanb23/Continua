import { sha256Json } from "./hashes";

export interface CacheArtifactEntry {
  sha256: string;
  bytes: number;
}

export interface CacheManifest {
  cache_version: string;
  dataset_version: string;
  eval_version: string;
  clinical_event_schema: string;
  extractor_version: string;
  normalization_version: string;
  detector_version: string;
  gap_policy_version: string;
  evidence_version: string;
  priority_version: string;
  benchmark_version: string;
  evaluation_as_of_date: string;
  patient_count: number;
  generated_at: string;
  git_commit: string;
  artifacts: Record<string, CacheArtifactEntry>;
  manifest_sha256: string;
}

export function createManifestSha256(manifest: Omit<CacheManifest, "manifest_sha256">): string {
  return sha256Json(manifest);
}

export function finalizeManifest(manifest: Omit<CacheManifest, "manifest_sha256">): CacheManifest {
  return { ...manifest, manifest_sha256: createManifestSha256(manifest) };
}

export function verifyManifestSha256(manifest: CacheManifest): boolean {
  const { manifest_sha256, ...rest } = manifest;
  return sha256Json(rest) === manifest_sha256;
}

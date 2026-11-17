import { DataIntegrityError } from "@/lib/errors";

export const CACHE_VERSION = 1 as const;

export interface CacheMetadata {
  cache_version: number;
  dataset_version: string;
  detector_version: string;
  priority_version: string;
  generated_at: string;
}

export interface CachedArtifact<T> {
  metadata: CacheMetadata;
  data: T;
}

export interface ExpectedCacheVersions {
  dataset_version: string;
  detector_version: string;
  priority_version: string;
}

/**
 * Stale cache must be detectable: never serve output from an older
 * detector against a newer dataset.
 */
export function assertCacheCompatible(
  metadata: CacheMetadata,
  expected: ExpectedCacheVersions,
): void {
  if (metadata.cache_version !== CACHE_VERSION) {
    throw new DataIntegrityError(
      `Cache version ${metadata.cache_version} is not compatible with ${CACHE_VERSION}.`,
    );
  }
  const mismatches: string[] = [];
  if (metadata.dataset_version !== expected.dataset_version) mismatches.push("dataset_version");
  if (metadata.detector_version !== expected.detector_version) mismatches.push("detector_version");
  if (metadata.priority_version !== expected.priority_version) mismatches.push("priority_version");
  if (mismatches.length > 0) {
    throw new DataIntegrityError(
      `Stale demo cache: ${mismatches.join(", ")} do not match the current pipeline versions.`,
    );
  }
}

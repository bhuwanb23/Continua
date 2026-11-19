import { CacheVersionMismatchError } from "./errors";
import { DEMO_CACHE_VERSION } from "./version";
import type { CacheManifest } from "./manifest";

export function assertCacheVersionCompatible(manifest: CacheManifest): void {
  if (manifest.cache_version !== DEMO_CACHE_VERSION) {
    throw new CacheVersionMismatchError(
      `Cache version ${manifest.cache_version} is not compatible with ${DEMO_CACHE_VERSION}.`,
    );
  }
  const expected = {
    dataset_version: "continua-synth-v1",
    eval_version: "continua-eval-v1",
    clinical_event_schema: "clinical-event-v1.1",
    extractor_version: "extractor-v1",
    normalization_version: "normalization-v1",
    detector_version: "gaps-v1",
    gap_policy_version: "gap-policy-v1",
    evidence_version: "evidence-v1",
    priority_version: "priority-v1",
    benchmark_version: "continua-benchmark-v1",
    evaluation_as_of_date: "2026-06-05",
  };
  const mismatches: string[] = [];
  if (manifest.dataset_version !== expected.dataset_version) mismatches.push("dataset_version");
  if (manifest.eval_version !== expected.eval_version) mismatches.push("eval_version");
  if (manifest.clinical_event_schema !== expected.clinical_event_schema) mismatches.push("clinical_event_schema");
  if (manifest.extractor_version !== expected.extractor_version) mismatches.push("extractor_version");
  if (manifest.normalization_version !== expected.normalization_version) mismatches.push("normalization_version");
  if (manifest.detector_version !== expected.detector_version) mismatches.push("detector_version");
  if (manifest.gap_policy_version !== expected.gap_policy_version) mismatches.push("gap_policy_version");
  if (manifest.evidence_version !== expected.evidence_version) mismatches.push("evidence_version");
  if (manifest.priority_version !== expected.priority_version) mismatches.push("priority_version");
  if (manifest.benchmark_version !== expected.benchmark_version) mismatches.push("benchmark_version");
  if (manifest.evaluation_as_of_date !== expected.evaluation_as_of_date) mismatches.push("evaluation_as_of_date");
  if (mismatches.length > 0) {
    throw new CacheVersionMismatchError(`Stale demo cache: ${mismatches.join(", ")} do not match the current pipeline versions.`);
  }
}

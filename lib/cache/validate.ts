import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { CanonicalClinicalEvent, SourceRecord, VerifiedGap } from "@/lib/domain";
import { buildQueue } from "@/lib/priority";
import type { GapInterventionPriority, PatientInterventionPriority, PriorityPanel } from "@/lib/priority/types";
import { sha256Text } from "./hashes";
import { verifyManifestSha256, type CacheManifest } from "./manifest";
import { assertCacheVersionCompatible } from "./compatibility";
import { LEAKAGE_TOKENS, projectEvaluationReport } from "./evaluation";
import { DEMO_CACHE_ARTIFACTS } from "./version";
import { CacheSchemaError } from "./errors";

export interface LoadedDemoCache {
  dir: string;
  manifest: CacheManifest;
  panel: DemoPanelArtifact;
  patients: DemoPatientSummary[];
  records: SourceRecord[];
  timelines: DemoTimeline[];
  verifiedGaps: VerifiedGap[];
  evidence: DemoEvidenceArtifact;
  priorities: DemoPrioritiesArtifact;
  queue: DemoQueueArtifact;
  impact: DemoImpactArtifact;
  evaluation: Record<string, unknown>;
  maria: DemoMariaArtifact;
}

export interface DemoPanelArtifact {
  panel_id: string;
  name: string;
  patient_count: number;
  flagged_patient_count: number;
  verified_gap_counts: Record<string, number>;
  top_patient_ids: string[];
  generated_at: string;
  synthetic: true;
}

export interface DemoPatientSummary {
  patient_id: string;
  fixture_key: string;
  display_name: string;
  age: number;
  sex: "F" | "M" | "X";
  primary_condition: string;
  last_contact_date: string;
  verified_gap_count: number;
  patient_priority_score: number;
  priority_band: string;
}

export interface DemoTimeline {
  patient_id: string;
  events: CanonicalClinicalEvent[];
  event_store_hash: string;
  clinical_event_schema: string;
  extractor_version: string;
}

export interface DemoEvidenceArtifact {
  bundles: VerifiedGap["evidence_bundle"][];
  deep_dives: Array<Record<string, unknown> & { gap_id: string }>;
}

export interface DemoPrioritiesArtifact {
  gap_priorities: GapInterventionPriority[];
  patient_priorities: PatientInterventionPriority[];
}

export interface DemoQueueArtifact {
  panel_id: string;
  k: number;
  items: ReturnType<typeof buildQueue>;
  priority_version: string;
  verified_gap_set_hash: string;
  generated_at: string;
}

export interface DemoImpactMetric {
  value: number;
  unit: string;
  classification: "MEASURED" | "MODELED" | "SCENARIO_ASSUMPTION" | "EXTERNAL_RESEARCH";
  source?: string;
  basis?: string;
}

export interface DemoImpactArtifact {
  measured: Record<string, DemoImpactMetric>;
  modeled: Record<string, DemoImpactMetric>;
  scenario_assumptions: Record<string, DemoImpactMetric>;
  external_research: Record<string, DemoImpactMetric>;
}

export interface DemoMariaArtifact {
  patient_id: string;
  fixture_key: string;
  queue_rank: number | null;
  flagship_gap_id: string | null;
  demo_path: { timeline_event_ids: string[]; gap_ids: string[]; flagship_evidence_id: string | null };
}

export interface CacheValidationReport {
  cache_version: string;
  run_id: string | null;
  patient_count: number;
  artifact_count: number;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  status: "PASS" | "FAIL";
}

export function cacheDirFor(root = process.cwd()): string {
  return join(root, "data", "demo-cache", "continua-demo-cache-v1");
}

export function readArtifact<T>(dir: string, name: string): T {
  const path = join(dir, name);
  if (!existsSync(path)) throw new CacheSchemaError(`Missing cache artifact: ${name}`);
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (cause) {
    throw new CacheSchemaError(`Invalid JSON in cache artifact: ${name}`, { cause });
  }
}

export function loadDemoCache(dir = cacheDirFor()): LoadedDemoCache {
  const manifest = readArtifact<CacheManifest>(dir, "manifest.json");
  assertCacheVersionCompatible(manifest);
  return {
    dir,
    manifest,
    panel: readArtifact<DemoPanelArtifact>(dir, "panel.json"),
    patients: readArtifact<DemoPatientSummary[]>(dir, "patients.json"),
    records: readArtifact<SourceRecord[]>(dir, "records.json"),
    timelines: readArtifact<DemoTimeline[]>(dir, "timelines.json"),
    verifiedGaps: readArtifact<{ verified_gaps: VerifiedGap[] }>(dir, "verified-gaps.json").verified_gaps,
    evidence: readArtifact<DemoEvidenceArtifact>(dir, "evidence.json"),
    priorities: readArtifact<DemoPrioritiesArtifact>(dir, "priorities.json"),
    queue: readArtifact<DemoQueueArtifact>(dir, "queue.json"),
    impact: readArtifact<DemoImpactArtifact>(dir, "impact.json"),
    evaluation: readArtifact<Record<string, unknown>>(dir, "evaluation.json"),
    maria: readArtifact<DemoMariaArtifact>(dir, "maria.json"),
  };
}

export function validateManifestHash(manifest: CacheManifest): string[] {
  const failures: string[] = [];
  if (!verifyManifestSha256(manifest)) failures.push("manifest_sha256 does not match the canonical manifest content");
  return failures;
}

export function validateArtifactHashes(cache: LoadedDemoCache): string[] {
  const failures: string[] = [];
  for (const name of DEMO_CACHE_ARTIFACTS) {
    if (name === "manifest.json") continue;
    const entry = cache.manifest.artifacts[name];
    if (!entry) {
      failures.push(`manifest has no hash entry for ${name}`);
      continue;
    }
    const path = join(cache.dir, name);
    if (!existsSync(path)) {
      failures.push(`artifact ${name} is missing`);
      continue;
    }
    const content = readFileSync(path);
    if (sha256Text(content) !== entry.sha256) failures.push(`hash mismatch for ${name}`);
    if (content.byteLength !== entry.bytes) failures.push(`byte length mismatch for ${name}`);
  }
  return failures;
}

export function validateCrossReferences(cache: LoadedDemoCache): string[] {
  const failures: string[] = [];
  const patientIds = new Set(cache.patients.map((patient) => patient.patient_id));
  const recordIds = new Set(cache.records.map((record) => record.source_doc_id));
  const eventIds = new Set(cache.timelines.flatMap((timeline) => timeline.events.map((event) => event.event_id)));
  const gapIds = new Set(cache.verifiedGaps.map((gap) => gap.gap_id));

  if (cache.manifest.patient_count !== cache.patients.length) failures.push("manifest patient_count differs from patients.json");
  if (cache.panel.patient_count !== cache.patients.length) failures.push("panel patient_count differs from patients.json");

  for (const record of cache.records) {
    if (!patientIds.has(record.patient_id)) failures.push(`record ${record.source_doc_id} references an unknown patient`);
    if (!recordIds.has(record.source_doc_id)) failures.push(`record index missing ${record.source_doc_id}`);
  }
  for (const timeline of cache.timelines) {
    if (!patientIds.has(timeline.patient_id)) failures.push(`timeline references an unknown patient ${timeline.patient_id}`);
    for (const event of timeline.events) {
      if (event.patient_id !== timeline.patient_id) failures.push(`event ${event.event_id} belongs to another patient`);
      if (!recordIds.has(event.source.source_doc_id)) failures.push(`event ${event.event_id} references a missing record`);
    }
  }
  for (const gap of cache.verifiedGaps) {
    if (!patientIds.has(gap.patient_id)) failures.push(`gap ${gap.gap_id} references an unknown patient`);
    if (gap.schema_version !== "verified-gap-v1") failures.push(`gap ${gap.gap_id} is not a VerifiedGap v1`);
    if (gap.grounded !== true) failures.push(`gap ${gap.gap_id} is not grounded`);
    if (gap.evidence_bundle.verification_status !== "verified") failures.push(`gap ${gap.gap_id} has an unverified bundle`);
    if (gap.evidence_bundle.gap_id !== gap.gap_id) failures.push(`gap ${gap.gap_id} bundle id mismatch`);
    if (gap.evidence_bundle.patient_id !== gap.patient_id) failures.push(`gap ${gap.gap_id} bundle patient mismatch`);
    for (const source of gap.evidence_bundle.positive) {
      if (source.patient_id !== gap.patient_id) failures.push(`gap ${gap.gap_id} cites another patient's evidence`);
      if (!recordIds.has(source.source_doc_id)) failures.push(`gap ${gap.gap_id} cites a missing record`);
      if (!eventIds.has(source.event_id)) failures.push(`gap ${gap.gap_id} cites a missing event`);
    }
    for (const claim of gap.evidence_bundle.claims) {
      if (claim.required && !claim.supported) failures.push(`gap ${gap.gap_id} has an unsupported required claim`);
    }
  }
  for (const priority of cache.priorities.gap_priorities) {
    if (!gapIds.has(priority.gap_id)) failures.push(`gap priority references an unverified gap ${priority.gap_id}`);
    if (!patientIds.has(priority.patient_id)) failures.push(`gap priority references an unknown patient`);
  }
  for (const priority of cache.priorities.patient_priorities) {
    if (!patientIds.has(priority.patient_id)) failures.push(`patient priority references an unknown patient`);
    if (priority.breakdown.top_gap_id && !gapIds.has(priority.breakdown.top_gap_id)) {
      failures.push(`patient priority top gap ${priority.breakdown.top_gap_id} is not verified`);
    }
  }
  for (const item of cache.queue.items) {
    if (!patientIds.has(item.patient_id)) failures.push(`queue item references an unknown patient`);
    if (!gapIds.has(item.top_gap.gap_id)) failures.push(`queue item references an unverified gap`);
  }
  if (cache.maria.queue_rank !== null) {
    const ranked = cache.priorities.patient_priorities.find((priority) => priority.patient_id === cache.maria.patient_id);
    if (!ranked) failures.push("maria.json references a patient without priority");
    else if (ranked.rank !== cache.maria.queue_rank) failures.push("maria.json queue_rank differs from the stored priority rank");
  }
  for (const gapId of cache.maria.demo_path.gap_ids) {
    if (!gapIds.has(gapId)) failures.push(`maria.json references an unverified gap ${gapId}`);
  }
  for (const eventId of cache.maria.demo_path.timeline_event_ids) {
    if (!eventIds.has(eventId)) failures.push(`maria.json references a missing event ${eventId}`);
  }
  return failures;
}

export function validateQueueIntegrity(cache: LoadedDemoCache): string[] {
  const failures: string[] = [];
  const panel: PriorityPanel = {
    schema_version: "priority-panel-v1",
    priority_version: "priority-v1",
    evidence_version: "evidence-v1",
    detector_version: "gaps-v1",
    verified_gap_set_hash: cache.queue.verified_gap_set_hash,
    evaluation_as_of_date: cache.manifest.evaluation_as_of_date,
    gap_priorities: cache.priorities.gap_priorities,
    patient_priorities: cache.priorities.patient_priorities,
    ineligible_gaps: [],
    ranked_patient_count: cache.priorities.patient_priorities.filter((priority) => priority.rank !== null).length,
  };
  const expected = buildQueue(
    panel,
    cache.verifiedGaps,
    cache.patients.map((patient) => ({ patient_id: patient.patient_id, display_name: patient.display_name })),
    cache.queue.k,
  );
  if (JSON.stringify(expected) !== JSON.stringify(cache.queue.items)) {
    failures.push("stored queue is not reproducible from the stored priorities and verified gaps");
  }
  const sorted = [...cache.priorities.patient_priorities]
    .filter((priority) => priority.rank !== null)
    .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0))
    .slice(0, cache.queue.k)
    .map((priority) => priority.patient_id);
  if (JSON.stringify(sorted) !== JSON.stringify(cache.queue.items.map((item) => item.patient_id))) {
    failures.push("queue order differs from the ranked priority artifact");
  }
  return failures;
}

export function validateEvaluation(cache: LoadedDemoCache, frozenReport: Record<string, unknown>): string[] {
  const failures: string[] = [];
  const expected = projectEvaluationReport(frozenReport);
  if (JSON.stringify(cache.evaluation) !== JSON.stringify(expected)) {
    failures.push("evaluation.json does not match the projected frozen Phase-9 report");
  }
  if (cache.evaluation.status !== "COMPLETED") failures.push("cached benchmark report is not COMPLETED");
  if (cache.evaluation.benchmark_run_id !== String(frozenReport.run_id ?? "unknown")) {
    failures.push("evaluation.json points at a different benchmark run");
  }
  const gates = (cache.evaluation as { gates?: Array<{ passed?: boolean }> }).gates ?? [];
  if (gates.some((gate) => gate.passed === false)) failures.push("cached benchmark report contains a failed gate");
  return failures;
}

const IMPACT_CLASSES = ["MEASURED", "MODELED", "SCENARIO_ASSUMPTION", "EXTERNAL_RESEARCH"] as const;

export function validateImpactClassification(cache: LoadedDemoCache): string[] {
  const failures: string[] = [];
  const buckets: Array<[string, Record<string, DemoImpactMetric>]> = [
    ["measured", cache.impact.measured],
    ["modeled", cache.impact.modeled],
    ["scenario_assumptions", cache.impact.scenario_assumptions],
    ["external_research", cache.impact.external_research],
  ];
  for (const [bucket, metrics] of buckets) {
    for (const [name, metric] of Object.entries(metrics)) {
      if (!metric || typeof metric !== "object") {
        failures.push(`impact metric ${bucket}.${name} is malformed`);
        continue;
      }
      if (!IMPACT_CLASSES.includes(metric.classification)) {
        failures.push(`impact metric ${bucket}.${name} has no claim classification`);
      }
      if (typeof metric.value !== "number") failures.push(`impact metric ${bucket}.${name} has no measured value`);
    }
  }
  return failures;
}

export function auditLeakage(dir: string): string[] {
  const failures: string[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    const content = readFileSync(join(dir, name), "utf8");
    for (const token of LEAKAGE_TOKENS) {
      if (content.includes(token)) failures.push(`${name} contains the label token "${token}"`);
    }
  }
  return failures;
}

/**
 * The demo cache rebuilds the frozen pipeline offline, so gap ids are remapped;
 * clinical identity (patient + type + title) must still match the qualified run
 * exactly, with no extra and no missing gaps for the benchmark partition.
 */
export function validateBenchmarkGapIdentity(
  cache: LoadedDemoCache,
  benchmarkGaps: Array<{ patient_id: string; gap_type: string; title: string }>,
): string[] {
  const identity = (gap: { patient_id: string; gap_type: string; title: string }) =>
    `${gap.patient_id}|${gap.gap_type}|${gap.title}`;
  const partitionPatients = new Set(benchmarkGaps.map((gap) => gap.patient_id));
  const cacheGaps = cache.verifiedGaps.filter((gap) => partitionPatients.has(gap.patient_id));
  const expected = new Map<string, number>();
  for (const gap of benchmarkGaps) expected.set(identity(gap), (expected.get(identity(gap)) ?? 0) + 1);
  const actual = new Map<string, number>();
  for (const gap of cacheGaps) actual.set(identity(gap), (actual.get(identity(gap)) ?? 0) + 1);
  const failures: string[] = [];
  for (const [key, count] of expected) {
    if ((actual.get(key) ?? 0) !== count) failures.push(`benchmark gap missing from cache: ${key}`);
  }
  for (const [key, count] of actual) {
    if ((expected.get(key) ?? 0) !== count) failures.push(`cache gap is not present in the qualified benchmark run: ${key}`);
  }
  return failures;
}

export function validateLoadedCache(
  cache: LoadedDemoCache,
  frozenReport: Record<string, unknown>,
  benchmarkGaps: Array<{ patient_id: string; gap_type: string; title: string }> = [],
) {
  return [
    { name: "manifest hash", failures: validateManifestHash(cache.manifest) },
    { name: "artifact hashes", failures: validateArtifactHashes(cache) },
    { name: "cross references", failures: validateCrossReferences(cache) },
    { name: "queue integrity", failures: validateQueueIntegrity(cache) },
    { name: "benchmark integrity", failures: validateEvaluation(cache, frozenReport) },
    { name: "benchmark gap identity", failures: validateBenchmarkGapIdentity(cache, benchmarkGaps) },
    { name: "impact classification", failures: validateImpactClassification(cache) },
    { name: "leakage", failures: auditLeakage(cache.dir) },
  ];
}

export function validateDemoCache(input: {
  dir?: string;
  frozenReport: Record<string, unknown>;
  benchmarkGaps?: Array<{ patient_id: string; gap_type: string; title: string }>;
}): CacheValidationReport {
  const dir = input.dir ?? cacheDirFor();
  let cache: LoadedDemoCache;
  try {
    cache = loadDemoCache(dir);
  } catch (error) {
    return {
      cache_version: "unknown",
      run_id: null,
      patient_count: 0,
      artifact_count: 0,
      checks: [
        {
          name: "cache load",
          passed: false,
          detail: error instanceof Error ? error.message : String(error),
        },
      ],
      status: "FAIL",
    };
  }
  const checks = validateLoadedCache(cache, input.frozenReport, input.benchmarkGaps);
  return {
    cache_version: cache.manifest.cache_version,
    run_id: (cache.evaluation as { run_id?: string }).run_id ?? null,
    patient_count: cache.patients.length,
    artifact_count: Object.keys(cache.manifest.artifacts).length,
    checks: checks.map((check) => ({
      name: check.name,
      passed: check.failures.length === 0,
      detail: check.failures.length === 0 ? "PASS" : check.failures.slice(0, 5).join("; "),
    })),
    status: checks.every((check) => check.failures.length === 0) ? "PASS" : "FAIL",
  };
}

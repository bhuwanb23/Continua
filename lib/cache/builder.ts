import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { sha256Text } from "./hashes";
import { finalizeManifest, type CacheManifest } from "./manifest";
import { DEMO_CACHE_VERSION, EXPECTED_CACHE_VERSIONS } from "./version";
import { loadBenchmarkReport } from "./benchmark-report";
import { projectEvaluationReport } from "./evaluation";
import { DEMO_CACHE_EVALUATION_DATE, executeDemoSourceRun } from "./source-run";

export { loadBenchmarkReport };

const MANUAL_REVIEW_MINUTES_PER_GAP = 12;

function measuredQueueReadP50(evaluation: Record<string, unknown>): number | null {
  const latency = evaluation.latency as
    | { cached_queue_read_parse?: { p50_ms?: number | null } }
    | undefined;
  const value = latency?.cached_queue_read_parse?.p50_ms;
  return typeof value === "number" ? Math.round(value * 10000) / 10000 : null;
}

/** Impact claims keep their evidence class; modeled numbers never masquerade as measured. */
function buildImpactArtifact(verifiedGapCount: number, evaluation: Record<string, unknown>) {
  const queueReadP50 = measuredQueueReadP50(evaluation);
  const modeledHours = Math.round(((verifiedGapCount * MANUAL_REVIEW_MINUTES_PER_GAP) / 60) * 10) / 10;
  return {
    measured: {
      ...(queueReadP50 === null
        ? {}
        : {
            cache_queue_read_p50_ms: {
              value: queueReadP50,
              unit: "ms",
              classification: "MEASURED" as const,
              source: "frozen Phase-9 benchmark latency.json (cached_queue_read_parse.p50_ms)",
            },
          }),
      verified_gap_count: {
        value: verifiedGapCount,
        unit: "gaps",
        classification: "MEASURED" as const,
        source: "frozen priority panel verified gap set",
      },
    },
    modeled: {
      potential_coordinator_hours_redirected: {
        value: modeledHours,
        unit: "hours",
        classification: "MODELED" as const,
        basis: `${MANUAL_REVIEW_MINUTES_PER_GAP} manual review minutes per verified gap (scenario assumption) x ${verifiedGapCount} verified gaps`,
      },
    },
    scenario_assumptions: {
      manual_review_minutes_per_verified_gap: {
        value: MANUAL_REVIEW_MINUTES_PER_GAP,
        unit: "minutes",
        classification: "SCENARIO_ASSUMPTION" as const,
        basis: "Assumed coordinator review time; not measured in this build.",
      },
    },
    external_research: {},
  };
}

export interface BuildDemoCacheOptions {
  outputDir: string;
  gitCommit?: string;
  generatedAt?: string;
}

function detectGitCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: process.cwd() }).toString().trim();
  } catch {
    return "unknown";
  }
}

function countGapTypes(gaps: Array<{ gap_type: string }>): Record<string, number> {
  const counts: Record<string, number> = { missed_followup: 0, duplicate_test: 0, med_monitoring: 0 };
  for (const gap of gaps) counts[gap.gap_type] = (counts[gap.gap_type] ?? 0) + 1;
  return counts;
}

export async function buildDemoCache(options: BuildDemoCacheOptions): Promise<CacheManifest> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const source = await executeDemoSourceRun();
  const outputDir = options.outputDir;
  mkdirSync(outputDir, { recursive: true });

  const patientSummaries = source.patients.map((patient) => {
    const priority = source.patientPriorities.find((item) => item.patient_id === patient.patient_id);
    const verifiedGapCount = source.verifiedGaps.filter((gap) => gap.patient_id === patient.patient_id).length;
    return {
      patient_id: patient.patient_id,
      fixture_key: patient.fixture_key,
      display_name: patient.display_name,
      age: patient.demo_age,
      sex: patient.sex,
      primary_condition: patient.primary_condition,
      last_contact_date: patient.last_contact_date,
      verified_gap_count: verifiedGapCount,
      patient_priority_score: priority?.patient_priority_score ?? 0,
      priority_band: priority?.priority_band ?? "NONE",
    };
  });

  const timelines = source.patients.map((patient) => ({
    patient_id: patient.patient_id,
    events: source.events.filter((event) => event.patient_id === patient.patient_id),
    event_store_hash: source.eventStoreHash,
    clinical_event_schema: "clinical-event-v1.1",
    extractor_version: "extractor-v1",
  }));

  const flaggedPatients = new Set(source.verifiedGaps.map((gap) => gap.patient_id));
  const panel = {
    panel_id: "demo",
    name: "Oncology Continuity Demo",
    patient_count: source.patients.length,
    flagged_patient_count: flaggedPatients.size,
    verified_gap_counts: countGapTypes(source.verifiedGaps),
    top_patient_ids: source.queue.map((item) => item.patient_id),
    generated_at: generatedAt,
    synthetic: true as const,
  };

  const evaluation = projectEvaluationReport(loadBenchmarkReport());
  const impact = buildImpactArtifact(source.verifiedGaps.length, evaluation);

  const maria = source.patients.find((patient) => patient.fixture_key === "P-001-maria");
  if (!maria) throw new Error("Maria is missing from the synthetic panel.");
  const mariaGaps = source.verifiedGaps.filter((gap) => gap.patient_id === maria.patient_id);
  const mariaPriority = source.patientPriorities.find((item) => item.patient_id === maria.patient_id);
  const mariaTimeline = timelines.find((timeline) => timeline.patient_id === maria.patient_id);
  const mariaArtifact = {
    patient_id: maria.patient_id,
    fixture_key: "P-001-maria" as const,
    queue_rank: mariaPriority?.rank ?? null,
    flagship_gap_id: mariaGaps[0]?.gap_id ?? null,
    demo_path: {
      timeline_event_ids: (mariaTimeline?.events ?? []).map((event) => event.event_id),
      gap_ids: mariaGaps.map((gap) => gap.gap_id),
      flagship_evidence_id: mariaGaps[0]?.evidence_bundle.positive[0]?.evidence_id ?? null,
    },
  };

  const artifacts: Record<string, unknown> = {
    "panel.json": panel,
    "patients.json": patientSummaries,
    "records.json": source.records,
    "timelines.json": timelines,
    "verified-gaps.json": { verified_gaps: source.verifiedGaps },
    "evidence.json": {
      bundles: source.verifiedGaps.map((gap) => gap.evidence_bundle),
      deep_dives: source.verifiedGaps.map((gap) => ({ gap_id: gap.gap_id, ...gap.evidence_deep_dive })),
    },
    "priorities.json": {
      gap_priorities: source.gapPriorities,
      patient_priorities: source.patientPriorities,
    },
    "queue.json": {
      panel_id: "demo",
      k: source.queue.length,
      items: source.queue,
      priority_version: "priority-v1",
      verified_gap_set_hash: source.verifiedGapSetHash,
      generated_at: generatedAt,
    },
    "impact.json": impact,
    "evaluation.json": evaluation,
    "maria.json": mariaArtifact,
  };

  const artifactEntries: Record<string, { sha256: string; bytes: number }> = {};
  for (const [name, data] of Object.entries(artifacts)) {
    const content = `${JSON.stringify(data, null, 2)}\n`;
    writeFileSync(join(outputDir, name), content, "utf8");
    artifactEntries[name] = {
      sha256: sha256Text(Buffer.from(content, "utf8")),
      bytes: Buffer.byteLength(content, "utf8"),
    };
  }

  const manifest = finalizeManifest({
    cache_version: DEMO_CACHE_VERSION,
    dataset_version: EXPECTED_CACHE_VERSIONS.dataset_version,
    eval_version: EXPECTED_CACHE_VERSIONS.eval_version,
    clinical_event_schema: EXPECTED_CACHE_VERSIONS.clinical_event_schema,
    extractor_version: EXPECTED_CACHE_VERSIONS.extractor_version,
    normalization_version: EXPECTED_CACHE_VERSIONS.normalization_version,
    detector_version: EXPECTED_CACHE_VERSIONS.detector_version,
    gap_policy_version: EXPECTED_CACHE_VERSIONS.gap_policy_version,
    evidence_version: EXPECTED_CACHE_VERSIONS.evidence_version,
    priority_version: EXPECTED_CACHE_VERSIONS.priority_version,
    benchmark_version: EXPECTED_CACHE_VERSIONS.benchmark_version,
    evaluation_as_of_date: DEMO_CACHE_EVALUATION_DATE,
    patient_count: source.patients.length,
    generated_at: generatedAt,
    git_commit: options.gitCommit ?? detectGitCommit(),
    artifacts: artifactEntries,
  });
  writeFileSync(join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

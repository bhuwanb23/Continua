import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { VerifiedGap } from "@/lib/domain";
import { loadBenchmarkBundle } from "@/lib/evaluation/benchmark-bundle";
import { computeDetectionMetrics, computeHardNegativePassRate } from "@/lib/evaluation/metrics";
import { evaluateGrounding } from "@/lib/evaluation/grounding";
import { createEvidenceVerificationContext } from "@/lib/evidence";
import { buildQueue, computePanelPriorities } from "@/lib/priority";
import { executeEvidenceRun } from "@/scripts/lib/evidence-run";
import { loadPatientDisplays } from "@/scripts/lib/priority-run";
import type { BenchmarkConfig, BenchmarkMode, BenchmarkReport, IntegrityReport } from "./types";
import {
  BENCHMARK_ARTIFACTS,
  BENCHMARK_LATEST,
  EXTRACTED_DEV_PATH,
  EXTRACTED_FINAL_PATH,
  PRIORITY_K,
  sanitizeRunId,
} from "./config";
import { gitState, runPreflight } from "./preflight";
import { buildMetadata } from "./metadata";
import { evaluateExtraction, toExtractionPrediction } from "./extraction";
import { evaluateEvidenceLayer, evaluateGapLayers, evaluateNegatives, verifiedPrediction } from "./gaps";
import { evaluatePriorityLayer } from "./priority";
import { evaluateEndToEnd } from "./end-to-end";
import { buildErrorAttribution, buildFailureFunnel } from "./funnel";
import { runCorruptionBenchmark } from "./corruption";
import { buildBaselineReport } from "./baselines";
import { buildExtractedEventIdMap } from "./event-identity";
import { buildAblationReport } from "./ablations";
import { runLatencyBenchmark } from "./latency";
import { buildCostReport } from "./cost";
import { compareReproducibility, type ReproducibilitySnapshot as Snapshot } from "./reproducibility";
import { buildBenchmarkReport, scorecardLines } from "./report";

function defaultRunId(mode: BenchmarkMode, shortCommit: string): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return sanitizeRunId(`benchmark-${stamp}-${shortCommit || "nogit"}-${mode}`);
}

export function createBenchmarkConfig(input: {
  mode: BenchmarkMode;
  runId?: string;
  repetitions?: number;
  extractedEventsPath?: string;
}): BenchmarkConfig {
  const git = gitState();
  const mode = input.mode;
  return {
    benchmark_version: "continua-benchmark-v1",
    mode,
    partition: mode === "dev" ? "dev" : "final",
    k: PRIORITY_K,
    evaluation_as_of_date: "2026-06-05",
    extracted_events_path:
      input.extractedEventsPath ?? (mode === "dev" ? EXTRACTED_DEV_PATH : EXTRACTED_FINAL_PATH),
    run_id: input.runId ?? defaultRunId(mode, git.short_commit),
    extraction_source: "fixture_replay",
    repetitions: input.repetitions ?? 12,
  };
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function listFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full));
    else files.push(full);
  }
  return files;
}

function hashFiles(dir: string, exclude: Set<string>): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const file of listFiles(dir).sort()) {
    const rel = relative(dir, file).replaceAll("\\", "/");
    if (exclude.has(rel)) continue;
    hashes[rel] = createHash("sha256").update(readFileSync(file)).digest("hex");
  }
  return hashes;
}

function snapshot(input: {
  eventsSha: string;
  candidates: Array<{ gap_id: string }>;
  verified: VerifiedGap[];
  patientScores: Array<{ patient_id: string; score: number; rank: number | null }>;
  topK: string[];
  evaluation: Record<string, number | string | boolean | null>;
}): Snapshot {
  return {
    canonical_event_cache_sha256: input.eventsSha,
    candidate_gap_ids: input.candidates.map((gap) => gap.gap_id),
    verified_gap_ids: input.verified.map((gap) => gap.gap_id),
    patient_scores: input.patientScores,
    top_k_order: input.topK,
    evaluation_results: input.evaluation,
  };
}

export interface BenchmarkResult {
  run_id: string;
  output_dir: string;
  report: BenchmarkReport;
  scorecard: string[];
}

export function runBenchmark(options: {
  mode: BenchmarkMode;
  runId?: string;
  repetitions?: number;
  allowDirty?: boolean;
}): BenchmarkResult {
  const config = createBenchmarkConfig(options);
  const outDir = join(BENCHMARK_ARTIFACTS, config.run_id);
  if (existsSync(outDir)) {
    throw new Error(`Benchmark run ${config.run_id} already exists. Runs are immutable; choose a new --run-id.`);
  }

  const preflight = runPreflight(config);
  if (!preflight.ok) {
    const failures = preflight.checks.filter((check) => !check.passed).map((check) => `${check.name}: ${check.detail}`);
    throw new Error(`Benchmark preflight failed; no metrics were published.\n${failures.join("\n")}`);
  }
  if (!options.allowDirty) {
    const dirty = preflight.checks.find((check) => check.name === "git_working_tree_clean");
    if (dirty && !dirty.passed) {
      preflight.warnings.push("Final benchmark is running from a dirty worktree; provenance is recorded in metadata.");
    }
  }

  const timestamp = new Date().toISOString();
  const git = gitState();
  const benchmark = loadBenchmarkBundle();
  const patientIds = config.partition === "dev" ? benchmark.partitions.dev : benchmark.partitions.final;
  const patientSet = new Set(patientIds);
  const truthGaps = benchmark.contracts.truth_gaps.filter((gap) => patientSet.has(gap.patient_id));
  const negatives = benchmark.contracts.negatives.filter((negative) => patientSet.has(negative.patient_id));
  const gold = benchmark.contracts.extraction_gold.filter((event) => patientSet.has(event.patient_id));
  const records = benchmark.records.filter((record) => patientSet.has(record.patient_id));
  const patients = loadPatientDisplays().filter((patient) => patientSet.has(patient.patient_id));

  const oracle = executeEvidenceRun({ runId: "oracle", mode: "oracle", partition: config.partition });
  const extracted = executeEvidenceRun({
    runId: "extracted",
    mode: "extracted",
    partition: config.partition,
    extractedPath: config.extracted_events_path,
  });
  const evidenceContext = createEvidenceVerificationContext(extracted.events, extracted.records, {
    evaluation_as_of_date: config.evaluation_as_of_date,
    event_store_hash: extracted.event_store_hash,
  });

  const extractedEventIdMap = buildExtractedEventIdMap(extracted.events as any);
  function remapCandidate(candidate: (typeof extracted.candidates)[number]): void {
    candidate.trigger_event_ids = candidate.trigger_event_ids.map((id) => extractedEventIdMap.get(id) ?? id);
    candidate.identity = {
      ...(candidate.identity ?? {}),
      event_ids: ((candidate.identity as { event_ids?: string[] } | undefined)?.event_ids ?? []).map(
        (id) => extractedEventIdMap.get(id) ?? id,
      ),
    };
  }
  for (const candidate of extracted.candidates) remapCandidate(candidate);
  for (const result of extracted.results) remapCandidate(result.candidate);
  for (const gap of extracted.verified) remapCandidate(gap.candidate);
  const extractedRemappedEvents = extracted.events.map((event) => ({
    ...event,
    event_id: extractedEventIdMap.get(event.event_id) ?? event.event_id,
  })) as typeof extracted.events;

  const extraction = evaluateExtraction({
    config,
    events: extracted.events,
    gold,
    records,
  });
  const gapLayers = evaluateGapLayers({
    config,
    truthGaps,
    oracleCandidates: oracle.candidates,
    oracleVerified: oracle.verified,
    extractedCandidates: extracted.candidates,
    extractedVerified: extracted.verified,
  });
  const evidence = evaluateEvidenceLayer({
    config,
    truthGaps,
    candidates: extracted.candidates,
    verified: extracted.verified,
    results: extracted.results,
    records,
  });
  const corruption = runCorruptionBenchmark({
    candidates: extracted.candidates,
    records: extracted.records,
    context: evidenceContext,
  });
  const negativeLayer = evaluateNegatives({
    negatives,
    candidates: extracted.candidates,
    verified: extracted.verified,
    target: 0.9,
  });
  const priority = evaluatePriorityLayer({
    patientIds,
    gaps: extracted.verified,
    truthGaps,
    eventStoreHash: extracted.event_store_hash,
    patients,
  });
  priority.source = config.extraction_source;

  const verifiedGrounding = evaluateGrounding(extracted.verified.map(verifiedPrediction), records);
  const verifiedIds = new Set(extracted.verified.map((gap) => gap.gap_id));
  const trust = {
    citation_validity: evidence.verified_grounding.citation_validity,
    patient_ownership_rate:
      evidence.verified_grounding.evidence_items === 0
        ? null
        : (evidence.verified_grounding.evidence_items - evidence.wrong_patient_citations) /
          evidence.verified_grounding.evidence_items,
    span_support_rate: evidence.verified_grounding.span_support_rate,
    grounded_gap_rate: evidence.verified_grounding.grounded_gap_rate,
    unsupported_claim_rate: evidence.verified_grounding.unsupported_claim_rate,
    required_claim_support: evidence.required_claim_support,
    ungrounded_queue_gaps: priority.queue.filter((item) => !verifiedIds.has(item.top_gap.gap_id)).length,
    wrong_patient_citations: evidence.wrong_patient_citations,
  };

  const endToEnd = evaluateEndToEnd({
    config,
    patientIds,
    truthGaps,
    negatives,
    candidates: extracted.candidates,
    verified: extracted.verified,
    hardNegativePassRate: negativeLayer.verified_pass_rate,
    trust,
    priority,
  });
  const funnel = buildFailureFunnel({
    truthGaps,
    events: extracted.events,
    candidates: extracted.candidates,
    verified: extracted.verified,
    priority,
  });
  const attribution = buildErrorAttribution({ truthGaps, funnel, priority });
  const baselineResult = buildBaselineReport({
    truthGaps,
    negatives,
    patientIds: patientSet,
    events: extractedRemappedEvents,
    records,
    oracleMetrics: gapLayers.oracle.metrics,
    fullHybridMetrics: endToEnd.metrics,
    fullHybridNegativePassRate: negativeLayer.verified_pass_rate,
    fullHybridGroundingRate: evidence.verified_grounding.grounded_gap_rate,
  });
  const ablations = buildAblationReport({
    truthGaps,
    patientIds,
    verified: extracted.verified,
    patients,
    eventStoreHash: extracted.event_store_hash,
    fullMetrics: endToEnd.metrics,
    candidateMetrics: evidence.candidate_metrics,
    oracleMetrics: gapLayers.oracle.metrics,
  });
  const latency = runLatencyBenchmark({
    config,
    records: extracted.records,
    events: extracted.events,
    gaps: extracted.verified,
    patientIds,
    patients,
    eventStoreHash: extracted.event_store_hash,
    singlePatientExtractedPath: EXTRACTED_DEV_PATH,
  });
  const cost = buildCostReport(config, records.length);

  const secondExtracted = executeEvidenceRun({
    runId: "extracted-reproducibility",
    mode: "extracted",
    partition: config.partition,
    extractedPath: config.extracted_events_path,
  });
  const secondMap = buildExtractedEventIdMap(secondExtracted.events as any);
  for (const candidate of secondExtracted.candidates) {
    candidate.trigger_event_ids = candidate.trigger_event_ids.map((id) => secondMap.get(id) ?? id);
    candidate.identity = {
      ...(candidate.identity ?? {}),
      event_ids: ((candidate.identity as { event_ids?: string[] } | undefined)?.event_ids ?? []).map(
        (id) => secondMap.get(id) ?? id,
      ),
    };
  }
  for (const result of secondExtracted.results) {
    result.candidate.trigger_event_ids = result.candidate.trigger_event_ids.map((id) => secondMap.get(id) ?? id);
    result.candidate.identity = {
      ...(result.candidate.identity ?? {}),
      event_ids: ((result.candidate.identity as { event_ids?: string[] } | undefined)?.event_ids ?? []).map(
        (id) => secondMap.get(id) ?? id,
      ),
    };
  }
  for (const gap of secondExtracted.verified) {
    gap.candidate.trigger_event_ids = gap.candidate.trigger_event_ids.map((id) => secondMap.get(id) ?? id);
    gap.candidate.identity = {
      ...(gap.candidate.identity ?? {}),
      event_ids: ((gap.candidate.identity as { event_ids?: string[] } | undefined)?.event_ids ?? []).map(
        (id) => secondMap.get(id) ?? id,
      ),
    };
  }
  const secondPanel = computePanelPriorities({
    patient_ids: secondExtracted.patient_ids,
    gaps: secondExtracted.verified,
    evaluation_as_of_date: config.evaluation_as_of_date,
    event_store_hash: secondExtracted.event_store_hash,
  });
  const secondQueue = buildQueue(secondPanel, secondExtracted.verified, patients, PRIORITY_K);
  const secondMetrics = computeDetectionMetrics(truthGaps, secondExtracted.verified.map(verifiedPrediction));
  const secondNegatives = computeHardNegativePassRate(negatives, secondExtracted.verified.map(verifiedPrediction));
  const firstMetrics = computeDetectionMetrics(truthGaps, extracted.verified.map(verifiedPrediction));
  const firstNegatives = computeHardNegativePassRate(negatives, extracted.verified.map(verifiedPrediction));
  const reproducibility = compareReproducibility(
    snapshot({
      eventsSha: extracted.event_store_hash,
      candidates: extracted.candidates,
      verified: extracted.verified,
      patientScores: priority.panel.patient_priorities.map((patient) => ({
        patient_id: patient.patient_id,
        score: patient.patient_priority_score,
        rank: patient.rank,
      })),
      topK: priority.queue.map((item) => item.patient_id),
      evaluation: {
        macro_f1: firstMetrics.macro_f1,
        micro_f1: firstMetrics.micro_f1,
        true_positives: firstMetrics.true_positives,
        false_positives: firstMetrics.false_positives,
        false_negatives: firstMetrics.false_negatives,
        hard_negative_pass_rate: firstNegatives.pass_rate,
      },
    }),
    snapshot({
      eventsSha: secondExtracted.event_store_hash,
      candidates: secondExtracted.candidates,
      verified: secondExtracted.verified,
      patientScores: secondPanel.patient_priorities.map((patient) => ({
        patient_id: patient.patient_id,
        score: patient.patient_priority_score,
        rank: patient.rank,
      })),
      topK: secondQueue.map((item) => item.patient_id),
      evaluation: {
        macro_f1: secondMetrics.macro_f1,
        micro_f1: secondMetrics.micro_f1,
        true_positives: secondMetrics.true_positives,
        false_positives: secondMetrics.false_positives,
        false_negatives: secondMetrics.false_negatives,
        hard_negative_pass_rate: secondNegatives.pass_rate,
      },
    }),
  );

  const metadata = buildMetadata({
    config,
    status: "COMPLETED",
    git,
    timestamp,
    hashes: preflight.hashes,
    inputHashes: preflight.input_hashes,
    patientCount: patientIds.length,
  });

  const tempDir = join(BENCHMARK_ARTIFACTS, `.${config.run_id}.tmp`);
  if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });

  try {
    writeJson(join(tempDir, "metadata.json"), metadata);
    writeJson(join(tempDir, "preflight.json"), preflight);
    writeJson(join(tempDir, "extraction", "predictions.json"), {
      predictions: extracted.events.map(toExtractionPrediction),
      gold,
      annotated_scope: extraction.annotated_scope,
      all_predictions_scope: extraction.all_predictions_scope,
    });
    writeJson(join(tempDir, "extraction", "metrics.json"), extraction);
    writeJson(join(tempDir, "extraction", "errors.json"), {
      false_positive_prediction_ids: extraction.annotated_scope.metrics.false_positive_prediction_ids,
      false_negative_gold_ids: extraction.annotated_scope.metrics.false_negative_gold_ids,
      taxonomy: extraction.error_taxonomy,
    });
    writeJson(join(tempDir, "gaps", "oracle.json"), {
      layer: gapLayers.oracle,
      verified_gap_ids: oracle.verified.map((gap) => gap.gap_id),
    });
    writeJson(join(tempDir, "gaps", "extracted.json"), {
      layer: gapLayers.extracted,
      verified_gap_ids: extracted.verified.map((gap) => gap.gap_id),
    });
    writeJson(join(tempDir, "gaps", "errors.json"), {
      extraction_loss: gapLayers.extraction_loss,
      lost_truth_gaps: funnel.truth_gap_ids_lost,
    });
    writeJson(join(tempDir, "evidence", "verified.json"), { verified_gaps: extracted.verified });
    writeJson(join(tempDir, "evidence", "suppressed.json"), {
      suppressed: extracted.suppressed.map((result) => result.suppression),
    });
    writeJson(join(tempDir, "evidence", "metrics.json"), {
      layer: evidence,
      grounding_results: verifiedGrounding.results,
    });
    writeJson(join(tempDir, "priority", "ranked-panel.json"), priority.panel);
    writeJson(join(tempDir, "priority", "top-k.json"), {
      k: PRIORITY_K,
      queue: priority.queue,
      top5: priority.top5,
      precision_at_k: priority.precision_at_k,
    });
    writeJson(join(tempDir, "priority", "sensitivity.json"), priority.sensitivity);
    writeJson(join(tempDir, "negatives", "results.json"), negativeLayer);
    writeJson(join(tempDir, "corruption", "results.json"), corruption);
    writeJson(join(tempDir, "baselines", "naive.json"), {
      predictions: baselineResult.naivePredictions,
      metrics: baselineResult.report.entries.find((entry) => entry.name === "naive_keyword_rules"),
    });
    writeJson(join(tempDir, "baselines", "llm-only.json"), {
      status: "not_run",
      reason: "No live provider configured. No synthetic output is substituted for an LLM-only baseline.",
    });
    writeJson(join(tempDir, "baselines", "report.json"), baselineResult.report);
    writeJson(join(tempDir, "ablations", "results.json"), ablations);
    writeJson(join(tempDir, "latency.json"), latency);
    writeJson(join(tempDir, "cost.json"), cost);
    writeJson(join(tempDir, "reproducibility.json"), reproducibility);
    writeJson(join(tempDir, "failure-funnel.json"), funnel);
    writeJson(join(tempDir, "error-attribution.json"), attribution);
    writeJson(join(tempDir, "end-to-end.json"), endToEnd);

    const preReportHashes = hashFiles(tempDir, new Set(["final-report.json", "artifact-hashes.json"]));
    const integrity: IntegrityReport = {
      status: "PASS",
      immutable: true,
      overwrite_forbidden: true,
      artifact_hashes: preReportHashes,
      artifact_count: Object.keys(preReportHashes).length,
      hash_algorithm: "sha256",
      invalid_reasons: [],
      warnings: preflight.warnings,
    };
    const report = buildBenchmarkReport({
      config,
      metadata,
      preflight,
      extraction,
      oracle: gapLayers.oracle,
      extracted: gapLayers.extracted,
      extractionLoss: gapLayers.extraction_loss,
      evidence,
      corruption,
      negatives: negativeLayer,
      priority,
      endToEnd,
      funnel,
      attribution,
      baselines: baselineResult.report,
      ablations,
      latency,
      cost,
      reproducibility,
      integrity,
      generatedAt: new Date().toISOString(),
    });

    if (report.status !== "COMPLETED") {
      const failed = report.gates.filter((gate) => !gate.passed).map((gate) => `${gate.id}:${gate.name}`);
      throw new Error(`Benchmark gates failed (${failed.join(", ")}); no completed metrics were published.`);
    }

    writeJson(join(tempDir, "final-report.json"), report);
    writeJson(join(tempDir, "scorecard.json"), report.scorecard);
    const finalHashes = hashFiles(tempDir, new Set(["artifact-hashes.json"]));
    writeJson(join(tempDir, "artifact-hashes.json"), {
      run_id: config.run_id,
      algorithm: "sha256",
      generated_at: new Date().toISOString(),
      immutable: true,
      manifest_excludes_itself: true,
      artifact_count: Object.keys(finalHashes).length,
      hashes: finalHashes,
    });

    try {
      renameSync(tempDir, outDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EPERM") throw error;
      cpSync(tempDir, outDir, { recursive: true });
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(join(BENCHMARK_ARTIFACTS, ".."), { recursive: true });
    writeJson(BENCHMARK_LATEST, {
      run_id: config.run_id,
      path: relative(process.cwd(), outDir).replaceAll("\\", "/"),
      status: report.status,
      benchmark_version: report.benchmark_version,
      finalized_at: new Date().toISOString(),
      artifact_hashes: "artifact-hashes.json",
    });

    return {
      run_id: config.run_id,
      output_dir: outDir,
      report,
      scorecard: scorecardLines(report.scorecard),
    };
  } catch (error) {
    if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

export function loadArtifactJson<T>(dir: string, file: string): T {
  return JSON.parse(readFileSync(join(dir, file), "utf8")) as T;
}

export function copyArtifact(source: string, destination: string): void {
  cpSync(source, destination, { recursive: true });
}

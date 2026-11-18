import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { computeBenchmarkHashes, loadBenchmarkBundle } from "@/lib/evaluation/benchmark-bundle";
import { assertFiniteMetrics, computeDetectionMetrics, computeHardNegativePassRate } from "@/lib/evaluation/metrics";
import { matchExtractionEvents } from "@/lib/evaluation/extraction-matching";
import { evaluateGrounding, filterGroundedPredictions } from "@/lib/evaluation/grounding";
import { matchPredictions, normalizeGapType } from "@/lib/evaluation/matching";
import {
  evaluatePriority,
  referencePriorityScore,
  runMetamorphicPriorityTests,
  type PriorityCase,
} from "@/lib/evaluation/priority";
import { classifyExtractionErrors, classifyGapDetectionErrors, summarizeErrors } from "@/lib/evaluation/taxonomy";
import { validateLatencyMetrics } from "@/lib/evaluation/latency";
import { assertBenchmarkValid } from "@/lib/evaluation/validate-benchmark";
import { DATASET_VERSION, EVALUATION_AS_OF_DATE, EVAL_VERSION, type PartitionName } from "@/lib/evaluation/config";
import { PRIORITY_VERSION } from "@/lib/domain/versions";
import type {
  EvaluationReport,
  EvaluationRunMetadata,
  ExtractionMetrics,
  ExtractionPrediction,
  GapPrediction,
  LatencyMetrics,
  PartitionsFile,
} from "@/lib/evaluation/types";

const root = process.cwd();

interface CliOptions {
  partition: PartitionName | "demo";
  predictionsPath: string;
  extractionPredictionsPath: string | null;
  outputDir: string | null;
  runId: string | null;
}

interface PredictionFile {
  predictions: GapPrediction[];
  extraction_predictions?: ExtractionPrediction[];
  latency?: Partial<LatencyMetrics>;
  extractor_version?: string;
  detector_version?: string;
  priority_version?: string;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    partition: "demo",
    predictionsPath: join(root, "artifacts", "eval", "predictions.json"),
    extractionPredictionsPath: null,
    outputDir: null,
    runId: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--partition") {
      const value = argv[index + 1];
      if (value !== "dev" && value !== "final" && value !== "demo") {
        throw new Error("--partition must be dev, final, or demo");
      }
      options.partition = value;
      index += 1;
    } else if (arg === "--predictions") {
      const value = argv[index + 1];
      if (!value) throw new Error("--predictions requires a path");
      options.predictionsPath = value;
      index += 1;
    } else if (arg === "--extraction-predictions") {
      const value = argv[index + 1];
      if (!value) throw new Error("--extraction-predictions requires a path");
      options.extractionPredictionsPath = value;
      index += 1;
    } else if (arg === "--out") {
      const value = argv[index + 1];
      if (!value) throw new Error("--out requires a directory");
      options.outputDir = value;
      index += 1;
    } else if (arg === "--run-id") {
      const value = argv[index + 1];
      if (!value) throw new Error("--run-id requires a value");
      options.runId = value;
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: npm run eval -- --predictions <file> [--partition demo|dev|final] [--extraction-predictions <file>] [--out <dir>] [--run-id <id>]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function gitCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sanitizeRunId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "eval-run";
}

function emptyLatency(): LatencyMetrics {
  return {
    single_patient_p50_ms: null,
    single_patient_p95_ms: null,
    panel_p50_ms: null,
    panel_p95_ms: null,
    live_or_cached: "unknown",
  };
}

function unmeasuredExtraction(goldCount: number): ExtractionMetrics {
  return {
    gold_events: goldCount,
    predicted_events: 0,
    matched_events: 0,
    event_precision: null,
    event_recall: null,
    event_f1: null,
    date_accuracy: null,
    normalization_accuracy: null,
    source_attribution_accuracy: null,
    span_support_rate: null,
    matches: [],
    false_positive_prediction_ids: [],
    false_negative_gold_ids: [],
  };
}

function normalizePredictions(raw: unknown): GapPrediction[] {
  const list = Array.isArray(raw) ? raw : (raw as { predictions?: unknown }).predictions;
  if (!Array.isArray(list)) throw new Error("Predictions file must be an array or contain a predictions array");
  return list.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Prediction ${index} is not an object`);
    const record = item as Record<string, unknown>;
    const gapType = normalizeGapType(record["gap_type"]);
    if (!gapType) throw new Error(`Prediction ${index} has an invalid gap_type`);
    if (typeof record["patient_id"] !== "string") throw new Error(`Prediction ${index} has no patient_id`);
    const predictionId = typeof record["prediction_id"] === "string" ? record["prediction_id"] : `prediction-${index}`;
    return {
      ...record,
      prediction_id: predictionId,
      patient_id: record["patient_id"],
      gap_type: gapType,
      trigger_event_ids: Array.isArray(record["trigger_event_ids"]) ? (record["trigger_event_ids"] as string[]) : [],
      identity: (record["identity"] as GapPrediction["identity"]) ?? {},
      evidence: Array.isArray(record["evidence"]) ? (record["evidence"] as GapPrediction["evidence"]) : [],
      detector_version:
        typeof record["detector_version"] === "string" ? record["detector_version"] : "unknown",
    } as GapPrediction;
  });
}

function partitionPatientIds(partition: PartitionName | "demo", partitions: PartitionsFile): Set<string> | null {
  if (partition === "demo") return null;
  return new Set(partition === "dev" ? partitions.dev : partitions.final);
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(options.predictionsPath)) {
    console.error(`Predictions file not found: ${options.predictionsPath}`);
    console.error("The evaluator does not invent results. Provide detector output with --predictions.");
    process.exit(1);
  }

  const benchmark = loadBenchmarkBundle();
  const validation = assertBenchmarkValid(benchmark, { hashes: computeBenchmarkHashes() });
  for (const warning of validation.warnings) console.warn(`warning: ${warning}`);
  const contracts = benchmark.contracts;
  const partitions = benchmark.partitions;
  const records = benchmark.records;
  const predictionFile = readJson<PredictionFile | GapPrediction[]>(options.predictionsPath);
  const rawPredictions = Array.isArray(predictionFile) ? predictionFile : predictionFile.predictions;
  const predictions = normalizePredictions(rawPredictions);
  const extractionPredictions = options.extractionPredictionsPath
    ? normalizeExtractionPredictions(readJson(options.extractionPredictionsPath))
    : Array.isArray(predictionFile)
      ? null
      : (predictionFile.extraction_predictions ?? null);
  const latency = Array.isArray(predictionFile) ? emptyLatency() : { ...emptyLatency(), ...(predictionFile.latency ?? {}) };
  validateLatencyMetrics(latency);

  const allowedPatients = partitionPatientIds(options.partition, partitions);
  const inPartition = (patientId: string): boolean => allowedPatients === null || allowedPatients.has(patientId);

  const truthGaps = contracts.truth_gaps.filter((gap) => inPartition(gap.patient_id));
  const negatives = contracts.negatives.filter((negative) => inPartition(negative.patient_id));
  const gold = contracts.extraction_gold.filter((event) => inPartition(event.patient_id));
  const selectedPredictions = predictions.filter((prediction) => inPartition(prediction.patient_id));
  const selectedExtraction = extractionPredictions?.filter((event) => inPartition(event.patient_id)) ?? null;

  const grounding = evaluateGrounding(selectedPredictions, records);
  const grounded = filterGroundedPredictions(selectedPredictions, records);
  const effectivePredictions = grounded.displayed;
  const matches = matchPredictions(truthGaps, effectivePredictions);
  const detection = computeDetectionMetrics(truthGaps, effectivePredictions, matches);
  const hardNegatives = computeHardNegativePassRate(negatives, effectivePredictions);
  const extraction = selectedExtraction
    ? matchExtractionEvents(gold, selectedExtraction, { records })
    : unmeasuredExtraction(gold.length);

  const truthByPrediction = new Map(matches.assignments.map((assignment) => [assignment.prediction_id, assignment.truth_gap_id]));
  const priorityCases: PriorityCase[] = effectivePredictions
    .filter((prediction) => typeof prediction.gap_priority_score === "number" && typeof prediction.priority_band === "string")
    .map((prediction) => ({
      gap_id: prediction.prediction_id,
      patient_id: prediction.patient_id,
      gap_type: prediction.gap_type,
      overdue_days: typeof prediction["overdue_days"] === "number" ? prediction["overdue_days"] : 0,
      confidence: typeof prediction.confidence === "number" ? prediction.confidence : 1,
      gap_priority_score: prediction.gap_priority_score as number,
      priority_band: prediction.priority_band as string,
      truth_gap_id: truthByPrediction.get(prediction.prediction_id) ?? null,
    }));
  const priority = evaluatePriority(priorityCases, { score: referencePriorityScore });
  priority.metamorphic_self_check = runMetamorphicPriorityTests(referencePriorityScore).passed;

  const errors = [
    ...classifyGapDetectionErrors(truthGaps, effectivePredictions, matches, grounding.results),
    ...(selectedExtraction
      ? classifyExtractionErrors(
          extraction,
          gold.map((event) => ({ gold_event_id: event.gold_event_id, patient_id: event.patient_id })),
          selectedExtraction.map((event) => ({ event_id: event.event_id, patient_id: event.patient_id })),
        )
      : []),
  ];

  const timestamp = new Date().toISOString();
  const runId = sanitizeRunId(
    options.runId ??
      `eval-${options.partition}-${timestamp.replace(/[-:.]/g, "").slice(0, 15)}-${selectedPredictions.length}`,
  );
  const metadata: EvaluationRunMetadata = {
    run_id: runId,
    timestamp,
    git_commit: gitCommit(),
    dataset_version: DATASET_VERSION,
    eval_version: EVAL_VERSION,
    extractor_version:
      !Array.isArray(predictionFile) && predictionFile.extractor_version ? predictionFile.extractor_version : "unknown",
    detector_version:
      !Array.isArray(predictionFile) && predictionFile.detector_version
        ? predictionFile.detector_version
        : selectedPredictions[0]?.detector_version ?? "unknown",
    priority_version:
      !Array.isArray(predictionFile) && predictionFile.priority_version
        ? predictionFile.priority_version
        : PRIORITY_VERSION,
    partition: options.partition,
    evaluation_as_of_date: EVALUATION_AS_OF_DATE,
  };

  const report: EvaluationReport = {
    status: "completed",
    metadata,
    truth_gaps: truthGaps.length,
    predictions: effectivePredictions.length,
    grounding_suppression: {
      submitted_predictions: selectedPredictions.length,
      displayed_predictions: effectivePredictions.length,
      suppressed_predictions: grounded.suppressed.length,
    },
    gap_detection: detection.per_type,
    macro_f1: detection.macro_f1,
    micro_f1: detection.micro_f1,
    hard_negative_pass_rate: hardNegatives.pass_rate,
    extraction: {
      gold_events: extraction.gold_events,
      predicted_events: extraction.predicted_events,
      matched_events: extraction.matched_events,
      event_precision: extraction.event_precision,
      event_recall: extraction.event_recall,
      event_f1: extraction.event_f1,
      date_accuracy: extraction.date_accuracy,
      normalization_accuracy: extraction.normalization_accuracy,
      source_attribution_accuracy: extraction.source_attribution_accuracy,
      span_support_rate: extraction.span_support_rate,
      false_positive_prediction_ids: extraction.false_positive_prediction_ids,
      false_negative_gold_ids: extraction.false_negative_gold_ids,
    },
    grounding: {
      reported_gaps: grounding.reported_gaps,
      evidence_items: grounding.evidence_items,
      citation_validity: grounding.citation_validity,
      span_support_rate: grounding.span_support_rate,
      grounded_gap_rate: grounding.grounded_gap_rate,
      unsupported_claim_rate: grounding.unsupported_claim_rate,
    },
    priority: {
      checked_gaps: priority.checked_gaps,
      deterministic: priority.deterministic,
      formula_applied: priority.formula_applied,
      confidence_band_cap: priority.confidence_band_cap,
      overdue_monotonicity: priority.overdue_monotonicity,
      metamorphic_self_check: priority.metamorphic_self_check,
      precision_at_5: priority.precision_at_5,
      coverage_at_5: priority.coverage_at_5,
    },
    latency,
    error_summary: summarizeErrors(errors),
  };

  assertFiniteMetrics(report);

  const outDir = options.outputDir ?? join(root, "artifacts", "eval", runId);
  mkdirSync(outDir, { recursive: true });
  writeJson(join(outDir, "metadata.json"), metadata);
  writeJson(join(outDir, "predictions.json"), {
    submitted_predictions: selectedPredictions,
    displayed_predictions: effectivePredictions,
    suppressed_predictions: grounded.suppressed,
  });
  writeJson(join(outDir, "extraction-results.json"), {
    ...report.extraction,
    matches: extraction.matches,
  });
  writeJson(join(outDir, "gap-results.json"), {
    per_type: detection.per_type,
    macro_f1: detection.macro_f1,
    micro_f1: detection.micro_f1,
    assignments: matches.assignments,
    false_positive_prediction_ids: matches.falsePositivePredictionIds,
    duplicate_prediction_ids: matches.duplicatePredictionIds,
    false_negative_truth_ids: matches.falseNegativeTruthIds,
  });
  writeJson(join(outDir, "negative-results.json"), hardNegatives);
  writeJson(join(outDir, "grounding-results.json"), grounding);
  writeJson(join(outDir, "priority-results.json"), priority);
  writeJson(join(outDir, "latency.json"), latency);
  writeJson(join(outDir, "error-cases.json"), errors);
  writeJson(join(outDir, "eval-report.json"), report);

  console.log(`Evaluation complete: ${runId}`);
  console.log(`  partition: ${options.partition} (${truthGaps.length} truth gaps, ${effectivePredictions.length} displayed predictions)`);
  console.log(`  grounding suppression: ${grounded.suppressed.length} of ${selectedPredictions.length}`);
  console.log(`  macro F1: ${report.macro_f1 ?? "not measured"}`);
  console.log(`  hard-negative pass rate: ${report.hard_negative_pass_rate ?? "not measured"}`);
  console.log(`  grounding: ${report.grounding.grounded_gap_rate ?? "not measured"}`);
  console.log(`  artifacts: ${outDir}`);
}

function normalizeExtractionPredictions(raw: unknown): ExtractionPrediction[] {
  const list = Array.isArray(raw) ? raw : (raw as { extraction_predictions?: unknown }).extraction_predictions;
  if (!Array.isArray(list)) throw new Error("Extraction predictions must be an array or contain extraction_predictions");
  return list.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Extraction prediction ${index} is not an object`);
    const record = item as Record<string, unknown>;
    if (typeof record["patient_id"] !== "string") throw new Error(`Extraction prediction ${index} has no patient_id`);
    if (typeof record["event_type"] !== "string") throw new Error(`Extraction prediction ${index} has no event_type`);
    if (typeof record["date"] !== "string") throw new Error(`Extraction prediction ${index} has no date`);
    if (typeof record["source_doc_id"] !== "string") throw new Error(`Extraction prediction ${index} has no source_doc_id`);
    return {
      ...record,
      event_id: typeof record["event_id"] === "string" ? record["event_id"] : `extraction-${index}`,
      patient_id: record["patient_id"],
      event_type: record["event_type"],
      date: record["date"],
      source_doc_id: record["source_doc_id"],
    } as ExtractionPrediction;
  });
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

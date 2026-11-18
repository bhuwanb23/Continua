import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SourceRecord } from "@/lib/domain";
import { DATASET_VERSION, EVAL_VERSION } from "@/lib/domain/versions";
import { matchExtractionEvents } from "@/lib/evaluation/extraction-matching";
import type { ExtractionGoldEvent, ExtractionPrediction } from "@/lib/evaluation/types";

const root = process.cwd();

interface RunMetadata {
  run_id: string;
  partition: "demo" | "dev" | "final";
  extractor: "fixture" | "llm";
  extractor_version: string;
  model_id: string;
  live_or_cached: "live" | "fixture";
  documents: Array<{
    status: "ok" | "failed";
    latency_ms: number;
    live_or_cached: "live" | "cached" | "fixture";
    input_tokens?: number;
    output_tokens?: number;
  }>;
}

interface Rejection {
  code: string;
  stage: string;
  reason: string;
  candidate_event: unknown;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function argValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil(fraction * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank))] ?? null;
}

function rate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function main(): void {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: tsx scripts/eval-extraction.ts --run <artifacts/extraction/run-dir> [--out <dir>]");
    process.exit(0);
  }
  const runDir = argValue("--run");
  if (!runDir) throw new Error("--run <dir> is required (output of scripts/run-extraction.ts)");

  const metadata = readJson<RunMetadata>(join(runDir, "metadata.json"));
  const predictions = readJson<{ extraction_predictions: ExtractionPrediction[] }>(
    join(runDir, "extraction-predictions.json"),
  ).extraction_predictions;
  const rejections = readJson<{ rejections: Rejection[] }>(join(runDir, "rejections.json")).rejections;
  const runPatients = readJson<Array<{ patient_id: string }>>(join(runDir, "patients.json")).map(
    (patient) => patient.patient_id,
  );

  const outDir = argValue("--out") ?? join(runDir, "eval");
  mkdirSync(outDir, { recursive: true });

  // Reuse the frozen Phase 3 evaluator for the artifact contract. Gap
  // predictions are empty: this run measures extraction only.
  const gapPredictionsPath = join(outDir, "gap-predictions.json");
  writeJson(gapPredictionsPath, {
    predictions: [],
    extractor_version: metadata.extractor_version,
    detector_version: "extraction-only",
  });
  execFileSync(
    process.execPath,
    [
      "--import",
      "tsx",
      join(root, "scripts", "eval.ts"),
      "--partition",
      metadata.partition,
      "--predictions",
      gapPredictionsPath,
      "--extraction-predictions",
      join(runDir, "extraction-predictions.json"),
      "--out",
      outDir,
      "--run-id",
      `${metadata.run_id}-eval`,
    ],
    { cwd: root, stdio: "inherit" },
  );

  // Run-scoped metrics: gold restricted to the patients this run extracted.
  // For dev/final this equals the frozen eval scope; for demo it avoids
  // diluting Maria-only output against the full gold set.
  const patientSet = new Set(runPatients);
  const gold = readJson<{ extraction_gold: ExtractionGoldEvent[] }>(
    join(root, "data", "eval-set", EVAL_VERSION, "benchmark-contracts.json"),
  ).extraction_gold.filter((event) => patientSet.has(event.patient_id));
  const records = readJson<{ records: SourceRecord[] }>(
    join(root, "data", "synthetic", DATASET_VERSION, "records.json"),
  ).records.filter((record) => patientSet.has(record.patient_id));
  const scoped = matchExtractionEvents(gold, predictions, { records });

  const goldById = new Map(gold.map((event) => [event.gold_event_id, event]));
  const docTypeByDocId = new Map(records.map((record) => [record.source_doc_id, record.doc_type ?? "unknown"]));

  const difficultyBreakdown: Record<string, { gold: number; matched: number; recall: number | null }> = {};
  const docTypeBreakdown: Record<string, { gold: number; matched: number; recall: number | null }> = {};
  for (const event of gold) {
    const difficulty = (difficultyBreakdown[event.difficulty] ??= { gold: 0, matched: 0, recall: null });
    difficulty.gold += 1;
    const docType = docTypeByDocId.get(event.source_doc_id) ?? "unknown";
    const bucket = (docTypeBreakdown[docType] ??= { gold: 0, matched: 0, recall: null });
    bucket.gold += 1;
  }
  for (const match of scoped.matches) {
    const event = goldById.get(match.gold_event_id);
    if (!event) continue;
    const difficulty = difficultyBreakdown[event.difficulty];
    if (difficulty) difficulty.matched += 1;
    const bucket = docTypeBreakdown[docTypeByDocId.get(event.source_doc_id) ?? "unknown"];
    if (bucket) bucket.matched += 1;
  }
  for (const bucket of [...Object.values(difficultyBreakdown), ...Object.values(docTypeBreakdown)]) {
    bucket.recall = rate(bucket.matched, bucket.gold);
  }

  const exactSpans = predictions.filter((event) => event["verification_method"] === "exact").length;
  const fuzzySpans = predictions.filter((event) => event["verification_method"] === "fuzzy").length;
  const rejectionCodeCounts: Record<string, number> = {};
  for (const rejection of rejections) {
    rejectionCodeCounts[rejection.code] = (rejectionCodeCounts[rejection.code] ?? 0) + 1;
  }

  const normalizationErrorsByDomain = { "EX-07": 0, "EX-08": 0, "EX-09": 0, "EX-04": 0 };
  for (const match of scoped.matches) {
    if (match.normalized_matched !== false) continue;
    const type = goldById.get(match.gold_event_id)?.event_type;
    if (type === "referral" || type === "consult" || type === "followup") normalizationErrorsByDomain["EX-07"] += 1;
    else if (type === "lab_result") normalizationErrorsByDomain["EX-08"] += 1;
    else if (type === "medication_start" || type === "medication_stop") normalizationErrorsByDomain["EX-09"] += 1;
    else normalizationErrorsByDomain["EX-04"] += 1;
  }

  const okDocuments = metadata.documents.filter((document) => document.status === "ok");
  const liveLatencies = metadata.documents
    .filter((document) => document.status === "ok" && document.live_or_cached === "live" && document.latency_ms > 0)
    .map((document) => document.latency_ms);
  const inputTokens = metadata.documents.reduce((sum, document) => sum + (document.input_tokens ?? 0), 0);
  const outputTokens = metadata.documents.reduce((sum, document) => sum + (document.output_tokens ?? 0), 0);
  const hasTokens = metadata.documents.some(
    (document) => document.input_tokens !== undefined || document.output_tokens !== undefined,
  );

  const phase5 = {
    run_id: metadata.run_id,
    partition: metadata.partition,
    extractor: metadata.extractor,
    model_id: metadata.model_id,
    live_or_cached: metadata.live_or_cached,
    scope: "run_patients",
    patients: runPatients.length,
    extraction: {
      gold_events: scoped.gold_events,
      predicted_events: scoped.predicted_events,
      matched_events: scoped.matched_events,
      event_precision: scoped.event_precision,
      event_recall: scoped.event_recall,
      event_f1: scoped.event_f1,
      date_accuracy: scoped.date_accuracy,
      normalization_accuracy: scoped.normalization_accuracy,
      source_attribution_accuracy: scoped.source_attribution_accuracy,
      span_support_rate: scoped.span_support_rate,
    },
    hallucinated_event_rate: rate(scoped.false_positive_prediction_ids.length, scoped.predicted_events),
    span_verification: {
      accepted_events: predictions.length,
      exact: exactSpans,
      fuzzy: fuzzySpans,
      exact_rate: rate(exactSpans, predictions.length),
      fuzzy_rate: rate(fuzzySpans, predictions.length),
      unsupported_span_rejections: rejectionCodeCounts["CE-006"] ?? 0,
    },
    difficulty_breakdown: difficultyBreakdown,
    doc_type_breakdown: docTypeBreakdown,
    rejection_code_counts: rejectionCodeCounts,
    phase5_error_codes: {
      "EX-06": rejectionCodeCounts["CE-006"] ?? 0,
      ...normalizationErrorsByDomain,
      "EX-10": null,
      "EX-11": null,
      "EX-12": null,
      "EX-13": null,
      "EX-14": (rejectionCodeCounts["CE-001"] ?? 0) + (rejectionCodeCounts["CE-002"] ?? 0),
      "EX-15": metadata.documents.filter((document) => document.status === "failed").length,
    },
    phase5_error_notes: {
      "EX-10": "Gold does not declare status fields; not automatically measurable.",
      "EX-11": "Requires manual review; see inspect-extraction-errors.",
      "EX-12": "Requires manual review; see inspect-extraction-errors.",
      "EX-13": "Requires manual review; see inspect-extraction-errors.",
    },
    valid_response_rate: rate(okDocuments.length, metadata.documents.length),
    latency: {
      live_or_cached: metadata.live_or_cached,
      measured_documents: liveLatencies.length,
      document_p50_ms: percentile(liveLatencies, 0.5),
      document_p95_ms: percentile(liveLatencies, 0.95),
    },
    tokens: hasTokens ? { input: inputTokens, output: outputTokens } : null,
    cost_per_patient: null,
    cost_note: "Not measured: no provider price book is configured.",
    frozen_eval_report: join(outDir, "eval-report.json"),
  };

  writeJson(join(runDir, "phase5-metrics.json"), phase5);

  console.log(`Phase 5 extraction metrics: ${metadata.run_id} (${metadata.extractor}/${metadata.model_id})`);
  console.log(
    `  scoped to ${runPatients.length} run patients: gold=${scoped.gold_events} predicted=${scoped.predicted_events} matched=${scoped.matched_events}`,
  );
  console.log(`  precision=${scoped.event_precision ?? "n/a"} recall=${scoped.event_recall ?? "n/a"} f1=${scoped.event_f1 ?? "n/a"}`);
  console.log(`  hallucinated-event rate=${phase5.hallucinated_event_rate ?? "n/a"}`);
  console.log(`  valid-response rate=${phase5.valid_response_rate ?? "n/a"}`);
  console.log(`  latency p50/p95=${phase5.latency.document_p50_ms ?? "n/a"}/${phase5.latency.document_p95_ms ?? "n/a"} ms (${metadata.live_or_cached})`);
  console.log(`  metrics: ${join(runDir, "phase5-metrics.json")}`);
  if (metadata.extractor === "fixture") {
    console.log("  fixture-derived metrics: offline plumbing proof, never model performance.");
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
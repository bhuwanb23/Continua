import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { CanonicalClinicalEvent, LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { canonicalizeClinicalEvents } from "@/lib/clinical-events";
import { EVAL_VERSION } from "@/lib/domain/versions";
import { evaluateGrounding } from "@/lib/evaluation/grounding";
import { computeDetectionMetrics, computeHardNegativePassRate } from "@/lib/evaluation/metrics";
import { matchPredictions } from "@/lib/evaluation/matching";
import { classifyGapDetectionErrors, summarizeErrors } from "@/lib/evaluation/taxonomy";
import type { GapPrediction, NegativeCase, TruthGap } from "@/lib/evaluation/types";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", EVAL_VERSION);

interface DetectorMetadata {
  run_id: string;
  mode: "oracle" | "extracted";
  partition: "demo" | "dev" | "final" | "all";
  patient_ids: string[];
  candidate_count: number;
  detector_version: string;
  policy_version: string;
  evaluation_as_of_date: string;
  runtime_ms: number;
  extracted_path?: string;
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

function eventKey(event: CanonicalClinicalEvent): string {
  const typed = event.typed as unknown as Record<string, unknown>;
  let entity = "";
  if (event.event_type === "referral" || event.event_type === "consult" || event.event_type === "followup") {
    entity = String(typed["specialty_normalized"] ?? "");
  } else if (event.event_type === "lab_result") {
    entity = String(typed["test_code_normalized"] ?? "");
  } else if (event.event_type === "imaging") {
    entity = `${String(typed["modality_normalized"] ?? "")}:${String(typed["body_region_normalized"] ?? "")}`;
  } else if (event.event_type === "medication_start" || event.event_type === "medication_stop") {
    entity = String(typed["drug_normalized"] ?? "");
  } else if (event.event_type === "surgery") {
    entity = String(typed["procedure_normalized"] ?? "");
  }
  return [event.patient_id, event.event_type, event.date, event.source.source_doc_id, entity].join("|");
}

/**
 * Extraction and oracle events have independent deterministic ID schemes. For
 * evaluation only, align extracted occurrences to the frozen truth occurrence
 * with the same patient/type/date/document/normalized identity. Unmatched
 * extracted IDs stay unmatched and therefore count as false positives.
 */
function alignExtractedPredictions(
  predictions: GapPrediction[],
  metadata: DetectorMetadata,
  patientSet: Set<string>,
  records: SourceRecord[],
): GapPrediction[] {
  if (metadata.mode !== "extracted" || !metadata.extracted_path) return predictions;
  const extractedPath = isAbsolute(metadata.extracted_path)
    ? metadata.extracted_path
    : join(root, metadata.extracted_path);
  if (!existsSync(extractedPath)) throw new Error(`Extracted event store not found: ${extractedPath}`);

  const extractedEvents = readJson<{ events: CanonicalClinicalEvent[] }>(extractedPath).events.filter((event) =>
    patientSet.has(event.patient_id),
  );
  const truthEvents = readJson<{ events: LegacyClinicalEvent[] }>(
    join(root, "data", "generator", "truth-events", "truth-events.json"),
  ).events.filter((event) => patientSet.has(event.patient_id));

  const truthByPatient = new Map<string, LegacyClinicalEvent[]>();
  for (const event of truthEvents) {
    const list = truthByPatient.get(event.patient_id) ?? [];
    list.push(event);
    truthByPatient.set(event.patient_id, list);
  }
  const oracleEvents: CanonicalClinicalEvent[] = [];
  for (const [patientId, events] of truthByPatient) {
    const patientRecords = records.filter((record) => record.patient_id === patientId);
    const result = canonicalizeClinicalEvents(events, {
      patient_id: patientId,
      records: patientRecords,
      extractor_version: "truth-events-v1",
    });
    oracleEvents.push(...result.accepted);
  }

  const truthIdsByKey = new Map<string, string[]>();
  for (const event of oracleEvents) {
    const key = eventKey(event);
    const list = truthIdsByKey.get(key) ?? [];
    list.push(event.event_id);
    truthIdsByKey.set(key, list.sort());
  }
  for (const ids of truthIdsByKey.values()) ids.sort();

  const idMap = new Map<string, string>();
  for (const event of [...extractedEvents].sort((left, right) => left.event_id.localeCompare(right.event_id))) {
    const candidates = truthIdsByKey.get(eventKey(event));
    const match = candidates?.shift();
    if (match) idMap.set(event.event_id, match);
  }

  return predictions.map((prediction) => {
    const triggerIds = prediction.trigger_event_ids.map((id) => idMap.get(id) ?? id);
    const identityEventIds = Array.isArray(prediction.identity.event_ids)
      ? prediction.identity.event_ids.map((id) => idMap.get(id) ?? id)
      : undefined;
    return {
      ...prediction,
      trigger_event_ids: triggerIds,
      identity: identityEventIds
        ? { ...prediction.identity, event_ids: identityEventIds }
        : prediction.identity,
    };
  });
}

function main(): void {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: tsx scripts/eval-detectors.ts --run <artifacts/detectors/run-dir> [--out <dir>]");
    process.exit(0);
  }
  const runDir = argValue("--run");
  if (!runDir) throw new Error("--run <dir> is required (output of scripts/run-detectors.ts)");
  if (!existsSync(runDir)) throw new Error(`Detector run not found: ${runDir}`);

  const metadata = readJson<DetectorMetadata>(join(runDir, "metadata.json"));
  const rawPredictions = readJson<{ predictions: GapPrediction[] }>(join(runDir, "predictions.json")).predictions;
  const contracts = readJson<{ truth_gaps: TruthGap[]; negatives: NegativeCase[] }>(
    join(evalDir, "benchmark-contracts.json"),
  );
  const records = readJson<{ records: SourceRecord[] }>(join(datasetDir, "records.json")).records;
  const patientSet = new Set(metadata.patient_ids);
  const truthGaps = contracts.truth_gaps.filter((gap) => patientSet.has(gap.patient_id));
  const negatives = contracts.negatives.filter((negative) => patientSet.has(negative.patient_id));
  const scopedRecords = records.filter((record) => patientSet.has(record.patient_id));
  const predictions = alignExtractedPredictions(rawPredictions, metadata, patientSet, scopedRecords);

  const matches = matchPredictions(truthGaps, predictions);
  const metrics = computeDetectionMetrics(truthGaps, predictions, matches);
  const hardNegatives = computeHardNegativePassRate(negatives, predictions);
  const grounding = evaluateGrounding(predictions, scopedRecords);
  const errors = classifyGapDetectionErrors(truthGaps, predictions, matches, grounding.results);
  const errorSummary = summarizeErrors(errors);

  const targets = metadata.mode === "oracle"
    ? { precision: 0.95, recall: 0.95, macro_f1: 0.95, hard_negative: 0.95 }
    : { precision: 0.8, recall: 0.7, macro_f1: 0.75, hard_negative: 0.9 };
  const perTypeTargetsMet = Object.values(metrics.per_type).map((type) => ({
    precision: type.precision !== null && type.precision >= targets.precision,
    recall: type.recall !== null && type.recall >= targets.recall,
  }));

  const result = {
    run_id: metadata.run_id,
    mode: metadata.mode,
    partition: metadata.partition,
    detector_version: metadata.detector_version,
    policy_version: metadata.policy_version,
    evaluation_as_of_date: metadata.evaluation_as_of_date,
    scope: {
      patients: metadata.patient_ids.length,
      truth_gaps: truthGaps.length,
      hard_negatives: negatives.length,
      predictions: predictions.length,
    },
    metrics: {
      per_type: metrics.per_type,
      macro_f1: metrics.macro_f1,
      micro_f1: metrics.micro_f1,
      true_positives: metrics.true_positives,
      false_positives: metrics.false_positives,
      false_negatives: metrics.false_negatives,
    },
    hard_negatives: hardNegatives,
    grounding: {
      reported_gaps: grounding.reported_gaps,
      evidence_items: grounding.evidence_items,
      citation_validity: grounding.citation_validity,
      span_support_rate: grounding.span_support_rate,
      grounded_gap_rate: grounding.grounded_gap_rate,
      unsupported_claim_rate: grounding.unsupported_claim_rate,
    },
    quality: {
      candidates_per_patient:
        metadata.patient_ids.length === 0 ? null : predictions.length / metadata.patient_ids.length,
      duplicate_predictions: matches.duplicatePredictionIds.length,
      determinism: "covered_by_detector_tests",
      llm_calls: 0,
      raw_text_reads: 0,
    },
    targets,
    targets_met: {
      precision_per_type: perTypeTargetsMet.every((entry) => entry.precision),
      recall_per_type: perTypeTargetsMet.every((entry) => entry.recall),
      macro_f1: metrics.macro_f1 !== null && metrics.macro_f1 >= targets.macro_f1,
      hard_negatives:
        hardNegatives.pass_rate !== null && hardNegatives.pass_rate >= targets.hard_negative,
    },
    error_summary: errorSummary,
  };

  const outDir = argValue("--out") ?? runDir;
  mkdirSync(outDir, { recursive: true });
  writeJson(join(outDir, "eval-results.json"), result);
  writeJson(join(outDir, "error-cases.json"), { errors });

  console.log(`Detector evaluation: ${metadata.run_id} (${metadata.mode}/${metadata.partition})`);
  console.log(
    `  truth=${truthGaps.length} predictions=${predictions.length} TP=${metrics.true_positives} FP=${metrics.false_positives} FN=${metrics.false_negatives}`,
  );
  console.log(
    `  macro_f1=${metrics.macro_f1 ?? "n/a"} micro_f1=${metrics.micro_f1 ?? "n/a"} hard_negative=${hardNegatives.pass_rate ?? "n/a"}`,
  );
  console.log(`  results: ${join(outDir, "eval-results.json")}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

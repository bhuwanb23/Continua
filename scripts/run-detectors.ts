import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import type { CanonicalClinicalEvent, LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { DETECTOR_VERSION, EVALUATION_AS_OF_DATE, GAP_POLICY_VERSION } from "@/lib/domain";
import { canonicalizeClinicalEvents, hashClinicalEvents } from "@/lib/clinical-events";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import { candidatesToPredictions } from "./lib/detector-predictions";

const root = process.cwd();
const datasetDir = join(root, "data", "synthetic", "continua-synth-v1");
const evalDir = join(root, "data", "eval-set", "continua-eval-v1");
const truthPath = join(root, "data", "generator", "truth-events", "truth-events.json");

type Mode = "oracle" | "extracted";
type Partition = "demo" | "dev" | "final" | "all";

interface Options {
  mode: Mode;
  partition: Partition;
  extractedPath: string | null;
  outputDir: string | null;
  runId: string | null;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sanitizeRunId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "detector-run";
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    mode: "oracle",
    partition: "final",
    extractedPath: null,
    outputDir: null,
    runId: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--mode") {
      if (next !== "oracle" && next !== "extracted") throw new Error("--mode must be oracle or extracted");
      options.mode = next;
      index += 1;
    } else if (arg === "--partition") {
      if (next !== "demo" && next !== "dev" && next !== "final" && next !== "all") {
        throw new Error("--partition must be demo, dev, final, or all");
      }
      options.partition = next;
      index += 1;
    } else if (arg === "--extracted") {
      if (!next) throw new Error("--extracted requires a path");
      options.extractedPath = next;
      index += 1;
    } else if (arg === "--out") {
      if (!next) throw new Error("--out requires a directory");
      options.outputDir = next;
      index += 1;
    } else if (arg === "--run-id") {
      if (!next) throw new Error("--run-id requires a value");
      options.runId = next;
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: tsx scripts/run-detectors.ts --mode oracle|extracted --partition demo|dev|final|all [--extracted <canonical-events.json>] [--out <dir>] [--run-id <id>]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (options.mode === "extracted" && !options.extractedPath) {
    throw new Error("--extracted <canonical-events.json> is required for extracted mode");
  }
  return options;
}

function selectPatientIds(partition: Partition): string[] {
  const patients = readJson<{ patients: Array<{ patient_id: string; fixture_key: string }> }>(
    join(datasetDir, "patients.json"),
  ).patients;
  if (partition === "all") return patients.map((patient) => patient.patient_id);
  if (partition === "demo") {
    const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
    if (!maria) throw new Error("Maria is missing from the synthetic panel");
    return [maria.patient_id];
  }
  const partitions = readJson<{ dev: string[]; final: string[] }>(join(evalDir, "partitions.json"));
  return partition === "dev" ? partitions.dev : partitions.final;
}

function loadOracleEvents(patientIds: Set<string>): CanonicalClinicalEvent[] {
  const records = readJson<{ records: SourceRecord[] }>(join(datasetDir, "records.json")).records;
  const truth = readJson<{ events: LegacyClinicalEvent[] }>(truthPath).events.filter((event) =>
    patientIds.has(event.patient_id),
  );
  const byPatient = new Map<string, LegacyClinicalEvent[]>();
  for (const event of truth) {
    const list = byPatient.get(event.patient_id) ?? [];
    list.push(event);
    byPatient.set(event.patient_id, list);
  }

  const accepted: CanonicalClinicalEvent[] = [];
  for (const [patientId, events] of byPatient) {
    const patientRecords = records.filter((record) => record.patient_id === patientId);
    const result = canonicalizeClinicalEvents(events, {
      patient_id: patientId,
      records: patientRecords,
      extractor_version: "truth-events-v1",
    });
    if (result.rejected.length > 0) {
      throw new Error(`Oracle canonicalization rejected ${result.rejected.length} events for ${patientId}`);
    }
    accepted.push(...result.accepted);
  }
  return accepted;
}

function loadExtractedEvents(path: string, patientIds: Set<string>): CanonicalClinicalEvent[] {
  if (!existsSync(path)) throw new Error(`Extracted event store not found: ${path}`);
  const events = readJson<{ events: CanonicalClinicalEvent[] }>(path).events;
  return events.filter((event) => patientIds.has(event.patient_id));
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const patientIds = selectPatientIds(options.partition);
  const patientSet = new Set(patientIds);
  const events = options.mode === "oracle"
    ? loadOracleEvents(patientSet)
    : loadExtractedEvents(options.extractedPath!, patientSet);

  const timestamp = new Date().toISOString();
  const runId = sanitizeRunId(
    options.runId ?? `gaps-${options.mode}-${options.partition}-${timestamp.replace(/[-:.]/g, "").slice(0, 15)}`,
  );
  const outDir = options.outputDir ?? join(root, "artifacts", "detectors", runId);
  const context = createDetectionContext(EVALUATION_AS_OF_DATE);

  const started = performance.now();
  const candidates = detectCandidateGaps(events, context);
  const runtimeMs = performance.now() - started;
  const predictions = candidatesToPredictions(candidates);
  const inputHash = hashClinicalEvents(events);
  const candidateHash = createHash("sha256")
    .update(JSON.stringify(candidates.map((candidate) => candidate.gap_id)))
    .digest("hex");

  const metadata = {
    run_id: runId,
    timestamp,
    mode: options.mode,
    partition: options.partition,
    detector_version: DETECTOR_VERSION,
    policy_version: GAP_POLICY_VERSION,
    evaluation_as_of_date: EVALUATION_AS_OF_DATE,
    patient_count: patientIds.length,
    patient_ids: [...patientIds].sort(),
    event_count: events.length,
    candidate_count: candidates.length,
    predictions_count: predictions.length,
    runtime_ms: runtimeMs,
    llm_calls: 0,
    raw_text_reads: 0,
    input_event_hash: inputHash,
    candidate_id_hash: candidateHash,
    ...(options.mode === "extracted" ? { extracted_path: options.extractedPath } : {}),
  };

  mkdirSync(outDir, { recursive: true });
  writeJson(join(outDir, "metadata.json"), metadata);
  writeJson(join(outDir, "candidates.json"), { candidates });
  writeJson(join(outDir, "predictions.json"), { predictions });
  writeJson(join(outDir, "summary.json"), {
    run_id: runId,
    mode: options.mode,
    partition: options.partition,
    patients: patientIds.length,
    events: events.length,
    candidates: candidates.length,
    candidates_per_patient: patientIds.length === 0 ? null : candidates.length / patientIds.length,
    by_type: {
      missed_followup: candidates.filter((candidate) => candidate.gap_type === "missed_followup").length,
      duplicate_test: candidates.filter((candidate) => candidate.gap_type === "duplicate_test").length,
      med_monitoring: candidates.filter((candidate) => candidate.gap_type === "med_monitoring").length,
    },
    runtime_ms: runtimeMs,
    llm_calls: 0,
    raw_text_reads: 0,
  });

  console.log(`Detector run complete: ${runId}`);
  console.log(
    `  mode=${options.mode} partition=${options.partition} patients=${patientIds.length} events=${events.length}`,
  );
  console.log(`  candidates=${candidates.length} runtime=${runtimeMs.toFixed(2)}ms llm_calls=0`);
  console.log(`  artifacts: ${outDir}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

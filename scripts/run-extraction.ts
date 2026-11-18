import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import {
  CLINICAL_EVENT_SCHEMA_VERSION,
  DATASET_VERSION,
  EVALUATION_AS_OF_DATE,
  EVAL_VERSION,
  NORMALIZATION_VERSION,
} from "@/lib/domain/versions";
import { loadEnv } from "@/lib/config/env";
import { extractPanel } from "@/lib/extraction/batch";
import { CANDIDATE_SCHEMA_VERSION } from "@/lib/extraction/candidate-event";
import type { ClinicalEventDocumentExtractor } from "@/lib/extraction/extractor";
import { FixtureDocumentExtractor } from "@/lib/extraction/fixture-extractor";
import { flattenCanonicalEvents } from "@/lib/extraction/flatten";
import { LlmDocumentExtractor } from "@/lib/extraction/llm-extractor";
import { createLlmProvider } from "@/lib/extraction/provider";
import { PROMPT_VERSION } from "@/lib/extraction/prompt-version";
import { RECONCILIATION_VERSION } from "@/lib/reconciliation";
import { truthEventsToCandidates } from "./lib/truth-candidates";

const root = process.cwd();

interface CliOptions {
  partition: "demo" | "dev" | "final";
  extractor: "fixture" | "llm";
  model: string | null;
  runId: string | null;
  outputDir: string | null;
  redTeam: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    partition: "demo",
    extractor: "fixture",
    model: null,
    runId: null,
    outputDir: null,
    redTeam: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--partition") {
      if (next !== "demo" && next !== "dev" && next !== "final") {
        throw new Error("--partition must be demo, dev, or final");
      }
      options.partition = next;
      index += 1;
    } else if (arg === "--extractor") {
      if (next !== "fixture" && next !== "llm") throw new Error("--extractor must be fixture or llm");
      options.extractor = next;
      index += 1;
    } else if (arg === "--model") {
      if (!next) throw new Error("--model requires a value");
      options.model = next;
      index += 1;
    } else if (arg === "--run-id") {
      if (!next) throw new Error("--run-id requires a value");
      options.runId = next;
      index += 1;
    } else if (arg === "--out") {
      if (!next) throw new Error("--out requires a directory");
      options.outputDir = next;
      index += 1;
    } else if (arg === "--red-team") {
      options.redTeam = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: tsx scripts/run-extraction.ts [--partition demo|dev|final] [--extractor fixture|llm] [--model <id>] [--run-id <id>] [--out <dir>] [--red-team]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (options.redTeam && options.partition !== "dev") {
    throw new Error("--red-team is only allowed on the dev partition; never on final or demo.");
  }
  return options;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function gitCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function sanitizeRunId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "extraction-run";
}

function selectPatientIds(partition: CliOptions["partition"]): string[] {
  if (partition === "demo") {
    const patients = readJson<{ patients: Array<{ patient_id: string; fixture_key: string }> }>(
      join(root, "data", "synthetic", DATASET_VERSION, "patients.json"),
    ).patients;
    const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
    if (!maria) throw new Error("Maria is missing from the synthetic panel");
    return [maria.patient_id];
  }
  const partitions = readJson<{ dev: string[]; final: string[] }>(
    join(root, "data", "eval-set", EVAL_VERSION, "partitions.json"),
  );
  return partition === "dev" ? partitions.dev : partitions.final;
}

function buildExtractor(options: CliOptions): { extractor: ClinicalEventDocumentExtractor; temperature: number | null } {
  if (options.extractor === "fixture") {
    const patientIds = new Set(selectPatientIds(options.partition));
    const truth = readJson<{ events: LegacyClinicalEvent[] }>(
      join(root, "data", "generator", "truth-events", "truth-events.json"),
    ).events;
    const conversion = truthEventsToCandidates(truth.filter((event) => patientIds.has(event.patient_id)));
    if (conversion.skipped.length > 0) {
      console.warn(`Skipped ${conversion.skipped.length} truth events during candidate conversion.`);
    }
    return { extractor: new FixtureDocumentExtractor(conversion.fixtures), temperature: null };
  }
  const config = loadEnv(options.model ? { ...process.env, LLM_MODEL: options.model } : process.env);
  const extractor = new LlmDocumentExtractor(createLlmProvider(config), {
    temperature: config.llmTemperature,
    maxOutputTokens: config.llmMaxOutputTokens,
    timeoutMs: config.llmTimeoutMs,
  });
  return { extractor, temperature: config.llmTemperature };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const patientIds = selectPatientIds(options.partition);
  const records = readJson<{ records: SourceRecord[] }>(
    join(root, "data", "synthetic", DATASET_VERSION, "records.json"),
  ).records;
  const { extractor, temperature } = buildExtractor(options);
  const config = loadEnv(process.env);

  const timestamp = new Date().toISOString();
  const runId = sanitizeRunId(
    options.runId ??
      `extract-${options.partition}-${options.extractor}-${timestamp.replace(/[-:.]/g, "").slice(0, 15)}`,
  );
  const outDir = options.outputDir ?? join(root, "artifacts", "extraction", runId);

  // Benchmark runs never read or write the cache: every result is measured.
  const panel = patientIds.map((patientId) => ({
    patient_id: patientId,
    records: records.filter((record) => record.patient_id === patientId),
  }));

  let redTeamInfo: { target_patient_id: string; attack_document_ids: string[] } | null = null;
  if (options.redTeam) {
    const target = panel[0];
    if (!target) throw new Error("Red-team run requires at least one dev patient");
    const attackDocs = readJson<{ documents: SourceRecord[] }>(
      join(root, "data", "fixtures", "red-team", "attack-docs.json"),
    ).documents;
    const rebound = attackDocs.map((document) => ({ ...document, patient_id: target.patient_id }));
    target.records.push(...rebound);
    redTeamInfo = {
      target_patient_id: target.patient_id,
      attack_document_ids: rebound.map((document) => document.source_doc_id),
    };
  }

  const results = await extractPanel(extractor, panel, { concurrency: config.llmConcurrency });

  const documents = results.flatMap((result) => result.documents.map((outcome) => outcome.metadata));
  const accepted = results.flatMap((result) => result.store.accepted);
  const rejected = results.flatMap((result) => result.store.rejected);
  const statusCounts = {
    COMPLETE: results.filter((result) => result.status === "COMPLETE").length,
    PARTIAL: results.filter((result) => result.status === "PARTIAL").length,
    FAILED: results.filter((result) => result.status === "FAILED").length,
  };

  const metadata = {
    run_id: runId,
    timestamp,
    git_commit: gitCommit(),
    partition: options.partition,
    extractor: options.extractor,
    extractor_version: extractor.version,
    model_id: extractor.modelId,
    prompt_version: PROMPT_VERSION,
    candidate_schema_version: CANDIDATE_SCHEMA_VERSION,
    clinical_event_schema: CLINICAL_EVENT_SCHEMA_VERSION,
    normalization_version: NORMALIZATION_VERSION,
    reconciliation_version: RECONCILIATION_VERSION,
    dataset_version: DATASET_VERSION,
    eval_version: EVAL_VERSION,
    evaluation_as_of_date: EVALUATION_AS_OF_DATE,
    temperature,
    max_output_tokens: options.extractor === "llm" ? config.llmMaxOutputTokens : null,
    timeout_ms: options.extractor === "llm" ? config.llmTimeoutMs : null,
    retry_policy: { max_attempts: 3, base_delay_ms: 500, backoff: "exponential" },
    concurrency: config.llmConcurrency,
    live_or_cached: options.extractor === "llm" ? "live" : "fixture",
    red_team: redTeamInfo,
    patient_count: results.length,
    document_count: documents.length,
    status_counts: statusCounts,
    documents,
  };

  mkdirSync(outDir, { recursive: true });
  writeJson(join(outDir, "metadata.json"), metadata);
  writeJson(join(outDir, "patients.json"), results.map((result) => ({
    patient_id: result.patient_id,
    status: result.status,
    document_count: result.documents.length,
    accepted_event_count: result.store.accepted.length,
    rejected_event_count: result.store.rejected.length,
  })));
  writeJson(join(outDir, "candidates.json"), {
    candidates: results.flatMap((result) =>
      result.documents.flatMap((outcome) =>
        outcome.candidates.map((candidate) => ({ patient_id: result.patient_id, ...candidate })),
      ),
    ),
  });
  writeJson(join(outDir, "canonical-events.json"), { events: accepted });
  writeJson(join(outDir, "rejections.json"), { rejections: rejected });
  writeJson(join(outDir, "reconciliation-ledger.json"), {
    reconciliation_version: RECONCILIATION_VERSION,
    patients: results.map((result) => ({ patient_id: result.patient_id, ...result.ledger })),
  });
  writeJson(join(outDir, "errors.json"), {
    failed_documents: results.flatMap((result) =>
      result.documents
        .filter((outcome) => outcome.status === "failed")
        .map((outcome) => ({
          patient_id: result.patient_id,
          document_id: outcome.document_id,
          attempt_count: outcome.metadata.attempt_count,
          error: outcome.error ?? outcome.metadata.error ?? "unknown",
        })),
    ),
  });
  writeJson(join(outDir, "extraction-predictions.json"), {
    extraction_predictions: flattenCanonicalEvents(accepted),
  });

  console.log(`Extraction run complete: ${runId}`);
  console.log(
    `  partition=${options.partition} extractor=${options.extractor} model=${extractor.modelId} patients=${results.length}`,
  );
  console.log(
    `  COMPLETE=${statusCounts.COMPLETE} PARTIAL=${statusCounts.PARTIAL} FAILED=${statusCounts.FAILED}`,
  );
  console.log(`  accepted=${accepted.length} rejected=${rejected.length}`);
  console.log(`  artifacts: ${outDir}`);
  if (options.extractor === "fixture") {
    console.log("  fixture-derived output: offline plumbing proof, never model performance.");
  }
  if (redTeamInfo) {
    console.log(
      `  red-team: ${redTeamInfo.attack_document_ids.length} attack documents bound to dev patient ${redTeamInfo.target_patient_id}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
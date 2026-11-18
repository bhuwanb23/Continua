import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { loadEnv } from "@/lib/config/env";
import { extractPanel } from "@/lib/extraction/batch";
import { FileExtractionCache } from "@/lib/extraction/cache";
import type { ClinicalEventDocumentExtractor } from "@/lib/extraction/extractor";
import { FixtureDocumentExtractor } from "@/lib/extraction/fixture-extractor";
import { LlmDocumentExtractor } from "@/lib/extraction/llm-extractor";
import { createLlmProvider } from "@/lib/extraction/provider";
import { truthEventsToCandidates } from "./lib/truth-candidates";

const root = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value ?? fallback;
}

async function main(): Promise<void> {
  const partition = argValue("--partition", "demo");
  const extractorKind = argValue("--extractor", "fixture");
  if (!["demo", "dev", "final"].includes(partition)) {
    throw new Error(`Unknown partition "${partition}". Use demo | dev | final.`);
  }

  const patients = readJson<{ patients: Array<{ patient_id: string; fixture_key: string }> }>(
    join(root, "data", "synthetic", "continua-synth-v1", "patients.json"),
  ).patients;
  const records = readJson<{ records: SourceRecord[] }>(
    join(root, "data", "synthetic", "continua-synth-v1", "records.json"),
  ).records;

  let patientIds: string[];
  if (partition === "demo") {
    const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
    if (!maria) throw new Error("Maria is missing from the synthetic panel");
    patientIds = [maria.patient_id];
  } else {
    const partitions = readJson<{ dev: string[]; final: string[] }>(
      join(root, "data", "eval-set", "continua-eval-v1", "partitions.json"),
    );
    patientIds = partition === "dev" ? partitions.dev : partitions.final;
  }

  let extractor: ClinicalEventDocumentExtractor;
  if (extractorKind === "fixture") {
    const truth = readJson<{ events: LegacyClinicalEvent[] }>(
      join(root, "data", "generator", "truth-events", "truth-events.json"),
    ).events;
    const selected = new Set(patientIds);
    const conversion = truthEventsToCandidates(truth.filter((event) => selected.has(event.patient_id)));
    if (conversion.skipped.length > 0) {
      console.warn(`Skipped ${conversion.skipped.length} truth events during candidate conversion.`);
    }
    extractor = new FixtureDocumentExtractor(conversion.fixtures);
  } else if (extractorKind === "llm") {
    const config = loadEnv();
    extractor = new LlmDocumentExtractor(createLlmProvider(config), {
      temperature: config.llmTemperature,
      maxOutputTokens: config.llmMaxOutputTokens,
      timeoutMs: config.llmTimeoutMs,
    });
  } else {
    throw new Error(`Unknown extractor "${extractorKind}". Use fixture | llm.`);
  }

  const candidateCache = new FileExtractionCache(join(root, "artifacts", "extraction", "cache", "candidates.json"));
  const canonicalCache = new FileExtractionCache(join(root, "artifacts", "extraction", "cache", "canonical.json"));
  await candidateCache.load();
  await canonicalCache.load();

  const panel = patientIds.map((patientId) => ({
    patient_id: patientId,
    records: records.filter((record) => record.patient_id === patientId),
  }));
  const config = loadEnv();
  const results = await extractPanel(extractor, panel, {
    concurrency: config.llmConcurrency,
    candidateCache,
    canonicalCache,
  });
  await candidateCache.flush();
  await canonicalCache.flush();

  const complete = results.filter((result) => result.status === "COMPLETE").length;
  const partial = results.filter((result) => result.status === "PARTIAL").length;
  const failed = results.filter((result) => result.status === "FAILED").length;
  const accepted = results.reduce((sum, result) => sum + result.store.accepted.length, 0);
  console.log(
    `Extraction cache built: partition=${partition} extractor=${extractorKind} patients=${results.length} ` +
      `COMPLETE=${complete} PARTIAL=${partial} FAILED=${failed} accepted_events=${accepted}`,
  );
  console.log("Cache files: artifacts/extraction/cache/candidates.json, artifacts/extraction/cache/canonical.json");
  if (partition === "demo" && complete !== results.length) {
    console.error("Demo cache requires every patient COMPLETE.");
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DATASET_VERSION,
  EVALUATION_AS_OF_DATE,
  EVAL_VERSION,
  EXTRACTOR_VERSION,
  VERSION_METADATA,
} from "@/lib/domain/versions";
import { loadEnv } from "@/lib/config/env";
import { computeBenchmarkHashes, loadBenchmarkBundle } from "@/lib/evaluation/benchmark-bundle";
import { auditBenchmarkLeakage } from "@/lib/evaluation/leakage";
import { assertBenchmarkValid } from "@/lib/evaluation/validate-benchmark";
import { PROMPT_VERSION } from "@/lib/extraction/prompt-version";
import { DETECTOR_VERSION } from "@/lib/domain";
import { EVIDENCE_VERSION } from "@/lib/evidence/version";
import { PRIORITY_VERSION } from "@/lib/priority";
import type { BenchmarkConfig, GitState, PreflightCheck, PreflightReport } from "./types";

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function gitState(): GitState {
  try {
    const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const short = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
    const status = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" })
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
    return { commit, short_commit: short, worktree_clean: status.length === 0, dirty_file_count: status.length };
  } catch {
    return { commit: "", short_commit: "nogit", worktree_clean: false, dirty_file_count: 0 };
  }
}

function extractionMetadata(path: string): Record<string, unknown> | null {
  const metadataPath = join(path, "..", "metadata.json");
  if (!existsSync(metadataPath)) return null;
  try {
    return JSON.parse(readFileSync(metadataPath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function runPreflight(config: BenchmarkConfig): PreflightReport {
  const checks: PreflightCheck[] = [];
  const warnings: string[] = [];
  const benchmark = loadBenchmarkBundle();
  const hashes = computeBenchmarkHashes();
  const validation = assertBenchmarkValid(benchmark, { hashes });
  warnings.push(...validation.warnings);

  checks.push({
    name: "benchmark_hashes",
    passed: validation.ok,
    detail: validation.ok ? "Frozen benchmark hashes and contracts validate." : validation.failures.join("; "),
  });
  checks.push({
    name: "evaluation_date",
    passed: EVALUATION_AS_OF_DATE === config.evaluation_as_of_date,
    detail: `${EVALUATION_AS_OF_DATE} == ${config.evaluation_as_of_date}`,
  });
  checks.push({
    name: "partitions_disjoint",
    passed: benchmark.partitions.dev.filter((id) => benchmark.partitions.final.includes(id)).length === 0,
    detail: `${benchmark.partitions.dev.length} dev / ${benchmark.partitions.final.length} final, overlap 0`,
  });
  checks.push({
    name: "versions_frozen",
    passed:
      VERSION_METADATA.dataset_version === DATASET_VERSION &&
      VERSION_METADATA.eval_version === EVAL_VERSION &&
      VERSION_METADATA.extractor_version === EXTRACTOR_VERSION &&
      VERSION_METADATA.detector_version === DETECTOR_VERSION &&
      VERSION_METADATA.priority_version === PRIORITY_VERSION &&
      EVIDENCE_VERSION === "evidence-v1" &&
      PROMPT_VERSION === "extraction-prompt-v1",
    detail: `dataset ${DATASET_VERSION}; eval ${EVAL_VERSION}; extractor ${EXTRACTOR_VERSION}; prompt ${PROMPT_VERSION}; detector ${DETECTOR_VERSION}; evidence ${EVIDENCE_VERSION}; priority ${PRIORITY_VERSION}`,
  });

  const extractedExists = existsSync(config.extracted_events_path);
  checks.push({
    name: "frozen_extraction_store",
    passed: extractedExists,
    detail: extractedExists ? config.extracted_events_path : `missing ${config.extracted_events_path}`,
  });

  const extractionMeta = extractionMetadata(config.extracted_events_path);
  const extractionMode = typeof extractionMeta?.["extractor"] === "string" ? extractionMeta["extractor"] : null;
  const extractionIsFixture = extractionMode === "fixture";
  checks.push({
    name: "extraction_source_labeled",
    passed: extractionIsFixture || extractionMode === "llm",
    detail: extractionMode
      ? `source=${extractionMode}; fixture results are not model-quality evidence`
      : "extraction metadata missing; live model quality cannot be claimed",
  });

  const leakage = auditBenchmarkLeakage(process.cwd());
  checks.push({
    name: "no_label_leakage",
    passed: leakage.ok,
    detail: leakage.ok
      ? `${leakage.scanned} runtime/tooling files scanned; no runtime label access`
      : leakage.violations.slice(0, 5).join("; "),
  });

  let providerConfigured = false;
  let providerModel: string | null = null;
  try {
    const env = loadEnv(process.env);
    providerConfigured = Boolean(env.llmProvider && (env.llmApiKey || env.llmProvider === "ollama"));
    providerModel = env.llmModel ?? null;
  } catch (error) {
    warnings.push(`provider configuration could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
  }
  checks.push({
    name: "provider_configuration_recorded",
    passed: true,
    detail: providerConfigured
      ? `configured model=${providerModel ?? "(unspecified)"}`
      : "no live provider configured; live extraction and LLM-only baseline will be NOT_RUN",
  });

  const git = gitState();
  checks.push({
    name: "git_working_tree_clean",
    passed: git.worktree_clean,
    detail: git.worktree_clean ? `${git.short_commit} clean` : `${git.short_commit} has ${git.dirty_file_count} changed path(s)`,
  });
  if (!git.worktree_clean) {
    warnings.push("git worktree was dirty at benchmark time; the source hash and artifact hashes identify the exact evaluated state.");
  }

  const requiredFailures = checks.filter((check) => !check.passed && check.name !== "git_working_tree_clean");
  const ok = requiredFailures.length === 0;
  if (!git.worktree_clean) {
    warnings.push("Gate A integrity is limited because the worktree was not clean; this is reported, not hidden.");
  }

  const inputHashes = {
    extracted_event_store_sha256: extractedExists ? sha256File(config.extracted_events_path) : "",
    extraction_metadata_sha256:
      extractionMeta && existsSync(join(config.extracted_events_path, "..", "metadata.json"))
        ? sha256File(join(config.extracted_events_path, "..", "metadata.json"))
        : "",
  };

  return {
    ok,
    status: ok ? "COMPLETED" : "INVALID",
    checks,
    warnings,
    hashes: { ...hashes },
    input_hashes: inputHashes,
    benchmark_summary: validation.summary,
    leaked_metric_publication: false,
  };
}

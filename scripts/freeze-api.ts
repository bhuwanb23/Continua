import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { openApiJson } from "@/lib/api/openapi";
import { runApiAudit } from "./lib/api-cli";

const ROOT = process.cwd();

function walk(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (/\.(ts|json|md)$/.test(entry.name)) out.push(path);
  }
  return out;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

async function main() {
  process.env.CONTINUA_API_LOG = "off";
  const audit = await runApiAudit();

  console.info("CONTINUA API v1 — validation\n");
  for (const check of audit.checks) {
    console.info(`${check.passed ? "PASS" : "FAIL"}  ${check.name.padEnd(26)} ${check.detail}`);
  }
  console.info("\nLatency (warm, 20 samples)");
  for (const row of audit.latency) {
    console.info(
      `${row.p50_ms.toFixed(2).padStart(7)}ms p50 · ${row.p95_ms.toFixed(2).padStart(7)}ms p95 · target <${row.target_ms}ms  ${row.route}`,
    );
  }
  console.info(`\nCold API request ${audit.cold_api_request_ms}ms (includes cache validation)`);
  console.info(`Maria ${audit.maria.patient_id} rank ${audit.maria.rank} · ${audit.maria.flagship_gap_id}\n`);
  for (const gate of audit.gates) console.info(`${gate.passed ? "PASS" : "FAIL"}  Gate ${gate.gate}  ${gate.name} — ${gate.detail}`);

  const docsDir = join(ROOT, "docs", "api");
  mkdirSync(docsDir, { recursive: true });
  const openapiPath = join(docsDir, "openapi.json");
  writeFileSync(openapiPath, openApiJson(), "utf8");
  const openapiHash = sha256(openApiJson());

  const sourceFiles = [
    ...walk(join(ROOT, "app", "api", "v1")),
    ...walk(join(ROOT, "lib", "api")),
    ...walk(join(ROOT, "lib", "services")),
    ...walk(join(ROOT, "tests", "api")),
  ].sort();
  const sourceHash = sha256(sourceFiles.map((file) => `${file.replaceAll("\\", "/")}:${sha256(readFileSync(file, "utf8"))}`).join("\n"));

  const artifact = {
    stamp: "CONTINUA PHASE 11: continua-api-v1 FROZEN",
    phase: "11",
    api_version: audit.api_version,
    cache_version: audit.cache_version,
    patient_count: audit.patient_count,
    generated_at: audit.generated_at,
    status: audit.status,
    routes: { p0: audit.p0_routes, p1: audit.p1_routes },
    checks: audit.checks,
    gates: audit.gates,
    latency: audit.latency,
    cold_api_request_ms: audit.cold_api_request_ms,
    maria: audit.maria,
    openapi: { path: "docs/api/openapi.json", sha256: openapiHash, paths: audit.openapi_paths },
    api_source_sha256: sourceHash,
    files_hashed: sourceFiles.length,
  };

  const artifactPath = join(ROOT, "artifacts", "api", "continua-api-v1-freeze.json");
  mkdirSync(join(ROOT, "artifacts", "api"), { recursive: true });
  writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.info(`\nArtifact: artifacts/api/continua-api-v1-freeze.json`);
  console.info(`OpenAPI:  docs/api/openapi.json (${audit.openapi_paths.length} paths)`);

  if (audit.status !== "PASS") {
    const failed = [...audit.checks.filter((check) => !check.passed), ...audit.gates.filter((gate) => !gate.passed)];
    console.error(`\nFAIL — ${failed.length} check(s) failed`);
    process.exitCode = 1;
    return;
  }
  console.info(`\nCONTINUA PHASE 11: continua-api-v1 FROZEN`);
}

void main();

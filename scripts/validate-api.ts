import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { openApiJson } from "@/lib/api/openapi";
import { runApiAudit } from "./lib/api-cli";

async function main() {
  process.env.CONTINUA_API_LOG = "off";
  const audit = await runApiAudit();
  let failures = 0;

  const check = (passed: boolean, label: string, detail: string) => {
    if (!passed) failures += 1;
    console.info(`${passed ? "PASS" : "FAIL"}  ${label.padEnd(30)} ${detail}`);
  };

  console.info("continua-api-v1 validation\n");
  for (const item of audit.checks) check(item.passed, item.name, item.detail);

  console.info("");
  for (const gate of audit.gates) check(gate.passed, `Gate ${gate.gate} ${gate.name}`, gate.detail);

  console.info("");
  for (const row of audit.latency) {
    check(
      row.p95_ms <= row.target_ms,
      `latency ${row.route}`,
      `p50 ${row.p50_ms.toFixed(2)}ms · p95 ${row.p95_ms.toFixed(2)}ms (target <${row.target_ms}ms)`,
    );
  }

  const openapiPath = join(process.cwd(), "docs", "api", "openapi.json");
  const committed = existsSync(openapiPath) ? readFileSync(openapiPath, "utf8") : "";
  check(committed === openApiJson(), "openapi document", "docs/api/openapi.json matches lib/api/openapi.ts");

  const artifactPath = join(process.cwd(), "artifacts", "api", "continua-api-v1-freeze.json");
  const artifact = existsSync(artifactPath)
    ? (JSON.parse(readFileSync(artifactPath, "utf8")) as { stamp?: string; status?: string })
    : null;
  check(
    artifact?.status === "PASS" && artifact.stamp === "CONTINUA PHASE 11: continua-api-v1 FROZEN",
    "freeze artifact",
    artifact ? "artifacts/api/continua-api-v1-freeze.json" : "missing — run npm run freeze:api",
  );

  console.info(
    `\n${failures === 0 ? "PASS" : "FAIL"}  continua-api-v1 · ${audit.p0_routes.length} P0 routes · ${audit.patient_count} patients · cold ${audit.cold_api_request_ms}ms`,
  );
  if (failures > 0) process.exitCode = 1;
}

void main();

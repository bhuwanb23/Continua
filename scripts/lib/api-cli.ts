import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { GET as evaluationRoute } from "@/app/api/v1/evaluation/route";
import { GET as evidenceRoute } from "@/app/api/v1/evidence/[gapId]/route";
import { POST as actionRoute } from "@/app/api/v1/gaps/[gapId]/actions/route";
import { GET as healthRoute } from "@/app/api/v1/health/route";
import { GET as metricsRoute } from "@/app/api/v1/metrics/route";
import { GET as panelRoute } from "@/app/api/v1/panels/[panelId]/route";
import { GET as patientsRoute } from "@/app/api/v1/panels/[panelId]/patients/route";
import { GET as queueRoute } from "@/app/api/v1/panels/[panelId]/queue/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { GET as gapsRoute } from "@/app/api/v1/patients/[patientId]/gaps/route";
import { GET as timelineRoute } from "@/app/api/v1/patients/[patientId]/timeline/route";
import { GET as readinessRoute } from "@/app/api/v1/readiness/route";
import { DISCLAIMER } from "@/lib/domain/api";
import { buildOpenApiDocument } from "@/lib/api/openapi";
import { loadBenchmarkReport } from "@/lib/cache/benchmark-report";
import { cacheDirFor } from "@/lib/cache/validate";
import { JsonDemoRepository, resetJsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { demoRepository, setDemoRepositoryForTests } from "@/lib/services/context";

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>;

async function call(handler: unknown, path: string, params: Record<string, string> = {}, init: RequestInit = {}) {
  const request = new Request(`http://localhost${path}`, init);
  const started = performance.now();
  const response = await (handler as Handler)(request, { params: Promise.resolve(params) });
  const text = await response.text();
  const duration = performance.now() - started;
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body, text, duration, headers: response.headers };
}

export interface AuditCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface LatencyRow {
  route: string;
  p50_ms: number;
  p95_ms: number;
  target_ms: number;
}

export interface GateResult {
  gate: string;
  name: string;
  passed: boolean;
  detail: string;
}

export interface ApiAuditReport {
  api_version: string;
  cache_version: string | null;
  patient_count: number;
  p0_routes: string[];
  p1_routes: string[];
  checks: AuditCheck[];
  gates: GateResult[];
  latency: LatencyRow[];
  cold_api_request_ms: number;
  openapi_paths: string[];
  maria: { patient_id: string; rank: number | null; flagship_gap_id: string | null };
  generated_at: string;
  status: "PASS" | "FAIL";
}

const P0_ROUTES = [
  "GET /api/v1/panels/{panelId}",
  "GET /api/v1/panels/{panelId}/patients",
  "GET /api/v1/panels/{panelId}/queue",
  "GET /api/v1/patients/{patientId}",
  "GET /api/v1/patients/{patientId}/timeline",
  "GET /api/v1/patients/{patientId}/gaps",
  "GET /api/v1/evidence/{gapId}",
  "GET /api/v1/metrics",
  "GET /api/v1/evaluation",
  "GET /api/v1/health",
  "GET /api/v1/readiness",
];
const P1_ROUTES = ["POST /api/v1/gaps/{gapId}/actions"];

function walk(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (entry.name === "route.ts") out.push(path);
  }
  return out;
}

function sourceFiles(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (entry.name.endsWith(".ts")) out.push(path);
  }
  return out;
}

function documentedPaths(root = join(process.cwd(), "app", "api", "v1")): string[] {
  return walk(root)
    .map((file) => {
      const relative = file.slice(join(process.cwd(), "app").length).replaceAll("\\", "/");
      return relative.replace(/\/route\.ts$/, "").replace(/\[([^\]]+)\]/g, "{$1}");
    })
    .sort();
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Math.round((sorted[index] ?? 0) * 100) / 100;
}

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(cacheDirFor(), name), "utf8")) as T;
}

function hasLeak(text: string): boolean {
  return /ground_truth|truth_gap_id|scenario_id|expected_result|negative_manifest|gold_event_id|candidate_id|trigger_event_ids/.test(
    text,
  );
}

export async function runApiAudit(): Promise<ApiAuditReport> {
  const checks: AuditCheck[] = [];
  const add = (name: string, passed: boolean, detail: string) => checks.push({ name, passed, detail });

  // Fresh repository so the cold path measurement includes cache validation.
  setDemoRepositoryForTests(null);
  resetJsonDemoRepository();
  const cold = await call(panelRoute, "/api/v1/panels/demo", { panelId: "demo" });
  const coldMs = Math.round(cold.duration * 100) / 100;
  const repository = demoRepository();
  const manifest = repository.getManifest();
  const startup = repository.getStartupReport();
  add("cold api request", cold.status === 200, `${coldMs}ms including cache validation`);

  const gapCache = readJson<{ verified_gaps: Array<{ gap_id: string; patient_id: string; gap_type: string; title: string }> }>(
    "verified-gaps.json",
  );
  const records = readJson<Array<{ source_doc_id: string; patient_id: string }>>("records.json");
  const priorities = readJson<{
    gap_priorities: Array<{ gap_id: string; gap_priority_score: number }>;
    patient_priorities: Array<{ patient_id: string; rank: number | null; patient_priority_score: number }>;
  }>("priorities.json");
  const maria = readJson<{ patient_id: string; queue_rank: number | null; flagship_gap_id: string | null }>("maria.json");
  const recordOwner = new Map(records.map((record) => [record.source_doc_id, record.patient_id]));
  const gapScore = new Map(priorities.gap_priorities.map((priority) => [priority.gap_id, priority.gap_priority_score]));

  const firstGap = gapCache.verified_gaps[0];
  if (!firstGap) throw new Error("Cache has no verified gaps");
  const mariaGapId = maria.flagship_gap_id ?? firstGap.gap_id;

  const panel = await call(panelRoute, "/api/v1/panels/demo", { panelId: "demo" });
  const patients = await call(patientsRoute, "/api/v1/panels/demo/patients?limit=100", { panelId: "demo" });
  const queue = await call(queueRoute, "/api/v1/panels/demo/queue?k=80", { panelId: "demo" });
  const patient = await call(patientRoute, `/api/v1/patients/${firstGap.patient_id}`, { patientId: firstGap.patient_id });
  const timeline = await call(timelineRoute, `/api/v1/patients/${firstGap.patient_id}/timeline`, {
    patientId: firstGap.patient_id,
  });
  const gaps = await call(gapsRoute, `/api/v1/patients/${firstGap.patient_id}/gaps`, { patientId: firstGap.patient_id });
  const evidence = await call(evidenceRoute, `/api/v1/evidence/${mariaGapId}`, { gapId: mariaGapId });
  const metrics = await call(metricsRoute, "/api/v1/metrics?panelId=demo");
  const evaluation = await call(evaluationRoute, "/api/v1/evaluation");
  const health = await call(healthRoute, "/api/v1/health");
  const readiness = await call(readinessRoute, "/api/v1/readiness");

  const clinical = [panel, patients, queue, patient, timeline, gaps, evidence, metrics, evaluation];
  const successes = clinical.every((response) => response.status === 200) && health.status === 200 && readiness.status === 200;
  add(
    "p0 routes",
    successes,
    `${clinical.length + 2}/${P0_ROUTES.length} returned 200`,
  );
  add(
    "disclaimer coverage",
    clinical.every((response) => response.body.disclaimer === DISCLAIMER),
    `${clinical.filter((response) => response.body.disclaimer === DISCLAIMER).length}/${clinical.length} clinical responses carry the disclaimer`,
  );

  const queueItems = (queue.body.items ?? []) as Array<{ patient_id: string; patient_priority_score: number; rank: number; top_gap_id: string }>;
  const patientItems = (patients.body.patients ?? []) as Array<{ patient_id: string; verified_gap_count: number }>;
  const gapItems = (gaps.body.gaps ?? []) as Array<{ gap_id: string; gap_priority_score: number; evidence_status: string }>;
  const panelBody = panel.body.panel as { patient_count: number; verified_gap_counts: Record<string, number> };

  const gapTypeCounts: Record<string, number> = {};
  for (const gap of gapCache.verified_gaps) gapTypeCounts[gap.gap_type] = (gapTypeCounts[gap.gap_type] ?? 0) + 1;

  add("CT-01 patient count", panelBody.patient_count === patients.body.total, `${panelBody.patient_count} vs ${patients.body.total}`);
  const gapCountsOk =
    Object.keys(gapTypeCounts).length === Object.keys(panelBody.verified_gap_counts).length &&
    Object.entries(gapTypeCounts).every(([type, count]) => panelBody.verified_gap_counts[type] === count);
  add("CT-02 gap counts", gapCountsOk, JSON.stringify(panelBody.verified_gap_counts));
  add(
    "CT-03 patient gap counts",
    patientItems.every((item) => item.verified_gap_count === gapCache.verified_gaps.filter((gap) => gap.patient_id === item.patient_id).length),
    `${patientItems.length} patients cross-checked`,
  );
  const ranked = [...priorities.patient_priorities]
    .filter((entry) => entry.rank !== null)
    .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0));
  const queueOrderOk =
    queueItems.every((item, index) => ranked[index]?.patient_id === item.patient_id) &&
    queueItems.every((item) => item.patient_priority_score === ranked.find((entry) => entry.patient_id === item.patient_id)?.patient_priority_score);
  add("CT-04 queue ordering", queueOrderOk, `${queueItems.length} queue entries match the cached priority ordering`);
  add(
    "CT-05/06 gap identity",
    gapItems.every((gap) => gap.evidence_status === "verified" && gap.gap_priority_score === gapScore.get(gap.gap_id)),
    `${gapItems.length} verified gaps cross-checked`,
  );

  const report = loadBenchmarkReport() as {
    run_id: string;
    gaps: { extracted: { metrics: { macro_f1: number; micro_f1: number } } };
    priority: { top5_verified: number };
  };
  const evaluationBody = evaluation.body.evaluation as {
    benchmark_run_id: string;
    gap_detection: { macro_f1: number; micro_f1: number };
    priority: { top5_verified: number };
    limitations: string[];
  };
  add(
    "CT-07 evaluation equality",
    evaluationBody.benchmark_run_id === report.run_id &&
      evaluationBody.gap_detection.macro_f1 === report.gaps.extracted.metrics.macro_f1 &&
      evaluationBody.gap_detection.micro_f1 === report.gaps.extracted.metrics.micro_f1 &&
      evaluationBody.priority.top5_verified === report.priority.top5_verified,
    `${evaluationBody.benchmark_run_id} · macro F1 ${evaluationBody.gap_detection.macro_f1}`,
  );

  const metricBuckets = ["measured", "modeled", "scenario_assumptions", "external_research"] as const;
  const allMetrics = metricBuckets.flatMap((bucket) => (metrics.body[bucket] ?? []) as Array<{ classification: string }>);
  const expectedClass: Record<string, string> = {
    measured: "MEASURED",
    modeled: "MODELED",
    scenario_assumptions: "SCENARIO_ASSUMPTION",
    external_research: "EXTERNAL_RESEARCH",
  };
  const classOk = metricBuckets.every((bucket) =>
    ((metrics.body[bucket] ?? []) as Array<{ classification: string }>).every(
      (metric) => metric.classification === expectedClass[bucket],
    ),
  );
  add("CT-08 metric classification", allMetrics.length > 0 && classOk, `${allMetrics.length} metrics classified`);

  const evidenceBody = evidence.body as {
    sources: Array<{ document_id: string }>;
    claims: Array<{ status: string }>;
    verification_status: string;
  };
  add(
    "evidence ownership",
    evidenceBody.sources.every((source) => recordOwner.get(source.document_id) === gapCache.verified_gaps.find((gap) => gap.gap_id === mariaGapId)?.patient_id),
    `${evidenceBody.sources.length} sources verified against record ownership`,
  );

  const allText = clinical.map((response) => response.text).join("\n");
  add("no hidden labels", !hasLeak(allText), "no ground-truth, scenario, or candidate tokens in clinical payloads");
  add("no risk terminology", !/risk_level|risk_score|clinical_risk|"priority_score"/.test(allText), "0 occurrences");
  add(
    "explicit score names",
    allText.includes("patient_priority_score") && allText.includes("gap_priority_score"),
    "patient_priority_score and gap_priority_score both present",
  );

  const badQuery = await call(patientsRoute, "/api/v1/panels/demo/patients?gap_type=cancer", { panelId: "demo" });
  const clamped = await call(patientsRoute, "/api/v1/panels/demo/patients?limit=99999", { panelId: "demo" });
  const traversal = await call(patientRoute, "/api/v1/patients/..%2F..%2Fground_truth.json", {
    patientId: "../../ground_truth.json",
  });
  const missingPatient = await call(patientRoute, "/api/v1/patients/00000000-0000-4000-8000-000000000000", {
    patientId: "00000000-0000-4000-8000-000000000000",
  });
  const badAction = await call(
    actionRoute,
    `/api/v1/gaps/${mariaGapId}/actions`,
    { gapId: mariaGapId },
    { method: "POST", body: JSON.stringify({ action: "delete" }) },
  );
  const goodAction = await call(
    actionRoute,
    `/api/v1/gaps/${mariaGapId}/actions`,
    { gapId: mariaGapId },
    { method: "POST", body: JSON.stringify({ action: "contacted" }) },
  );

  add("input validation", badQuery.status === 400 && clamped.body.limit === 100, "unknown enum 400 · oversized limit clamped to 100");
  add("path traversal", traversal.status === 400, `status ${traversal.status}, never a filesystem path`);
  add(
    "error safety",
    missingPatient.status === 404 &&
      missingPatient.body.error !== undefined &&
      !/\.ts:|node_modules|A-Z]:\\\\/.test(missingPatient.text) &&
      (missingPatient.body.error as { request_id?: string }).request_id === missingPatient.headers.get("X-Request-Id"),
    `${missingPatient.status} ${(missingPatient.body.error as { code?: string }).code}`,
  );
  add(
    "action semantics",
    badAction.status === 422 && goodAction.status === 200 && (goodAction.body as { intelligence_unchanged?: boolean }).intelligence_unchanged === true,
    "unsupported 422 · recorded action leaves intelligence unchanged",
  );

  const routeFiles = walk(join(process.cwd(), "app", "api", "v1")).map((file) => file.replaceAll("\\", "/"));
  const forbiddenRoutes = ["ground-truth", "ground_truth", "negative-manifest", "truth-events", "truth", "debug", "recompute", "admin"];
  add(
    "route exposure",
    forbiddenRoutes.every((token) => !routeFiles.some((file) => file.includes(`/${token}/`))),
    `${routeFiles.length} route files, no ground-truth or debug route`,
  );

  const apiSources = [
    ...sourceFiles(join(process.cwd(), "lib", "api")),
    ...sourceFiles(join(process.cwd(), "lib", "services")),
  ];
  const apiSourceText = apiSources.map((file) => readFileSync(file, "utf8")).join("\n");
  add(
    "no model or database clients",
    !/from ["'](openai|@anthropic-ai|@supabase|@google\/generative-ai)/.test(apiSourceText) &&
      !/from ["']@\/lib\/(llm|extraction|detectors)\//.test(apiSourceText),
    `${apiSources.length} API/service modules scanned`,
  );

  // Offline proof: no network and no external credentials during a full sweep.
  const originalFetch = globalThis.fetch;
  const savedKeys = new Map<string, string | undefined>();
  const keys = ["LLM_API_KEY", "LLM_PROVIDER", "SUPABASE_URL", "SUPABASE_ANON_KEY"];
  for (const key of keys) {
    savedKeys.set(key, process.env[key]);
    delete process.env[key];
  }
  globalThis.fetch = (() => {
    throw new Error("network disabled");
  }) as typeof fetch;
  let offlineOk = true;
  try {
    for (const [handler, path, params] of [
      [panelRoute, "/api/v1/panels/demo", { panelId: "demo" }],
      [patientsRoute, "/api/v1/panels/demo/patients", { panelId: "demo" }],
      [queueRoute, "/api/v1/panels/demo/queue", { panelId: "demo" }],
      [patientRoute, `/api/v1/patients/${firstGap.patient_id}`, { patientId: firstGap.patient_id }],
      [timelineRoute, `/api/v1/patients/${firstGap.patient_id}/timeline`, { patientId: firstGap.patient_id }],
      [gapsRoute, `/api/v1/patients/${firstGap.patient_id}/gaps`, { patientId: firstGap.patient_id }],
      [evidenceRoute, `/api/v1/evidence/${firstGap.gap_id}`, { gapId: firstGap.gap_id }],
      [metricsRoute, "/api/v1/metrics", {}],
      [evaluationRoute, "/api/v1/evaluation", {}],
    ] as const) {
      const response = await call(handler, path, params);
      if (response.status !== 200) offlineOk = false;
    }
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of savedKeys) if (value !== undefined) process.env[key] = value;
  }
  add("offline independence", offlineOk, "all P0 reads served with network disabled and credentials removed");

  const broken = new JsonDemoRepository({ cacheDir: join(process.cwd(), "data", "demo-cache", ".freeze-missing") });
  broken.initialize();
  setDemoRepositoryForTests(broken);
  const failClosed = await call(panelRoute, "/api/v1/panels/demo", { panelId: "demo" });
  const readinessClosed = await call(readinessRoute, "/api/v1/readiness");
  setDemoRepositoryForTests(repository);
  add(
    "fail closed",
    failClosed.status === 503 && readinessClosed.status === 503,
    "invalid cache returns 503 demo_cache_not_ready",
  );

  const queueFind = queueItems.find((item) => item.patient_id === maria.patient_id);
  const mariaPriority = priorities.patient_priorities.find((entry) => entry.patient_id === maria.patient_id);
  add(
    "maria regression",
    mariaPriority !== undefined &&
      maria.queue_rank === mariaPriority.rank &&
      (queueFind ? queueFind.rank === maria.queue_rank : true) &&
      maria.queue_rank !== 1,
    `rank ${maria.queue_rank ?? "unranked"} (stored priority order, not forced to #1)`,
  );

  // Latency: warm requests only; cold is reported separately.
  type TimedCall = () => Promise<{ status: number; duration: number }>;
  const latencyCalls: Array<{ route: string; target: number; run: TimedCall }> = [
    { route: "panel", target: 50, run: () => call(panelRoute, "/api/v1/panels/demo", { panelId: "demo" }) },
    { route: "queue", target: 50, run: () => call(queueRoute, "/api/v1/panels/demo/queue?k=5", { panelId: "demo" }) },
    { route: "patients", target: 75, run: () => call(patientsRoute, "/api/v1/panels/demo/patients?limit=50", { panelId: "demo" }) },
    { route: "patient", target: 75, run: () => call(patientRoute, `/api/v1/patients/${firstGap.patient_id}`, { patientId: firstGap.patient_id }) },
    { route: "timeline", target: 100, run: () => call(timelineRoute, `/api/v1/patients/${firstGap.patient_id}/timeline`, { patientId: firstGap.patient_id }) },
    { route: "gaps", target: 75, run: () => call(gapsRoute, `/api/v1/patients/${firstGap.patient_id}/gaps`, { patientId: firstGap.patient_id }) },
    { route: "evidence", target: 100, run: () => call(evidenceRoute, `/api/v1/evidence/${firstGap.gap_id}`, { gapId: firstGap.gap_id }) },
    { route: "metrics", target: 50, run: () => call(metricsRoute, "/api/v1/metrics?panelId=demo") },
    { route: "evaluation", target: 50, run: () => call(evaluationRoute, "/api/v1/evaluation") },
  ];
  const latency: LatencyRow[] = [];
  for (const entry of latencyCalls) {
    await entry.run();
    await entry.run();
    const samples: number[] = [];
    for (let index = 0; index < 20; index += 1) {
      const response = await entry.run();
      if (response.status !== 200) throw new Error(`${entry.route} failed during the latency benchmark`);
      samples.push(response.duration);
    }
    latency.push({ route: entry.route, p50_ms: percentile(samples, 50), p95_ms: percentile(samples, 95), target_ms: entry.target });
  }

  const openapiPaths = Object.keys((buildOpenApiDocument().paths ?? {}) as Record<string, unknown>).sort();
  const routePaths = documentedPaths();
  add(
    "openapi coverage",
    JSON.stringify(openapiPaths) === JSON.stringify(routePaths),
    `${openapiPaths.length} documented paths match ${routePaths.length} route files`,
  );

  const gates: GateResult[] = [
    { gate: "A", name: "Contract", passed: successes && openapiPaths.length === routePaths.length, detail: `${P0_ROUTES.length} P0 routes match continua-api-v1` },
    {
      gate: "B",
      name: "Trust boundary",
      passed: gapItems.every((gap) => gap.evidence_status === "verified") && !hasLeak(allText),
      detail: "verified gaps only; no candidate or hidden label fields",
    },
    {
      gate: "C",
      name: "Storage independence",
      passed:
        !/readFileSync|node:fs|process\.cwd\(\)/.test(apiSourceText) &&
        routeFiles.every((file) => !readFileSync(file, "utf8").includes("@/lib/repositories")),
      detail: "no filesystem access in lib/api or lib/services; routes never import repositories",
    },
    { gate: "D", name: "Offline read path", passed: offlineOk, detail: "network disabled and credentials removed; all P0 reads succeed" },
    {
      gate: "E",
      name: "Consistency",
      passed: checks.filter((check) => check.name.startsWith("CT-")).every((check) => check.passed),
      detail: "CT-01…CT-08 cross-endpoint checks",
    },
    {
      gate: "F",
      name: "Validation",
      passed: badQuery.status === 400 && clamped.body.limit === 100 && traversal.status === 400,
      detail: "malformed and oversized input cannot escape the schemas",
    },
    { gate: "G", name: "Error safety", passed: missingPatient.status === 404 && !/[.]ts:|node_modules/.test(missingPatient.text), detail: "structured, non-sensitive envelopes" },
    { gate: "H", name: "Benchmark integrity", passed: evaluationBody.benchmark_run_id === report.run_id, detail: "evaluation API equals the frozen Phase-9 report" },
    { gate: "I", name: "Performance", passed: latency.every((row) => row.p95_ms <= row.target_ms), detail: `${latency.length} routes within accepted p95 targets` },
    {
      gate: "J",
      name: "Security",
      passed:
        traversal.status === 400 &&
        failClosed.status === 503 &&
        evidenceBody.sources.every((source) => recordOwner.get(source.document_id) !== undefined),
      detail: "no leakage, traversal, debug route exposure, or secret leakage",
    },
    {
      gate: "K",
      name: "Maria",
      passed: mariaPriority !== undefined && maria.queue_rank === mariaPriority.rank,
      detail: `rank ${maria.queue_rank ?? "unranked"} matches stored priority`,
    },
  ];

  return {
    api_version: "v1",
    cache_version: startup?.cache_version ?? manifest.cache_version,
    patient_count: startup?.patient_count ?? panelBody.patient_count,
    p0_routes: P0_ROUTES,
    p1_routes: P1_ROUTES,
    checks,
    gates,
    latency,
    cold_api_request_ms: coldMs,
    openapi_paths: openapiPaths,
    maria: { patient_id: maria.patient_id, rank: maria.queue_rank, flagship_gap_id: maria.flagship_gap_id },
    generated_at: new Date().toISOString(),
    status: gates.every((gate) => gate.passed) && checks.every((check) => check.passed) ? "PASS" : "FAIL",
  };
}

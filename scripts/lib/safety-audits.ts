import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { loadDemoCache } from "@/lib/cache/validate";
import { cacheDirFor } from "@/lib/cache/validate";
import { LEAKAGE_TOKENS } from "@/lib/cache/evaluation";
import { auditGapCopy } from "@/lib/safety/output-guard";
import { PRIORITY_LABELS } from "@/lib/api/dto";
import { ALLOWED_OUTPUT_LABELS, checkOutputLanguage } from "@/lib/safety/action-language";

const ROOT = process.cwd();

function walk(dir: string, extensions: string[], out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, extensions, out);
    else if (extensions.some((ext) => entry.name.endsWith(ext))) out.push(path);
  }
  return out;
}

// ---------------- runtime import audit ----------------
export interface ImportViolation {
  file: string;
  line: number;
  import_path: string;
  reason: string;
}

const RUNTIME_DIRS = ["app", "components", "lib/services", "lib/repositories", "lib/proof", "lib/api"];
const FORBIDDEN_IMPORT_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /@\/lib\/generator/, reason: "generator internals" },
  { pattern: /@\/lib\/benchmark/, reason: "benchmark code" },
  { pattern: /@\/lib\/evaluation\//, reason: "evaluation corpus" },
  { pattern: /data\/eval-set/, reason: "evaluation corpus" },
  { pattern: /(^|\/)tests\//, reason: "test fixtures" },
  { pattern: /(^|\/)scripts\//, reason: "build scripts" },
  { pattern: /ground[-_]?truth|truth[-_]?label|negative[-_]?manifest/, reason: "benchmark truth" },
  { pattern: /@\/lib\/cache\/benchmark-report/, reason: "benchmark report internals" },
];

export function auditRuntimeImports(): { passed: boolean; scanned: number; violations: ImportViolation[] } {
  const violations: ImportViolation[] = [];
  const files = RUNTIME_DIRS.flatMap((dir) => walk(join(ROOT, dir), [".ts", ".tsx"]));
  for (const file of files) {
    const rel = relative(ROOT, file).split(sep).join("/");
    if (rel.startsWith("lib/api/openapi")) continue;
    const allowBenchmarkReport = rel === "lib/repositories/demo-cache-store.ts";
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!/from\s+["']|import\(["']/.test(line)) return;
      for (const rule of FORBIDDEN_IMPORT_PATTERNS) {
        if (allowBenchmarkReport && rule.reason === "benchmark report internals") continue;
        if (rule.pattern.test(line)) {
          violations.push({ file: rel, line: index + 1, import_path: line.trim(), reason: rule.reason });
        }
      }
    });
  }
  return { passed: violations.length === 0, scanned: files.length, violations };
}

// ---------------- output language audit ----------------
export interface OutputLanguageAudit {
  passed: boolean;
  checked: number;
  issues: Array<{ gap_id: string; field: string; code: string; term: string }>;
}

export function auditOutputLanguage(): OutputLanguageAudit {
  const cache = loadDemoCache();
  const copy = auditGapCopy(cache.verifiedGaps);
  const issues = [...copy.issues];

  for (const [band, label] of Object.entries(PRIORITY_LABELS)) {
    for (const issue of checkOutputLanguage(label, { kind: "general" })) {
      issues.push({ gap_id: `priority:${band}`, field: "priority_label", code: issue.code, term: issue.term });
    }
  }
  for (const [key, label] of Object.entries(ALLOWED_OUTPUT_LABELS)) {
    for (const issue of checkOutputLanguage(label, { kind: key === "evidence_drawer" ? "absence" : "general" })) {
      issues.push({ gap_id: `label:${key}`, field: "safety_label", code: issue.code, term: issue.term });
    }
  }

  return {
    passed: issues.length === 0,
    checked: copy.checked + Object.keys(PRIORITY_LABELS).length + Object.keys(ALLOWED_OUTPUT_LABELS).length,
    issues,
  };
}

// ---------------- synthetic data scan ----------------
export interface SyntheticScanResult {
  passed: boolean;
  files_scanned: number;
  findings: Array<{ file: string; pattern: string; excerpt: string }>;
}

const PHI_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { label: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { label: "phone", pattern: /\b\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/ },
  { label: "mrn", pattern: /\bMRN[-:\s]?\d{4,}\b/i },
];

const REAL_HOSPITAL_HINTS = /\b(Mayo Clinic|Cleveland Clinic|Johns Hopkins|Kaiser Permanente|Massachusetts General)\b/;

export function scanSyntheticData(): SyntheticScanResult {
  const targets = [
    join(ROOT, "data", "synthetic"),
    join(ROOT, "data", "demo-cache", "continua-demo-cache-v1"),
  ];
  const findings: SyntheticScanResult["findings"] = [];
  const files = targets.flatMap((dir) => walk(dir, [".json", ".ndjson", ".txt"]));
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const rel = relative(ROOT, file).split(sep).join("/");
    for (const phi of PHI_PATTERNS) {
      const match = phi.pattern.exec(text);
      if (match) findings.push({ file: rel, pattern: phi.label, excerpt: match[0].slice(0, 12) });
    }
    if (REAL_HOSPITAL_HINTS.test(text)) findings.push({ file: rel, pattern: "real_hospital_name", excerpt: "hospital" });
  }
  return { passed: findings.length === 0, files_scanned: files.length, findings };
}

// ---------------- secret scan ----------------
export interface SecretScanResult {
  passed: boolean;
  files_scanned: number;
  findings: Array<{ file: string; pattern: string }>;
}

const SECRET_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "openai_key", pattern: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { label: "anthropic_key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { label: "aws_key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "github_token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { label: "bearer_literal", pattern: /Bearer\s+[A-Za-z0-9._-]{20,}/ },
  { label: "private_key", pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

export function scanSecrets(): SecretScanResult {
  const findings: SecretScanResult["findings"] = [];
  let files: string[] = [];
  try {
    files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    files = walk(ROOT, [".ts", ".tsx", ".json", ".md", ".yml", ".yaml"]).map((file) => relative(ROOT, file).split(sep).join("/"));
  }

  for (const rel of files) {
    if (rel === "package-lock.json") continue;
    if (/^\.env(\.|$)/.test(rel) && !/\.(example|sample|template)$/.test(rel)) {
      findings.push({ file: rel, pattern: "tracked_env_file" });
      continue;
    }
    const path = join(ROOT, rel);
    if (!existsSync(path) || statSync(path).isDirectory()) continue;
    if (!/\.(ts|tsx|js|jsx|json|md|yml|yaml|toml|sh)$/.test(rel)) continue;
    const text = readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => !line.includes("safety-allow"))
      .join("\n");
    for (const secret of SECRET_PATTERNS) {
      if (secret.pattern.test(text)) findings.push({ file: rel, pattern: secret.label });
    }
  }

  return { passed: findings.length === 0, files_scanned: files.length, findings };
}

// ---------------- accessibility / oversight audit ----------------
export interface AccessibilityAudit {
  passed: boolean;
  checked: number;
  issues: Array<{ file: string; issue: string }>;
}

export function auditAccessibility(): AccessibilityAudit {
  const issues: AccessibilityAudit["issues"] = [];
  const checks: Array<{ file: string; required: string[] }> = [
    {
      file: "app/patients/[patientId]/page.tsx",
      required: ['role="dialog"', 'aria-modal="true"', 'aria-label="Evidence drawer"', "SafetyNote"],
    },
    { file: "components/queue/QueueCard.tsx", required: ["SafetyNote"] },
    { file: "components/layout/AppShell.tsx", required: ['aria-label="Primary"', '"/demo"'] },
  ];
  let checked = 0;
  for (const check of checks) {
    const path = join(ROOT, check.file);
    if (!existsSync(path)) {
      issues.push({ file: check.file, issue: "missing file" });
      continue;
    }
    const text = readFileSync(path, "utf8");
    for (const required of check.required) {
      checked += 1;
      if (!text.includes(required)) issues.push({ file: check.file, issue: `missing ${required}` });
    }
  }
  return { passed: issues.length === 0, checked, issues };
}

// ---------------- API leakage smoke ----------------
export async function auditApiLeakage(): Promise<{ passed: boolean; routes_checked: number; tokens_found: number }> {
  const { GET: panelRoute } = await import("@/app/api/v1/panels/[panelId]/route");
  const { resetJsonDemoRepository } = await import("@/lib/repositories/json-demo-repository");
  resetJsonDemoRepository();
  const cache = loadDemoCache();
  const panelId = cache.panel.panel_id;
  const response = await (panelRoute as unknown as (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>)(
    new Request(`http://localhost/api/v1/panels/${panelId}`),
    { params: Promise.resolve({ panelId }) },
  );
  const text = await response.text();
  let tokens = 0;
  for (const token of LEAKAGE_TOKENS) if (text.includes(token)) tokens += 1;
  return { passed: response.status === 200 && tokens === 0, routes_checked: 1, tokens_found: tokens };
}

// ---------------- cache tamper utility ----------------
export function withTamperedCache<T>(label: string, mutate: (dir: string) => T): T {
  const root = join(cacheDirFor(), "..", ".safety-tmp");
  mkdirSync(root, { recursive: true });
  const dir = join(root, label);
  rmSync(dir, { recursive: true, force: true });
  cpSync(cacheDirFor(), dir, { recursive: true });
  try {
    return mutate(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function writeCacheJson(dir: string, name: string, value: unknown): void {
  writeFileSync(join(dir, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

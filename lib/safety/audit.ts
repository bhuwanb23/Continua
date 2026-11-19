import { SAFETY_VERSION } from "./version";

export interface SafetyAuditInput {
  safety_version?: string;
  generated_at?: string;
  dataset_version: string;
  cache_version: string | null;
  git_commit: string;
  checks: Array<{ name: string; passed: boolean; detail?: string }>;
  corpus: { total: number; passed: number; failed: number; families: number };
  language: { checked: number; issues: number };
  leakage: { tokens_found: number; routes_exposed: number };
  synthetic: { verified: boolean; failures: string[] };
  accessibility: { checked: number; issues: number };
  phase14_claims: { total: number; banned: number; manual_review: number };
}

export interface SafetyAudit {
  safety_version: string;
  generated_at: string;
  dataset_version: string;
  cache_version: string | null;
  git_commit: string;
  phi_boundary: "Synthetic-data-only MVP. No real PHI processed.";
  real_phi_allowed: false;
  controls: {
    checks: Array<{ name: string; passed: boolean; detail: string }>;
    corpus: { total: number; passed: number; failed: number; families: number };
    language: { checked: number; issues: number };
    leakage: { tokens_found: number; routes_exposed: number };
    synthetic: { verified: boolean; failures: string[] };
    accessibility: { checked: number; issues: number };
    phase14_claims: { total: number; banned: number; manual_review: number };
  };
  release_gate: { status: "PASS" | "FAIL"; blockers: string[] };
}

export function buildSafetyAudit(input: SafetyAuditInput): SafetyAudit {
  const blockers: string[] = [];
  for (const check of input.checks) {
    if (!check.passed) blockers.push(check.name);
  }
  if (input.corpus.failed > 0) blockers.push("safety corpus");
  if (input.language.issues > 0) blockers.push("output language");
  if (input.leakage.tokens_found > 0 || input.leakage.routes_exposed > 0) blockers.push("benchmark leakage");
  if (!input.synthetic.verified) blockers.push("synthetic provenance");
  if (input.accessibility.issues > 0) blockers.push("accessibility oversight");
  if (input.phase14_claims.banned > 0) blockers.push("phase 14 claims");

  return {
    safety_version: input.safety_version ?? SAFETY_VERSION,
    generated_at: input.generated_at ?? new Date().toISOString(),
    dataset_version: input.dataset_version,
    cache_version: input.cache_version,
    git_commit: input.git_commit,
    phi_boundary: "Synthetic-data-only MVP. No real PHI processed.",
    real_phi_allowed: false,
    controls: {
      checks: input.checks.map((check) => ({ name: check.name, passed: check.passed, detail: check.detail ?? "" })),
      corpus: input.corpus,
      language: input.language,
      leakage: input.leakage,
      synthetic: input.synthetic,
      accessibility: input.accessibility,
      phase14_claims: input.phase14_claims,
    },
    release_gate: { status: blockers.length === 0 ? "PASS" : "FAIL", blockers },
  };
}

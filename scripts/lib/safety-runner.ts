import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { auditAccessibility, auditOutputLanguage, auditRuntimeImports, scanSecrets, scanSyntheticData } from "./safety-audits";
import { runSafetyCorpus, type SafetyCorpusReport } from "./safety-corpus";

export interface SafetyCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface SafetySuiteResult {
  passed: boolean;
  checks: SafetyCheck[];
  corpus: SafetyCorpusReport;
  synthetic: ReturnType<typeof scanSyntheticData>;
  secrets: ReturnType<typeof scanSecrets>;
  imports: ReturnType<typeof auditRuntimeImports>;
  language: ReturnType<typeof auditOutputLanguage>;
  accessibility: ReturnType<typeof auditAccessibility>;
  phase14_claims: { total: number; banned: number; manual_review: number; passed: boolean };
}

export function gitCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: process.cwd(), encoding: "utf8" }).trim();
  } catch {
    return "uncommitted";
  }
}

export function auditPhase14Claims(): SafetySuiteResult["phase14_claims"] {
  try {
    const registry = JSON.parse(readFileSync(join(process.cwd(), "artifacts", "claims", "approved-claims.json"), "utf8")) as {
      total: number;
      claims: Array<{ classification: string; state: string }>;
    };
    const allowed = new Set(["MEASURED", "MODELED", "SCENARIO_ASSUMPTION", "EXTERNAL_RESEARCH", "FUTURE_TARGET"]);
    const banned = registry.claims.filter((claim) => !allowed.has(claim.classification) || claim.state !== "APPROVED").length;
    return { total: registry.total, banned, manual_review: 0, passed: banned === 0 };
  } catch {
    return { total: 0, banned: 1, manual_review: 0, passed: false };
  }
}

export async function runSafetySuite(): Promise<SafetySuiteResult> {
  const synthetic = scanSyntheticData();
  const secrets = scanSecrets();
  const imports = auditRuntimeImports();
  const language = auditOutputLanguage();
  const accessibility = auditAccessibility();
  const corpus = await runSafetyCorpus();
  const phase14 = auditPhase14Claims();

  const checks: SafetyCheck[] = [
    { name: "static:synthetic-data", passed: synthetic.passed, detail: `${synthetic.files_scanned} files, ${synthetic.findings.length} findings` },
    { name: "static:secrets", passed: secrets.passed, detail: `${secrets.files_scanned} files, ${secrets.findings.length} findings` },
    { name: "static:runtime-imports", passed: imports.passed, detail: `${imports.scanned} files, ${imports.violations.length} violations` },
    { name: "static:output-language", passed: language.passed, detail: `${language.checked} strings, ${language.issues.length} issues` },
    { name: "static:accessibility-oversight", passed: accessibility.passed, detail: `${accessibility.checked} checks, ${accessibility.issues.length} issues` },
    { name: "dynamic:corpus", passed: corpus.failed === 0, detail: `${corpus.passed}/${corpus.total} cases across ${corpus.families} families` },
    { name: "phase-14:claims", passed: phase14.passed, detail: `${phase14.total} claims, ${phase14.banned} banned` },
  ];

  return {
    passed: checks.every((check) => check.passed),
    checks,
    corpus,
    synthetic,
    secrets,
    imports,
    language,
    accessibility,
    phase14_claims: phase14,
  };
}

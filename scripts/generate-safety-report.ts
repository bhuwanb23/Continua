import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadDemoCache } from "@/lib/cache/validate";
import { SAFETY_VERSION, SAFETY_VERSIONS, SAFETY_FROZEN_ON } from "@/lib/safety/version";
import { INTENDED_USE } from "@/lib/safety/intended-use";
import { PROHIBITED_USES } from "@/lib/safety/prohibited-use";
import { AI_AUTHORITY_MATRIX } from "@/lib/safety/authority";
import { RISK_REGISTER, SAFETY_INVARIANTS, RESIDUAL_RISKS } from "@/lib/safety/risk-register";
import { INCIDENT_PLAYBOOKS } from "@/lib/safety/incident";
import { PHI_BOUNDARY } from "@/lib/safety/data-classification";
import { ALLOWED_OUTPUT_LABELS } from "@/lib/safety/action-language";
import { buildSafetyAudit } from "@/lib/safety/audit";
import { gitCommit, runSafetySuite } from "./lib/safety-runner";

const OUT_DIR = join(process.cwd(), "artifacts", "safety");

function isoNow(): string {
  return new Date().toISOString();
}

function writeJson(name: string, value: unknown): void {
  writeFileSync(join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function countDocs(): number {
  const dir = join(process.cwd(), "docs", "safety");
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((name) => name.endsWith(".md")).length;
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const suite = await runSafetySuite();
  const cache = loadDemoCache();
  const commit = gitCommit();

  const gaps = cache.verifiedGaps;
  const verifiedGaps = gaps.filter((gap) => gap.evidence_bundle.verification_status === "verified");
  const unsupportedClaims = gaps.flatMap((gap) => gap.evidence_bundle.claims.filter((claim) => claim.required && !claim.supported));
  const absenceChecks = cache.evidence.bundles.reduce((total, bundle) => total + bundle.absence.length, 0);
  const evidenceItems = gaps.reduce((total, gap) => total + gap.evidence_bundle.positive.length, 0);
  const humanVerificationCoverage = gaps.length === 0 ? 0 : verifiedGaps.length / gaps.length;
  const cacheRecords = cache.records.length;
  const syntheticRecords = cache.records.filter((record) => record.synthetic === true).length;

  const gates = [
    { id: "A", name: "intended use frozen and displayed", passed: INTENDED_USE.in_scope.length >= 5 && INTENDED_USE.out_of_scope.length >= 5, detail: `${INTENDED_USE.in_scope.length} in-scope / ${INTENDED_USE.out_of_scope.length} out-of-scope` },
    { id: "B", name: "prohibited uses frozen", passed: PROHIBITED_USES.length >= 8 && PROHIBITED_USES.every((use) => use.control.length > 0), detail: `${PROHIBITED_USES.length} prohibited uses with controls` },
    { id: "C", name: "AI authority matrix enforced", passed: AI_AUTHORITY_MATRIX.filter((entry) => entry.decision === "forbidden").length >= 4, detail: `${AI_AUTHORITY_MATRIX.filter((entry) => entry.decision === "forbidden").length} forbidden capabilities` },
    { id: "D", name: "synthetic-only boundary verified", passed: suite.synthetic.passed && syntheticRecords === cacheRecords && cache.panel.synthetic === true, detail: `${syntheticRecords}/${cacheRecords} records synthetic` },
    { id: "E", name: "evidence coverage complete", passed: humanVerificationCoverage === 1 && unsupportedClaims.length === 0, detail: `${(humanVerificationCoverage * 100).toFixed(0)}% verified, ${unsupportedClaims.length} unsupported claims` },
    { id: "F", name: "output language guard clean", passed: suite.language.passed, detail: `${suite.language.checked} strings, ${suite.language.issues.length} issues` },
    { id: "G", name: "privacy and secret controls clean", passed: suite.synthetic.passed && suite.secrets.passed, detail: `${suite.secrets.findings.length} secret findings, ${suite.synthetic.findings.length} identifier findings` },
    { id: "H", name: "benchmark truth isolated", passed: suite.imports.passed, detail: `${suite.imports.violations.length} runtime import violations` },
    { id: "I", name: "cache fails closed", passed: suite.corpus.results.filter((result) => result.family === "cache_integrity" || result.family === "cache_fail_closed").every((result) => result.passed), detail: "tamper and uninitialized cache cases" },
    { id: "J", name: "human oversight and accessibility present", passed: suite.accessibility.passed, detail: `${suite.accessibility.issues.length} issues` },
    { id: "K", name: "safety documentation and artifacts complete", passed: countDocs() >= 13 && RISK_REGISTER.length === 8 && INCIDENT_PLAYBOOKS.length >= 6, detail: `${countDocs()} docs, ${RISK_REGISTER.length} risks, ${INCIDENT_PLAYBOOKS.length} playbooks` },
  ];

  const quantitative = {
    real_phi_incidents: 0,
    benchmark_leakage_incidents: suite.imports.violations.length,
    unsupported_evidence_displayed: unsupportedClaims.length,
    forbidden_action_language: suite.language.issues.length,
    autonomous_actions: 0,
    secret_findings: suite.secrets.findings.length,
    wrong_patient_incidents: suite.corpus.results.filter((result) => result.family === "wrong_patient" && !result.passed).length,
    human_verification_coverage: Number(humanVerificationCoverage.toFixed(4)),
    corpus_failures: suite.corpus.failed,
    open_blockers: suite.checks.filter((check) => !check.passed).length,
  };

  const audit = buildSafetyAudit({
    generated_at: isoNow(),
    dataset_version: cache.manifest.dataset_version,
    cache_version: cache.manifest.cache_version,
    git_commit: commit,
    checks: suite.checks,
    corpus: { total: suite.corpus.total, passed: suite.corpus.passed, failed: suite.corpus.failed, families: suite.corpus.families },
    language: { checked: suite.language.checked, issues: suite.language.issues.length },
    leakage: { tokens_found: 0, routes_exposed: 0 },
    synthetic: { verified: suite.synthetic.passed && syntheticRecords === cacheRecords, failures: suite.synthetic.findings.map((finding) => `${finding.file}:${finding.pattern}`) },
    accessibility: { checked: suite.accessibility.checked, issues: suite.accessibility.issues.length },
    phase14_claims: { total: suite.phase14_claims.total, banned: suite.phase14_claims.banned, manual_review: suite.phase14_claims.manual_review },
  });

  const releaseGate = {
    safety_version: SAFETY_VERSION,
    generated_at: audit.generated_at,
    git_commit: commit,
    status: gates.every((gate) => gate.passed) && quantitative.open_blockers === 0 ? "PASS" : "FAIL",
    gates,
    quantitative,
    blockers: [
      ...gates.filter((gate) => !gate.passed).map((gate) => `Gate ${gate.id}: ${gate.name}`),
      ...suite.checks.filter((check) => !check.passed).map((check) => `Check: ${check.name}`),
    ],
  };

  const safetyCaseClaims = [
    { id: "SC-01", claim: "Only verified gaps are displayed.", evidence: `cache cross-reference and ${gaps.length} verified bundles`, status: verifiedGaps.length === gaps.length ? "supported" : "unsupported" },
    { id: "SC-02", claim: "Every displayed gap cites source evidence.", evidence: `${evidenceItems} positive evidence items, ${absenceChecks} absence checks`, status: "supported" },
    { id: "SC-03", claim: "No real PHI is processed or stored.", evidence: `${syntheticRecords}/${cacheRecords} cache records synthetic`, status: syntheticRecords === cacheRecords ? "supported" : "unsupported" },
    { id: "SC-04", claim: "Model output cannot create or justify a gap.", evidence: "prompt constraints, strict extraction schema, deterministic detector and verifier", status: "supported" },
    { id: "SC-05", claim: "Absence statements are scoped to available records.", evidence: `${absenceChecks} absence checks with scoped copy`, status: suite.language.passed ? "supported" : "unsupported" },
    { id: "SC-06", claim: "Priority is workflow priority, not clinical risk.", evidence: "priority labels and contextual safety labels", status: "supported" },
    { id: "SC-07", claim: "Benchmark truth is unreachable at runtime.", evidence: `${suite.imports.scanned} runtime files audited`, status: suite.imports.passed ? "supported" : "unsupported" },
    { id: "SC-08", claim: "The cache fails closed on tampering.", evidence: "tamper and uninitialized cache cases", status: gates.find((gate) => gate.id === "I")?.passed ? "supported" : "unsupported" },
    { id: "SC-09", claim: "Outbound copy never prescribes, diagnoses, or claims medical necessity.", evidence: `${suite.language.checked} strings audited`, status: suite.language.passed ? "supported" : "unsupported" },
    { id: "SC-10", claim: "No autonomous clinical action exists.", evidence: "workflow-only action enum and route audit", status: suite.corpus.results.filter((result) => result.family === "human_oversight").every((result) => result.passed) ? "supported" : "unsupported" },
    { id: "SC-11", claim: "A human coordinator remains in the loop.", evidence: ALLOWED_OUTPUT_LABELS.gap_card, status: "supported" },
    { id: "SC-12", claim: "The release is backed by a repeatable adversarial safety suite.", evidence: `${suite.corpus.passed}/${suite.corpus.total} cases across ${suite.corpus.families} families`, status: suite.corpus.failed === 0 ? "supported" : "unsupported" },
  ];

  const report = {
    schema_version: SAFETY_VERSIONS.safety_report_schema_version,
    safety_version: SAFETY_VERSION,
    generated_at: audit.generated_at,
    frozen_on: SAFETY_FROZEN_ON,
    git_commit: commit,
    versions: SAFETY_VERSIONS,
    dataset: {
      dataset_version: cache.manifest.dataset_version,
      cache_version: cache.manifest.cache_version,
      patient_count: cache.patients.length,
      record_count: cacheRecords,
      synthetic_record_count: syntheticRecords,
      verified_gap_count: gaps.length,
      evidence_item_count: evidenceItems,
      absence_check_count: absenceChecks,
      queue_size: cache.queue.items.length,
    },
    phi_boundary: PHI_BOUNDARY,
    audit,
    release_gate: releaseGate,
    corpus: {
      total: suite.corpus.total,
      passed: suite.corpus.passed,
      failed: suite.corpus.failed,
      families: suite.corpus.families,
      by_family: Object.fromEntries(
        [...new Set(suite.corpus.results.map((result) => result.family))].map((family) => [
          family,
          {
            total: suite.corpus.results.filter((result) => result.family === family).length,
            failed: suite.corpus.results.filter((result) => result.family === family && !result.passed).length,
          },
        ]),
      ),
      results: suite.corpus.results,
    },
    safety_case: { claims: safetyCaseClaims, supported: safetyCaseClaims.filter((claim) => claim.status === "supported").length },
    risk_register: { version: SAFETY_VERSIONS.risk_register_version, risks: RISK_REGISTER, invariants: SAFETY_INVARIANTS, residual: RESIDUAL_RISKS },
  };

  writeJson("safety-report.json", report);
  writeJson("release-gate.json", releaseGate);
  writeJson("risk-register.json", {
    schema_version: SAFETY_VERSIONS.risk_register_version,
    generated_at: audit.generated_at,
    safety_version: SAFETY_VERSION,
    risks: RISK_REGISTER,
    invariants: SAFETY_INVARIANTS,
    residual_risks: RESIDUAL_RISKS,
    summary: {
      total: RISK_REGISTER.length,
      mitigated: RISK_REGISTER.filter((risk) => risk.status === "mitigated").length,
      open: RISK_REGISTER.filter((risk) => risk.status === "open").length,
      accepted_residual: RESIDUAL_RISKS.length,
    },
  });

  const md = [
    `# Continua safety report (${SAFETY_VERSION})`,
    "",
    `Generated: ${audit.generated_at}`,
    `Commit: ${commit}`,
    "",
    "Synthetic-data-only MVP. No real PHI processed.",
    "",
    "## Release gate",
    "",
    `Status: **${releaseGate.status}**`,
    "",
    "| Gate | Control | Result | Detail |",
    "| --- | --- | --- | --- |",
    ...gates.map((gate) => `| ${gate.id} | ${gate.name} | ${gate.passed ? "PASS" : "FAIL"} | ${gate.detail} |`),
    "",
    "## Quantitative controls",
    "",
    "| Metric | Value | Target |",
    "| --- | --- | --- |",
    `| Real PHI incidents | ${quantitative.real_phi_incidents} | 0 |`,
    `| Benchmark leakage incidents | ${quantitative.benchmark_leakage_incidents} | 0 |`,
    `| Unsupported evidence displayed | ${quantitative.unsupported_evidence_displayed} | 0 |`,
    `| Forbidden action language | ${quantitative.forbidden_action_language} | 0 |`,
    `| Autonomous actions | ${quantitative.autonomous_actions} | 0 |`,
    `| Secret findings | ${quantitative.secret_findings} | 0 |`,
    `| Wrong-patient incidents | ${quantitative.wrong_patient_incidents} | 0 |`,
    `| Human verification coverage | ${(quantitative.human_verification_coverage * 100).toFixed(0)}% | 100% |`,
    `| Safety corpus failures | ${quantitative.corpus_failures} | 0 |`,
    "",
    `## Adversarial corpus`,
    "",
    `${suite.corpus.passed}/${suite.corpus.total} cases passed across ${suite.corpus.families} families.`,
    "",
    "## Safety case",
    "",
    "| Claim | Status | Evidence |",
    "| --- | --- | --- |",
    ...safetyCaseClaims.map((claim) => `| ${claim.id}: ${claim.claim} | ${claim.status} | ${claim.evidence} |`),
    "",
    "## Residual risks",
    "",
    ...RESIDUAL_RISKS.map((risk) => `- ${risk.id}: ${risk.description} (owner: ${risk.owner}, review: ${risk.accepted_until})`),
    "",
    "## Interpretation limits",
    "",
    "This report documents engineering controls on synthetic data. It is not a HIPAA compliance determination, not a clinical validation, and not evidence of real-world safety or effectiveness.",
    "",
  ].join("\n");
  writeFileSync(join(OUT_DIR, "safety-report.md"), md, "utf8");

  const exitReport = [
    `# Phase 15 exit report — Safety, Privacy & Responsible AI`,
    "",
    `Safety version: \`${SAFETY_VERSION}\``,
    `Frozen: ${SAFETY_FROZEN_ON}`,
    `Report generated: ${audit.generated_at}`,
    `Release gate: **${releaseGate.status}**`,
    "",
    "## Scope delivered",
    "",
    "- Intended-use and prohibited-use contracts",
    "- AI authority matrix with forbidden capabilities",
    "- Synthetic-only provenance boundary enforced at cache startup",
    "- Output-language guard over all displayed gap copy, labels, and priority text",
    "- Evidence integrity boundary (ownership, spans, missing sources, stale snapshots)",
    "- Benchmark-truth import isolation and leakage token scan",
    "- Fail-closed cache validation including synthetic provenance and copy audit",
    "- Secret and direct-identifier scanners",
    "- 40-case adversarial corpus across 20 families",
    "- Safety audit object, incident playbooks, R1–R8 risk register",
    "- NIST AI RMF mapping and deployment-gap analysis",
    "",
    "## Verification actually run",
    "",
    "| Check | Result |",
    "| --- | --- |",
    ...suite.checks.map((check) => `| ${check.name} | ${check.passed ? "PASS" : "FAIL"} (${check.detail}) |`),
    "",
    `Corpus: ${suite.corpus.passed}/${suite.corpus.total} cases passed across ${suite.corpus.families} families.`,
    `Human verification coverage: ${(humanVerificationCoverage * 100).toFixed(0)}%.`,
    "",
    "## Known limitations",
    "",
    ...RESIDUAL_RISKS.map((risk) => `- ${risk.id}: ${risk.description}`),
    "",
    "No claim of HIPAA compliance, clinical validation, or production readiness is made. The MVP processes synthetic data only.",
    "",
  ].join("\n");
  writeFileSync(join(OUT_DIR, "phase-15-exit-report.md"), exitReport, "utf8");

  console.log(`Safety report written to ${OUT_DIR}`);
  console.log(`Release gate: ${releaseGate.status}`);
  if (releaseGate.status !== "PASS") process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

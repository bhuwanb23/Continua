import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { verifyCandidateGap } from "@/lib/evidence";
import { createEvidenceVerificationContext } from "@/lib/evidence/version";
import { hashClinicalEvents } from "@/lib/clinical-events";
import {
  EVIDENCE_ARTIFACTS,
  corruptedCandidateBenchmark,
  executeEvidenceRun,
} from "./lib/evidence-run";
import { evaluateGroundingRun } from "./lib/evidence-grounding";

const root = process.cwd();
const evidenceSourceDir = join(root, "lib", "evidence");

function sourceFiles(dir: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) output.push(...sourceFiles(path));
    else if (path.endsWith(".ts")) output.push(path);
  }
  return output.sort();
}

function main(): void {
  const run = executeEvidenceRun({ runId: "phase7-validation", mode: "oracle", partition: "final" });
  const maria = executeEvidenceRun({ runId: "phase7-validation-maria", mode: "oracle", partition: "demo" });
  const corruption = corruptedCandidateBenchmark(run);
  const source = [
    ...sourceFiles(evidenceSourceDir).map((path) => readFileSync(path, "utf8")),
    readFileSync(join(root, "lib", "domain", "verified-gap.ts"), "utf8"),
  ].join("\n");

  const sourceById = new Map(run.records.map((record) => [record.source_doc_id, record]));
  const allPositive = run.results.flatMap((result) => result.bundle.positive);
  const allClaims = run.results.flatMap((result) => result.bundle.claims);
  const allAbsence = run.results.flatMap((result) => result.bundle.absence);
  const allPolicy = run.results.flatMap((result) => result.bundle.policy);
  const allExplanations = run.verified.map((gap) => gap.explanation).join("\n");

  const gateA = run.verified.every(
    (gap) =>
      gap.evidence_bundle.positive.length > 0 &&
      gap.evidence_bundle.claim_coverage === 1 &&
      gap.evidence_bundle.positive.every((item) => {
        const record = sourceById.get(item.source_doc_id);
        return Boolean(record && record.patient_id === gap.patient_id && item.verified);
      }),
  );

  const gateB = run.verified.every((gap) =>
    gap.evidence_bundle.positive.every((item) => sourceById.get(item.source_doc_id)?.patient_id === gap.patient_id),
  );

  const gateC = run.verified.every(
    (gap) =>
      gap.evidence_bundle.positive.every((item) => item.verified && item.verification_score >= 0.85) &&
      gap.evidence_bundle.claims.filter((claim) => claim.required).every((claim) => claim.supported),
  );

  const gateD = run.verified.every((gap) =>
    gap.evidence_bundle.absence.every((item) => item.verified && item.matching_event_count === 0),
  );

  const gateE = run.verified.every((gap) => {
    const metadata = gap.candidate.metadata;
    if (metadata.kind !== "missed_followup") {
      return gap.evidence_bundle.policy.every((item) => item.source === "benchmark_policy");
    }
    const referral = run.events.find((event) => event.event_id === metadata.referral_event_id);
    if (!referral || referral.event_type !== "referral") return false;
    const expected = referral.typed.window_source === "document" ? "document_extracted" : "benchmark_policy";
    return gap.evidence_bundle.policy.every((item) => item.source === expected);
  });

  const gateF =
    run.suppressed.every((result) => result.status === "suppressed" && result.bundle.failures.length > 0) &&
    run.verified.every((gap) => gap.evidence_bundle.failures.length === 0) &&
    corruption.total > 0 &&
    corruption.accepted === 0;

  const staleCandidate = JSON.parse(JSON.stringify(run.candidates[0]));
  const extraEvent = {
    ...JSON.parse(JSON.stringify(run.events[0])),
    event_id: "phase7-stale-check-event",
    date: "2026-01-01",
  };
  const staleEvents = [...run.events, extraEvent];
  const staleContext = createEvidenceVerificationContext(staleEvents, run.records, {
    event_store_hash: hashClinicalEvents(staleEvents),
  });
  const staleResult = verifyCandidateGap(staleCandidate, staleContext);
  const gateG = staleResult.bundle.failures.some((failure) => failure.code === "EV-011");

  const unsafeLanguage = /did not see|did not happen|unnecessary|failed monitoring|noncompliant|medically necessary|clinically indicated|diagnose|prescribe/i;
  const gateH = !unsafeLanguage.test(allExplanations) && run.verified.every((gap) => !("confidence" in gap));

  const groundingPath = join(EVIDENCE_ARTIFACTS, "phase7-oracle-final", "grounding-report.json");
  if (!existsSync(groundingPath)) {
    mkdirSync(join(EVIDENCE_ARTIFACTS, "phase7-oracle-final"), { recursive: true });
    writeFileSync(groundingPath, `${JSON.stringify(evaluateGroundingRun(run), null, 2)}\n`, "utf8");
  }
  const grounding = JSON.parse(readFileSync(groundingPath, "utf8")) as Record<string, unknown>;
  const gateI = Boolean(
    grounding &&
    grounding.input_candidate_gaps === run.candidates.length &&
    grounding.verified_gaps === run.verified.length &&
    grounding.suppressed_gaps === run.suppressed.length,
  );

  const mariaTypes = new Set(maria.verified.map((gap) => gap.gap_type));
  const gateJ =
    maria.verified.length === 3 &&
    maria.suppressed.length === 0 &&
    mariaTypes.size === 3 &&
    maria.verified.every((gap) => gap.evidence_bundle.claim_coverage === 1);

  const forbiddenModelTokens = ["OPENAI", "ANTHROPIC", "openai", "anthropic", "fetch(", "http://", "https://"];
  const gateK = !forbiddenModelTokens.some((token) => source.includes(token));
  const forbiddenLabelTokens = ["ground_truth", "truth-events", "@/lib/generator", "fixture_key", "P-001-maria", "new Date(", "Date.now(", "Math.random"];
  const foundLabelTokens = forbiddenLabelTokens.filter((token) => source.includes(token));
  const gateL = foundLabelTokens.length === 0;

  const firstCandidate = run.candidates[0]!;
  const deterministicA = verifyCandidateGap(
    JSON.parse(JSON.stringify(firstCandidate)),
    createEvidenceVerificationContext(run.events, run.records, { event_store_hash: run.event_store_hash }),
  );
  const deterministicB = verifyCandidateGap(
    JSON.parse(JSON.stringify(firstCandidate)),
    createEvidenceVerificationContext(run.events, run.records, { event_store_hash: run.event_store_hash }),
  );
  const gateM = JSON.stringify(deterministicA.verified_gap) === JSON.stringify(deterministicB.verified_gap);

  const gates = [
    { gate: "A", name: "Provenance", pass: gateA, detail: `${allPositive.length} positive sources; every displayed gap has complete lineage.` },
    { gate: "B", name: "Ownership", pass: gateB, detail: "No cross-patient source document appears in a verified gap." },
    { gate: "C", name: "Positive Evidence", pass: gateC, detail: `${allClaims.filter((claim) => claim.supported).length}/${allClaims.length} required claims supported.` },
    { gate: "D", name: "Absence Evidence", pass: gateD, detail: `${allAbsence.length} absence queries re-executed with zero qualifying matches.` },
    { gate: "E", name: "Policy Transparency", pass: gateE, detail: `${allPolicy.length} policy items preserve benchmark-vs-document provenance.` },
    { gate: "F", name: "Suppression", pass: gateF, detail: `corruption rejected ${corruption.rejected}/${corruption.total}; no failed evidence reached the verified set.` },
    { gate: "G", name: "Staleness", pass: gateG, detail: "A candidate from the previous event-store hash is rejected with EV-011." },
    { gate: "H", name: "Safety Language", pass: gateH, detail: "No unsupported certainty, diagnosis, prescribing, or generic confidence in verified gaps." },
    { gate: "I", name: "Evaluation", pass: gateI, detail: "Grounding report counts match the actual artifacts." },
    { gate: "J", name: "Maria", pass: gateJ, detail: `${maria.verified.length}/3 Maria gaps verified with full claim coverage.` },
    { gate: "K", name: "LLM Independence", pass: gateK, detail: "No model client, network, or credential reference in the trust layer." },
    { gate: "L", name: "Runtime Label Independence", pass: gateL, detail: foundLabelTokens.length === 0 ? "No ground-truth, generator, fixture, clock, or randomness reference." : `Found: ${foundLabelTokens.join(", ")}` },
    { gate: "M", name: "Determinism", pass: gateM, detail: "Repeated verification produces byte-equivalent VerifiedGap output." },
  ];
  const report = {
    status: gates.every((gate) => gate.pass) ? "PASS" : "FAIL",
    evidence_version: "evidence-v1",
    verified_gap_version: "verified-gap-v1",
    partition: "final",
    as_of: "2026-06-05",
    candidates: run.candidates.length,
    verified: run.verified.length,
    suppressed: run.suppressed.length,
    corruption,
    gates,
  };
  mkdirSync(EVIDENCE_ARTIFACTS, { recursive: true });
  writeFileSync(join(EVIDENCE_ARTIFACTS, "validation-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Phase 7 evidence validation: ${report.status}`);
  for (const gate of gates) console.log(`  Gate ${gate.gate} (${gate.name}): ${gate.pass ? "PASS" : "FAIL"} — ${gate.detail}`);
  if (report.status !== "PASS") process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  buildQueue,
  computePanelPriorities,
  priorityPanelIsFresh,
  validatePriorityPanel,
  validateQueue,
} from "@/lib/priority";
import { executePriorityRun, PRIORITY_ARTIFACTS, writeJson } from "./lib/priority-run";
import { evaluatePriorityRun } from "./lib/priority-eval";
import { runPrioritySensitivity } from "./lib/priority-sensitivity";

const root = process.cwd();
const prioritySourceDir = join(root, "lib", "priority");

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
  const run = executePriorityRun({ runId: "phase8-validation", partition: "all" });
  const evaluation = evaluatePriorityRun(run);
  const sensitivity = runPrioritySensitivity(run) as {
    variant_count: number;
    mean_top5_retention: number;
    min_top5_retention: number;
    top5_retention_percent: number;
    top1_stability_percent: number;
    rank1_changes: number;
  };
  const source = sourceFiles(prioritySourceDir).map((path) => readFileSync(path, "utf8")).join("\n");
  const panelJson = JSON.stringify(run.panel);
  const queueJson = JSON.stringify(run.queue);

  const forbiddenLanguage = [
    /risk_score/i,
    /risk_level/i,
    /clinical risk score/i,
    /patient risk score/i,
    /probability of harm/i,
    /predict(?:ed|ion)? (?:harm|deterioration|mortality)/i,
  ];
  const gateA =
    !forbiddenLanguage.some((pattern) => pattern.test(source)) &&
    !forbiddenLanguage.some((pattern) => pattern.test(queueJson)) &&
    !/(?<![a-z_])priority_score/.test(source) &&
    !/(?<![a-z_])priority_score/.test(queueJson);

  const eligibleIds = new Set(run.evidence.verified.map((gap) => gap.gap_id));
  const gateB =
    run.panel.ineligible_gaps.length === 0 &&
    run.panel.gap_priorities.length === run.evidence.verified.length &&
    run.panel.gap_priorities.every((gap) => eligibleIds.has(gap.gap_id)) &&
    run.panel.patient_priorities.filter((patient) => patient.rank !== null).every((patient) =>
      run.panel.gap_priorities.some((gap) => gap.patient_id === patient.patient_id),
    );

  const fresh = computePanelPriorities({
    patient_ids: run.evidence.patient_ids,
    gaps: run.evidence.verified,
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: run.evidence.event_store_hash,
  });
  const gateC = JSON.stringify(fresh) === panelJson;

  const invariantFailures = validatePriorityPanel(run.panel);
  const queueFailures = validateQueue(run.queue, run.panel, 5);
  const gateD =
    invariantFailures.length === 0 &&
    run.panel.patient_priorities.every((patient) => patient.breakdown.secondary_bonus <= 0.3);

  const reversed = computePanelPriorities({
    patient_ids: [...run.evidence.patient_ids].reverse(),
    gaps: [...run.evidence.verified].reverse(),
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: run.evidence.event_store_hash,
  });
  const originalQueue = buildQueue(run.panel, run.evidence.verified, run.patients, 5);
  const alteredQueue = buildQueue(
    run.panel,
    run.evidence.verified,
    run.patients.map((patient) => ({ ...patient, display_name: `Synthetic ${patient.patient_id.slice(0, 6)}` })),
    5,
  );
  const gateE =
    JSON.stringify(reversed) === panelJson &&
    originalQueue.every((item, index) => {
      const altered = alteredQueue[index];
      return Boolean(
        altered &&
        altered.patient_priority_score === item.patient_priority_score &&
        altered.rank === item.rank &&
        altered.priority_band === item.priority_band &&
        JSON.stringify(altered.top_gap) === JSON.stringify(item.top_gap),
      );
    });

  const gateF =
    sensitivity.mean_top5_retention >= 0.8 &&
    sensitivity.min_top5_retention >= 0.6 &&
    sensitivity.rank1_changes <= 2;

  const gateG = run.queue.every(
    (item) =>
      item.explanation.arithmetic.includes("gap raw =") &&
      item.explanation.arithmetic.includes("patient raw =") &&
      item.explanation.factors.severity_weight > 0 &&
      item.explanation.factors.temporal_factor > 0 &&
      item.explanation.factors.actionability_weight > 0 &&
      item.explanation.other_verified_issues === item.verified_gap_count - 1,
  );

  const gateH =
    queueFailures.length === 0 &&
    run.queue.length === 5 &&
    run.queue.every((item, index) => item.rank === index + 1) &&
    run.queue.every((item) => item.priority_band === run.panel.patient_priorities.find((patient) => patient.patient_id === item.patient_id)?.priority_band);

  const quality = evaluation["quality"] as { top5_precision: number | null; top5_gap_truth_matches: number };
  const queueQuality = evaluation["queue"] as {
    all_queue_gaps_verified: boolean;
    unverified_gaps_ranked: number;
  };
  const determinism = evaluation["determinism"] as {
    repeat_queue_differences: number;
    formula_reproduced: boolean;
  };
  const gateI =
    quality.top5_precision === 1 &&
    quality.top5_gap_truth_matches === run.queue.length &&
    queueQuality.all_queue_gaps_verified === true &&
    queueQuality.unverified_gaps_ranked === 0 &&
    determinism.repeat_queue_differences === 0 &&
    determinism.formula_reproduced === true;

  const maria = evaluation["maria"] as {
    verified_gap_count: number;
    patient_priority_score: number;
    priority_band: string;
    rank: number | null;
    gap_scores: Array<{ gap_priority_score: number; priority_band: string }>;
  };
  const mariaId = run.patients.find((patient) => patient.fixture_key === "P-001-maria")?.patient_id;
  const mariaPriority = run.panel.patient_priorities.find((patient) => patient.patient_id === mariaId);
  const gateJ =
    maria.verified_gap_count === 3 &&
    maria.gap_scores.length === 3 &&
    Boolean(mariaPriority) &&
    mariaPriority?.patient_priority_score === maria.patient_priority_score &&
    mariaPriority?.priority_band === maria.priority_band &&
    mariaPriority?.rank === maria.rank &&
    !source.includes("P-001-maria") &&
    !source.includes("6fc752d8-8b56-5977-b41d-0b77c8ecea28") &&
    !source.includes("oncology_bonus");

  const forbiddenRuntimeTokens = [
    "fetch(",
    "http://",
    "https://",
    "Date.now(",
    "new Date(",
    "Math.random(",
    "openai",
    "anthropic",
  ];
  const foundRuntimeTokens = forbiddenRuntimeTokens.filter((token) => source.includes(token));
  const gateK = foundRuntimeTokens.length === 0;

  const deterministicA = computePanelPriorities({
    patient_ids: run.evidence.patient_ids,
    gaps: run.evidence.verified,
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: run.evidence.event_store_hash,
  });
  const deterministicB = computePanelPriorities({
    patient_ids: run.evidence.patient_ids,
    gaps: run.evidence.verified,
    evaluation_as_of_date: "2026-06-05",
    event_store_hash: run.evidence.event_store_hash,
  });
  const gateL = JSON.stringify(deterministicA) === JSON.stringify(deterministicB);

  const stale = !priorityPanelIsFresh(run.panel, run.evidence.verified.slice(1));
  const gateM = stale && run.panel.priority_version === "priority-v1" && run.panel.verified_gap_set_hash.length === 64;

  const gateN =
    run.panel.patient_priorities.every((patient) => {
      if (patient.patient_priority_score === 0) return patient.priority_band === "NONE";
      return patient.priority_band !== "NONE";
    }) &&
    run.panel.patient_priorities.every((patient) => {
      const score = patient.patient_priority_score;
      const expected = score >= 80 ? "P1" : score >= 60 ? "P2" : score >= 35 ? "P3" : score >= 1 ? "P4" : "NONE";
      return patient.priority_band === expected;
    });

  const gates = [
    { gate: "A", name: "Semantic Honesty", pass: gateA, detail: "Priority is workflow triage; no clinical-risk field or generic priority_score appears." },
    { gate: "B", name: "Eligibility", pass: gateB, detail: `${run.panel.gap_priorities.length} ranked gaps, all from the verified set; ${run.panel.ineligible_gaps.length} ineligible.` },
    { gate: "C", name: "Formula", pass: gateC, detail: "Fresh deterministic recomputation is byte-equivalent to the built panel." },
    { gate: "D", name: "Aggregation", pass: gateD, detail: `Top issue dominates; ${invariantFailures.length} invariant failure(s); secondary bonus capped at 0.30.` },
    { gate: "E", name: "Invariance", pass: gateE, detail: "Reversed input and altered patient labels leave scores, ranks, and top gaps unchanged." },
    { gate: "F", name: "Stability", pass: gateF, detail: `Top-5 retention mean=${sensitivity.top5_retention_percent}% min=${sensitivity.min_top5_retention}; rank-1 changes=${sensitivity.rank1_changes}/${sensitivity.variant_count}.` },
    { gate: "G", name: "Explainability", pass: gateG, detail: "Every queue item exposes factors and gap/patient arithmetic." },
    { gate: "H", name: "Queue", pass: gateH, detail: `Top-K=${run.queue.length} is the deterministic ranked prefix; ${queueFailures.length} queue failure(s).` },
    { gate: "I", name: "Benchmark", pass: gateI, detail: `Top-5 precision=${String(quality.top5_precision)}; queue trust=${String(queueQuality.all_queue_gaps_verified)}; repeat differences=0.` },
    { gate: "J", name: "Demo Integrity", pass: gateJ, detail: `Maria has 3 verified gaps, score ${maria.patient_priority_score}/${maria.priority_band}, rank ${String(maria.rank)}; no patient-specific exception.` },
    { gate: "K", name: "Runtime Independence", pass: gateK, detail: foundRuntimeTokens.length === 0 ? "No model, network, clock, or randomness reference in lib/priority." : `Found: ${foundRuntimeTokens.join(", ")}` },
    { gate: "L", name: "Determinism", pass: gateL, detail: "Repeated panel computation is byte-equivalent." },
    { gate: "M", name: "Staleness", pass: gateM, detail: "A changed verified-gap set fails the freshness check; versions are stamped." },
    { gate: "N", name: "Score/Band", pass: gateN, detail: "Every patient score maps to its frozen P-band, with NONE only at zero." },
  ];

  const report = {
    status: gates.every((gate) => gate.pass) ? "PASS" : "FAIL",
    priority_version: "priority-v1",
    evaluation_as_of_date: "2026-06-05",
    patients: run.evidence.patient_ids.length,
    patients_with_verified_gaps: run.panel.ranked_patient_count,
    verified_gaps: run.evidence.verified.length,
    ranked_gaps: run.panel.gap_priorities.length,
    ineligible_gaps: run.panel.ineligible_gaps.length,
    queue: run.queue.map((item) => ({
      rank: item.rank,
      patient_id: item.patient_id,
      patient_priority_score: item.patient_priority_score,
      priority_band: item.priority_band,
      top_gap_type: item.top_gap.gap_type,
      headline: item.headline,
    })),
    sensitivity: {
      variant_count: sensitivity.variant_count,
      mean_top5_retention: sensitivity.mean_top5_retention,
      min_top5_retention: sensitivity.min_top5_retention,
      top1_stability_percent: sensitivity.top1_stability_percent,
      rank1_changes: sensitivity.rank1_changes,
    },
    gates,
  };

  writeJson(join(PRIORITY_ARTIFACTS, "validation-report.json"), report);
  console.log(`Phase 8 priority validation: ${report.status}`);
  for (const gate of gates) console.log(`  Gate ${gate.gate} (${gate.name}): ${gate.pass ? "PASS" : "FAIL"} — ${gate.detail}`);
  if (report.status !== "PASS") process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

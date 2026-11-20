import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CandidateGap } from "@/lib/domain";
import { createDetectionContext, detectCandidateGaps } from "@/lib/detectors";
import {
  createEvidenceVerificationContext,
  verifyCandidateGap,
} from "@/lib/evidence";
import { hashClinicalEvents } from "@/lib/clinical-events";
import { LlmRequestError } from "@/lib/extraction/provider";
import { retryWithPolicy, maxAttemptsFor } from "@/lib/reliability/retries";
import {
  createFaultInjector,
  InjectedFault,
  withInjectedDelay,
} from "@/lib/reliability/fault-injection";
import { createLatestRequestGuard } from "@/lib/ui/latest-request";
import { normalizeScore } from "@/lib/priority";
import { copyCache, cleanupCacheCopies, validateDir, writeCacheJson } from "@/tests/cache/support";
import { mariaEvidenceSetup } from "@/tests/support/evidence";
import { stableJson } from "@/lib/reliability/assertions";
import { RELIABILITY_DISCLAIMER, RELIABILITY_VERSION } from "@/lib/reliability/version";
import type {
  ReliabilityOutcome,
  ReliabilityScenario,
  ScenarioResult,
} from "@/lib/reliability/types";

interface FaultDefinition extends ReliabilityScenario {
  run: () => Promise<{ observed: string; outcome: ReliabilityOutcome }>;
}

const now = () => "2026-11-19T00:00:00.000Z";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const setup = mariaEvidenceSetup();
const followUp = setup.candidates.find((gap) => gap.gap_type === "missed_followup")!;
const detectionContext = createDetectionContext("2026-06-05", {
  event_store_hash: setup.context.event_store_hash,
});

async function expectSuppressed(candidate: CandidateGap, context = setup.context): Promise<void> {
  const result = verifyCandidateGap(candidate, context);
  if (result.status !== "suppressed") throw new Error(`candidate was ${result.status}, not suppressed`);
}

const definitions: FaultDefinition[] = [
  {
    id: "FAULT-01",
    layer: "extraction",
    scenario: "LLM provider is unavailable",
    severity: "R2",
    injection: "FAIL_LLM test injector",
    expected_behavior: "The live extraction call fails closed; cached P0 reads are unaffected.",
    regression_test: "tests/reliability/extraction-failures.test.ts",
    run: async () => {
      const injector = createFaultInjector(["FAIL_LLM"], now);
      try {
        injector.guard("FAIL_LLM", () => "events");
        throw new Error("fault did not activate");
      } catch (error) {
        if (!(error instanceof InjectedFault)) throw error;
      }
      return {
        observed: `InjectedFault recorded; ${injector.activations().length} activation.`,
        outcome: "FAILED_SAFE",
      };
    },
  },
  {
    id: "FAULT-02",
    layer: "extraction",
    scenario: "Rate limit recovers on the third bounded attempt",
    severity: "R3",
    injection: "429 on attempts 1-2",
    expected_behavior: "Two retries, then success, never more than three attempts.",
    regression_test: "tests/reliability/extraction-failures.test.ts",
    run: async () => {
      let calls = 0;
      const result = await retryWithPolicy({
        kind: "rate_limit",
        run: async () => {
          calls += 1;
          if (calls < 3) throw new LlmRequestError("429", { retryable: true, status: 429 });
          return "ok";
        },
      });
      return {
        observed: `${result.attempts} attempts, delays ${result.delays_ms.join("/")} ms.`,
        outcome: result.value === "ok" && calls === 3 ? "RECOVERED" : "UNSAFE_FAILURE",
      };
    },
  },
  {
    id: "FAULT-03",
    layer: "extraction",
    scenario: "Invalid API key cannot be retried",
    severity: "R2",
    injection: "401 with retryable=false",
    expected_behavior: "One attempt and a controlled rejection.",
    regression_test: "tests/reliability/extraction-failures.test.ts",
    run: async () => {
      let calls = 0;
      try {
        await retryWithPolicy({
          kind: "invalid_api_key",
          run: async () => {
            calls += 1;
            throw new LlmRequestError("401", { retryable: false, status: 401 });
          },
        });
      } catch {
        /* expected */
      }
      return {
        observed: `${calls} call(s); max attempts ${maxAttemptsFor("invalid_api_key")}.`,
        outcome: calls === 1 ? "FAILED_SAFE" : "UNSAFE_FAILURE",
      };
    },
  },
  {
    id: "FAULT-04",
    layer: "extraction",
    scenario: "Malformed JSON is bounded and rejected",
    severity: "R2",
    injection: "invalid_json on every attempt",
    expected_behavior: "Exactly three attempts, then a controlled error.",
    regression_test: "tests/reliability/extraction-failures.test.ts",
    run: async () => {
      let calls = 0;
      try {
        await retryWithPolicy({
          kind: "invalid_json",
          run: async () => {
            calls += 1;
            throw new LlmRequestError("invalid JSON", { retryable: true });
          },
        });
      } catch {
        /* expected */
      }
      return {
        observed: `${calls} call(s), controlled failure.`,
        outcome: calls === 3 ? "FAILED_SAFE" : "UNSAFE_FAILURE",
      };
    },
  },
  {
    id: "FAULT-05",
    layer: "detectors",
    scenario: "One failed document makes the patient PARTIAL",
    severity: "R1",
    injection: "PARTIAL_EXTRACTION completeness",
    expected_behavior: "Absence-derived gaps are suppressed; positive duplicate fact remains.",
    regression_test: "tests/reliability/partial-patient.test.ts",
    run: async () => {
      const gaps = detectCandidateGaps(setup.events, {
        ...detectionContext,
        patient_completeness: "PARTIAL",
      });
      const types = gaps.map((gap) => gap.gap_type);
      const hasAbsence = types.includes("missed_followup") || types.includes("med_monitoring");
      return {
        observed: `Gap types: ${types.join(", ") || "none"}; absence-derived present: ${hasAbsence}.`,
        outcome: hasAbsence ? "UNSAFE_FAILURE" : "DEGRADED",
      };
    },
  },
  {
    id: "FAULT-06",
    layer: "evidence",
    scenario: "A source document is deleted",
    severity: "R2",
    injection: "DROP_SOURCE_DOC via empty record set",
    expected_behavior: "All evidence verification is suppressed.",
    regression_test: "tests/reliability/evidence.test.ts",
    run: async () => {
      const context = createEvidenceVerificationContext([], [], {
        event_store_hash: setup.context.event_store_hash,
      });
      await expectSuppressed(followUp, context);
      return { observed: "All candidates suppressed without source documents.", outcome: "FAILED_SAFE" };
    },
  },
  {
    id: "FAULT-07",
    layer: "evidence",
    scenario: "A source span is altered",
    severity: "R2",
    injection: "ALTER_SOURCE_SPAN",
    expected_behavior: "Evidence fails closed instead of showing an ungrounded claim.",
    regression_test: "tests/reliability/evidence.test.ts",
    run: async () => {
      const events = clone(setup.events);
      const target = events.find((event) => event.event_id === followUp.trigger_event_ids[0])!;
      target.source = { ...target.source, source_span: "never in the record" };
      const context = createEvidenceVerificationContext(events, setup.records, {
        event_store_hash: hashClinicalEvents(events),
      });
      const candidate = clone(followUp);
      candidate.event_store_hash = context.event_store_hash;
      await expectSuppressed(candidate, context);
      return { observed: "Candidate suppressed after span mismatch.", outcome: "FAILED_SAFE" };
    },
  },
  {
    id: "FAULT-08",
    layer: "evidence",
    scenario: "Evidence belongs to a different patient",
    severity: "R0",
    injection: "candidate.patient_id replaced",
    expected_behavior: "No wrong-patient evidence is displayed.",
    regression_test: "tests/reliability/evidence.test.ts",
    run: async () => {
      const candidate = clone(followUp);
      candidate.patient_id = "00000000-0000-5000-8000-000000000099";
      await expectSuppressed(candidate);
      return { observed: "Wrong-patient candidate suppressed.", outcome: "FAILED_SAFE" };
    },
  },
  {
    id: "FAULT-09",
    layer: "cache",
    scenario: "A cache artifact is edited without updating its hash",
    severity: "R0",
    injection: "CORRUPT_CACHE_HASH",
    expected_behavior: "Validation fails and no cache is served.",
    regression_test: "tests/reliability/cache.test.ts",
    run: async () => {
      cleanupCacheCopies();
      const dir = copyCache("rel-fault-hash");
      const path = join(dir, "patients.json");
      writeCacheJson(dir, "patients.json", JSON.parse(readFileSync(path, "utf8")));
      writeFileSync(path, `${readFileSync(path, "utf8")} `);
      const report = validateDir(dir);
      cleanupCacheCopies();
      return {
        observed: `Cache validation status: ${report.status}.`,
        outcome: report.status === "FAIL" ? "FAILED_SAFE" : "UNSAFE_FAILURE",
      };
    },
  },
  {
    id: "FAULT-10",
    layer: "priority",
    scenario: "NaN reaches the priority arithmetic",
    severity: "R0",
    injection: "normalizeScore(NaN)",
    expected_behavior: "Arithmetic rejects the value; NaN never reaches API/UI.",
    regression_test: "tests/reliability/priority.test.ts",
    run: async () => {
      try {
        normalizeScore(Number.NaN, 1);
        return { observed: "NaN was accepted.", outcome: "UNSAFE_FAILURE" };
      } catch {
        return { observed: "NaN rejected by normalizeScore.", outcome: "FAILED_SAFE" };
      }
    },
  },
  {
    id: "FAULT-11",
    layer: "api",
    scenario: "A response is delayed",
    severity: "R3",
    injection: "DELAY_API 50ms",
    expected_behavior: "The request still resolves after the injected delay.",
    regression_test: "tests/reliability/race-condition.test.ts",
    run: async () => {
      const injector = createFaultInjector(["DELAY_API"], now);
      const started = Date.now();
      const value = await withInjectedDelay(injector, "DELAY_API", 50, async () => "payload");
      const elapsed = Date.now() - started;
      return {
        observed: `Resolved ${value} after ${elapsed} ms.`,
        outcome: elapsed >= 45 ? "DEGRADED" : "UNSAFE_FAILURE",
      };
    },
  },
  {
    id: "FAULT-12",
    layer: "ux",
    scenario: "Rapid patient navigation produces a late response",
    severity: "R0",
    injection: "two overlapping request tokens",
    expected_behavior: "Only the newest request can update the view.",
    regression_test: "tests/reliability/race-condition.test.ts",
    run: async () => {
      const guard = createLatestRequestGuard();
      const first = guard.begin();
      guard.begin();
      return {
        observed: `Previous token current: ${first.isCurrent()}.`,
        outcome: first.isCurrent() ? "UNSAFE_FAILURE" : "FAILED_SAFE",
      };
    },
  },
  {
    id: "FAULT-13",
    layer: "determinism",
    scenario: "Repeated detection runs on identical input",
    severity: "R1",
    injection: "100 in-process repeats",
    expected_behavior: "Semantically identical candidate sets.",
    regression_test: "tests/reliability/determinism.test.ts",
    run: async () => {
      const expected = stableJson(detectCandidateGaps(setup.events, detectionContext));
      let differences = 0;
      for (let run = 0; run < 100; run += 1) {
        if (stableJson(detectCandidateGaps(setup.events, detectionContext)) !== expected) differences += 1;
      }
      return {
        observed: `100 repeats, ${differences} semantic differences.`,
        outcome: differences === 0 ? "RECOVERED" : "UNSAFE_FAILURE",
      };
    },
  },
  {
    id: "FAULT-14",
    layer: "cache",
    scenario: "The cached benchmark report is mutated",
    severity: "R2",
    injection: "evaluation.json status changed",
    expected_behavior: "Cache validation fails closed.",
    regression_test: "tests/reliability/cache.test.ts",
    run: async () => {
      cleanupCacheCopies();
      const dir = copyCache("rel-fault-benchmark");
      const evaluation = JSON.parse(readFileSync(join(dir, "evaluation.json"), "utf8"));
      evaluation.status = "FAILED";
      writeCacheJson(dir, "evaluation.json", evaluation);
      const report = validateDir(dir);
      cleanupCacheCopies();
      return {
        observed: `Cache validation status: ${report.status}.`,
        outcome: report.status === "FAIL" ? "FAILED_SAFE" : "UNSAFE_FAILURE",
      };
    },
  },
];

async function main(): Promise<void> {
  const started = Date.now();
  const results: ScenarioResult[] = [];
  for (const definition of definitions) {
    const scenarioStarted = Date.now();
    let result: ScenarioResult;
    try {
      const observed = await definition.run();
      result = {
        id: definition.id,
        layer: definition.layer,
        scenario: definition.scenario,
        severity: definition.severity,
        expected_behavior: definition.expected_behavior,
        observed_behavior: observed.observed,
        outcome: observed.outcome,
        status: observed.outcome === "UNSAFE_FAILURE" ? "FAIL" : "PASS",
        regression_test: definition.regression_test,
        duration_ms: Date.now() - scenarioStarted,
      };
    } catch (error) {
      result = {
        id: definition.id,
        layer: definition.layer,
        scenario: definition.scenario,
        severity: definition.severity,
        expected_behavior: definition.expected_behavior,
        observed_behavior: error instanceof Error ? error.message : String(error),
        outcome: "UNSAFE_FAILURE",
        status: "FAIL",
        regression_test: definition.regression_test,
        duration_ms: Date.now() - scenarioStarted,
      };
    }
    results.push(result);
    console.log(`${result.status} ${result.id} ${result.outcome} ${result.scenario}`);
  }

  const unsafe = results.filter((result) => result.outcome === "UNSAFE_FAILURE");
  const blockers = results.filter((result) => result.severity === "R0" || result.severity === "R1");
  const artifact = {
    version: RELIABILITY_VERSION,
    generated_from: "scripts/reliability-faults.ts",
    note: RELIABILITY_DISCLAIMER,
    run_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    scenarios_total: results.length,
    scenarios_passed: results.filter((result) => result.status === "PASS").length,
    scenarios_failed: results.filter((result) => result.status === "FAIL").length,
    unsafe_failures: unsafe.length,
    release_blocking_unresolved: blockers.filter((result) => result.status === "FAIL").length,
    results,
  };
  const dir = join(process.cwd(), "artifacts", "reliability");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "fault-results.json"), `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: unsafe.length === 0 ? "PASS" : "FAIL", artifact: join(dir, "fault-results.json") }, null, 2));
  if (unsafe.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { describe, expect, it } from "vitest";
import { loadBenchmarkBundle } from "@/lib/evaluation/benchmark-bundle";
import { executeEvidenceRun } from "@/scripts/lib/evidence-run";
import { evaluatePriorityLayer } from "@/lib/benchmark/priority";
import { buildFailureFunnel } from "@/lib/benchmark/funnel";

describe("benchmark failure funnel", () => {
  it("reports one stage per truth gap in the dev partition", async () => {
    const benchmark = loadBenchmarkBundle();
    const patientIds = benchmark.partitions.dev.slice(0, 1);
    const patientSet = new Set(patientIds);
    const truthGaps = benchmark.contracts.truth_gaps.filter((gap) => patientSet.has(gap.patient_id));
    const run = executeEvidenceRun({ runId: "funnel-test", mode: "oracle", partition: "dev" });
    const oracleForPatient = {
      ...run,
      patient_ids: patientIds,
      candidates: run.candidates.filter((gap) => patientSet.has(gap.patient_id)),
      verified: run.verified.filter((gap) => patientSet.has(gap.patient_id)),
    };
    const priority = evaluatePriorityLayer({
      patientIds,
      gaps: oracleForPatient.verified,
      truthGaps,
      eventStoreHash: run.event_store_hash,
      patients: [],
    });
    const funnel = buildFailureFunnel({
      truthGaps,
      events: run.events.filter((event) => patientSet.has(event.patient_id)),
      candidates: oracleForPatient.candidates,
      verified: oracleForPatient.verified,
      priority,
    });
    expect(funnel.stages).toHaveLength(6);
    expect(funnel.truth_gaps).toBe(truthGaps.length);
  });
});

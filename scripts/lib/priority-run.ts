import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { VerifiedGap } from "@/lib/domain";
import {
  buildQueue,
  computePanelPriorities,
  toQueueApiResponse,
  type PriorityPanel,
  type QueueApiResponse,
  type QueueItem,
} from "@/lib/priority";
import {
  EVIDENCE_ARTIFACTS,
  executeEvidenceRun,
  parseOption,
  readJson,
  writeJson,
  type EvidenceRun,
} from "./evidence-run";

export { parseOption, readJson, writeJson };

export type PriorityPartition = "demo" | "final" | "dev" | "all";

export const PRIORITY_ARTIFACTS = join(process.cwd(), "artifacts", "priority");
export const PRIORITY_K = 5;
export const EVALUATION_DATE = "2026-06-05";

export interface PatientDisplayRecord {
  patient_id: string;
  display_name: string;
  fixture_key: string;
  demo_age: number;
  sex: string;
  primary_diagnosis: string;
}

export function loadPatientDisplays(): PatientDisplayRecord[] {
  const patients = readJson<{ patients: PatientDisplayRecord[] }>(
    join(process.cwd(), "data", "synthetic", "continua-synth-v1", "patients.json"),
  ).patients;
  return [...patients].sort((left, right) => {
    if (left.patient_id < right.patient_id) return -1;
    if (left.patient_id > right.patient_id) return 1;
    return 0;
  });
}

export interface PriorityRun {
  run_id: string;
  partition: PriorityPartition;
  evidence: EvidenceRun;
  panel: PriorityPanel;
  queue: QueueItem[];
  api: QueueApiResponse;
  patients: PatientDisplayRecord[];
  metadata: Record<string, unknown>;
}

export function executePriorityRun(input: {
  runId: string;
  partition?: PriorityPartition;
  k?: number;
}): PriorityRun {
  const partition = input.partition ?? "all";
  const k = input.k ?? PRIORITY_K;
  const evidence = executeEvidenceRun({
    runId: `${input.runId}-evidence`,
    mode: "oracle",
    partition,
  });
  const patients = loadPatientDisplays();
  const panel = computePanelPriorities({
    patient_ids: evidence.patient_ids,
    gaps: evidence.verified,
    evaluation_as_of_date: EVALUATION_DATE,
    event_store_hash: evidence.event_store_hash,
  });
  const queue = buildQueue(panel, evidence.verified, patients, k);
  const api = toQueueApiResponse("demo", panel, queue);

  return {
    run_id: input.runId,
    partition,
    evidence,
    panel,
    queue,
    api,
    patients,
    metadata: {
      run_id: input.runId,
      priority_version: "priority-v1",
      evidence_version: "evidence-v1",
      verified_gap_schema: "verified-gap-v1",
      detector_version: "gaps-v1",
      gap_policy_version: "gap-policy-v1",
      evaluation_as_of_date: EVALUATION_DATE,
      partition,
      patient_count: evidence.patient_ids.length,
      patients_with_verified_gaps: panel.ranked_patient_count,
      verified_gap_count: evidence.verified.length,
      ranked_gap_count: panel.gap_priorities.length,
      ineligible_gap_count: panel.ineligible_gaps.length,
      queue_k: k,
      queue_size: queue.length,
      verified_gap_set_hash: panel.verified_gap_set_hash,
      event_store_hash: evidence.event_store_hash,
      llm_calls: 0,
      raw_document_reads: 0,
      patient_specific_overrides: 0,
      evidence_run_id: evidence.run_id,
    },
  };
}

export function writePriorityRun(run: PriorityRun, options: { evaluation?: unknown; sensitivity?: unknown } = {}): string {
  const outDir = join(PRIORITY_ARTIFACTS, run.run_id);
  mkdirSync(outDir, { recursive: true });
  writeJson(join(outDir, "metadata.json"), run.metadata);
  writeJson(join(outDir, "verified-gaps.json"), { verified_gaps: run.evidence.verified });
  writeJson(join(outDir, "gap-priorities.json"), { gap_priorities: run.panel.gap_priorities });
  writeJson(join(outDir, "patient-priorities.json"), { patient_priorities: run.panel.patient_priorities });
  writeJson(join(outDir, "queue.json"), {
    panel_id: "demo",
    k: run.queue.length,
    items: run.queue,
  });
  writeJson(join(outDir, "queue-api.json"), run.api);
  writeJson(join(outDir, "ineligible-gaps.json"), { ineligible_gaps: run.panel.ineligible_gaps });
  if (options.evaluation !== undefined) writeJson(join(outDir, "evaluation.json"), options.evaluation);
  if (options.sensitivity !== undefined) writeJson(join(outDir, "sensitivity.json"), options.sensitivity);
  return outDir;
}

export function priorityContextFor(run: PriorityRun) {
  return {
    evaluation_as_of_date: EVALUATION_DATE,
    event_store_hash: run.evidence.event_store_hash,
  };
}

export function mariaPatientId(patients: readonly PatientDisplayRecord[]): string {
  const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
  if (!maria) throw new Error("Maria is missing from the synthetic panel");
  return maria.patient_id;
}

export function evidenceArtifactPath(runId: string, file: string): string {
  return join(EVIDENCE_ARTIFACTS, runId, file);
}

export type PriorityVerifiedGaps = VerifiedGap[];

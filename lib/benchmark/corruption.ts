import type { CandidateGap, SourceRecord } from "@/lib/domain";
import type { EvidenceVerificationContext } from "@/lib/evidence";
import { verifyCandidateGaps } from "@/lib/evidence";
import { TARGETS } from "./config";
import type { CorruptionBenchmark, CorruptionCase } from "./types";

type Mutation = "wrong_document" | "wrong_patient" | "altered_span" | "missing_policy" | "stale_event_store" | "missing_evidence";

function clone(candidate: CandidateGap): CandidateGap {
  return JSON.parse(JSON.stringify(candidate)) as CandidateGap;
}

function mutate(candidate: CandidateGap, mutation: Mutation, records: SourceRecord[]): CandidateGap {
  const next = clone(candidate);
  const first = next.evidence_refs[0];
  switch (mutation) {
    case "wrong_document": {
      if (first) {
        const other = records.find((record) => record.patient_id === candidate.patient_id && record.source_doc_id !== first.source_doc_id);
        if (other) first.source_doc_id = other.source_doc_id;
      }
      return next;
    }
    case "wrong_patient": {
      const other = records.find((record) => record.patient_id !== candidate.patient_id);
      if (other) next.patient_id = other.patient_id;
      return next;
    }
    case "altered_span": {
      if (first) first.source_span = `${first.source_span} [corrupted evidence text]`;
      return next;
    }
    case "missing_policy": {
      next.policy_version = "corrupted-policy-v0" as CandidateGap["policy_version"];
      return next;
    }
    case "stale_event_store": {
      next.event_store_hash = "0".repeat(64);
      return next;
    }
    case "missing_evidence": {
      next.evidence_refs = [];
      return next;
    }
  }
}

export function runCorruptionBenchmark(input: {
  candidates: CandidateGap[];
  records: SourceRecord[];
  context: EvidenceVerificationContext;
}): CorruptionBenchmark {
  const mutations: Mutation[] = [
    "wrong_document",
    "wrong_patient",
    "altered_span",
    "missing_policy",
    "stale_event_store",
    "missing_evidence",
  ];
  const base = input.candidates[0] ?? null;
  const cases: CorruptionCase[] = [];

  if (base === null) {
    return {
      status: "not_run",
      cases: [],
      total: 0,
      rejected: 0,
      rejection_rate: null,
      target: TARGETS.corruption_rejection,
      passed: false,
      not_run_reason: "No candidate gap was available to corrupt.",
    };
  }

  for (const mutation of mutations) {
    const corrupted = mutate(base, mutation, input.records);
    const result = verifyCandidateGaps([corrupted], input.context)[0];
    const suppressed = result?.status === "suppressed";
    cases.push({
      name: mutation,
      gap_id: base.gap_id,
      expected: "suppressed",
      observed: suppressed ? "suppressed" : "verified",
      passed: suppressed,
      failure_codes: result?.suppression?.failure_codes ?? [],
      reason: result?.suppression?.message ?? null,
    });
  }

  const rejected = cases.filter((entry) => entry.passed).length;
  return {
    status: "measured",
    cases,
    total: cases.length,
    rejected,
    rejection_rate: cases.length === 0 ? null : rejected / cases.length,
    target: TARGETS.corruption_rejection,
    passed: rejected === cases.length,
    not_run_reason:
      "Contradicted-absence corruption is covered by Phase 7 absence-policy tests and is not injected here because it requires mutating the event store rather than the evidence package.",
  };
}

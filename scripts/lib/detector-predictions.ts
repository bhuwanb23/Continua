import type { CandidateGap } from "@/lib/domain";
import type { GapPrediction } from "@/lib/evaluation/types";

export function candidateToPrediction(candidate: CandidateGap): GapPrediction {
  return {
    prediction_id: candidate.gap_id,
    patient_id: candidate.patient_id,
    gap_type: candidate.gap_type,
    trigger_event_ids: candidate.trigger_event_ids,
    identity: candidate.identity,
    evidence: candidate.evidence_refs.map((ref) => ({
      doc_id: ref.source_doc_id,
      quoted_span: ref.source_span,
    })),
    detector_version: candidate.detector_version,
    ...(candidate.window_days === undefined ? {} : { window_days: candidate.window_days }),
    ...(candidate.due_date === undefined ? {} : { due_date: candidate.due_date }),
    confidence: 1,
  };
}

export function candidatesToPredictions(candidates: CandidateGap[]): GapPrediction[] {
  return candidates.map(candidateToPrediction);
}

import type { CandidateGap } from "@/lib/domain";

/**
 * Removes duplicate candidates by stable identity and returns a deterministic
 * ordering. Different gap types are never merged.
 */
export function dedupeCandidateGaps(candidates: CandidateGap[]): CandidateGap[] {
  const byId = new Map<string, CandidateGap>();
  for (const candidate of candidates) {
    if (!byId.has(candidate.gap_id)) byId.set(candidate.gap_id, candidate);
  }
  return [...byId.values()].sort((left, right) => {
    const patientOrder = left.patient_id.localeCompare(right.patient_id);
    if (patientOrder !== 0) return patientOrder;
    const typeOrder = left.gap_type.localeCompare(right.gap_type);
    if (typeOrder !== 0) return typeOrder;
    return left.gap_id.localeCompare(right.gap_id);
  });
}

import type { EvidenceRef, MissedFollowupCandidate } from "@/lib/domain";

function mergeEvidence(left: EvidenceRef[], right: EvidenceRef[]): EvidenceRef[] {
  const seen = new Set<string>();
  const merged: EvidenceRef[] = [];
  for (const ref of [...left, ...right]) {
    const key = `${ref.event_id}:${ref.source_doc_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(ref);
  }
  return merged;
}

/**
 * One unresolved referral episode becomes one coordinator candidate. Referrals
 * with overlapping windows for the same patient/specialty are consolidated;
 * clearly separate episodes remain separate.
 */
export function consolidateFollowupCandidates(candidates: MissedFollowupCandidate[]): MissedFollowupCandidate[] {
  const groups = new Map<string, MissedFollowupCandidate[]>();
  for (const candidate of candidates) {
    const key = `${candidate.patient_id}|${candidate.metadata.specialty}`;
    const list = groups.get(key) ?? [];
    list.push(candidate);
    groups.set(key, list);
  }

  const output: MissedFollowupCandidate[] = [];
  for (const group of groups.values()) {
    const sorted = [...group].sort((left, right) => {
      const dateOrder = left.metadata.referral_date.localeCompare(right.metadata.referral_date);
      if (dateOrder !== 0) return dateOrder;
      return left.gap_id.localeCompare(right.gap_id);
    });
    let current = sorted[0];
    if (!current) continue;
    for (const next of sorted.slice(1)) {
      if (next.metadata.referral_date <= current.metadata.due_date) {
        const supporting: Set<string> = new Set<string>([
          ...current.metadata.supporting_referral_event_ids,
          next.metadata.referral_event_id,
          ...next.metadata.supporting_referral_event_ids,
        ]);
        const eventIds = [...new Set([...current.trigger_event_ids, ...next.trigger_event_ids])].sort();
        current = {
          ...current,
          trigger_event_ids: eventIds,
          identity: { ...current.identity, event_ids: eventIds },
          evidence_refs: mergeEvidence(current.evidence_refs, next.evidence_refs),
          metadata: {
            ...current.metadata,
            supporting_referral_event_ids: [...supporting].sort(),
          },
        };
      } else {
        output.push(current);
        current = next;
      }
    }
    output.push(current);
  }
  return output;
}

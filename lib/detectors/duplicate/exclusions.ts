import type { DuplicateEpisode } from "./grouping";
import { DUPLICATE_POLICY } from "./policy";

/**
 * Conservative suppressions. Unknown series status does not mean serial, and
 * copied/same-day records are not independent diagnostic care.
 */
export function isDuplicateEpisodeEligible(episode: DuplicateEpisode): boolean {
  if (episode.occurrences.length < 2) return false;
  if (DUPLICATE_POLICY.suppress_same_day && episode.same_day) return false;
  if (DUPLICATE_POLICY.suppress_explicit_series && episode.explicit_series) return false;
  return true;
}

import type { DiagnosticOccurrence } from "./identity";
import { daysBetween } from "../common/dates";
import { DUPLICATE_POLICY } from "./policy";

export interface DuplicateEpisode {
  diagnostic_kind: "lab" | "imaging";
  normalized_identity: string;
  occurrences: DiagnosticOccurrence[];
  same_day: boolean;
  explicit_series: boolean;
}

export function groupDuplicateEpisodes(occurrences: DiagnosticOccurrence[]): DuplicateEpisode[] {
  const byIdentity = new Map<string, DiagnosticOccurrence[]>();
  for (const occurrence of occurrences) {
    const list = byIdentity.get(occurrence.normalized_identity) ?? [];
    list.push(occurrence);
    byIdentity.set(occurrence.normalized_identity, list);
  }

  const episodes: DuplicateEpisode[] = [];
  for (const identityOccurrences of byIdentity.values()) {
    const sorted = [...identityOccurrences].sort((left, right) => {
      const dateOrder = left.date.localeCompare(right.date);
      if (dateOrder !== 0) return dateOrder;
      return left.event.event_id.localeCompare(right.event.event_id);
    });

    let current: DiagnosticOccurrence[] = [];
    const flush = (): void => {
      if (current.length < 2) {
        current = [];
        return;
      }
      const first = current[0];
      if (!first) {
        current = [];
        return;
      }
      const sameDay = current.some((occurrence, index) => index > 0 && occurrence.date === first.date);
      const explicitSeries = current.some((occurrence) => occurrence.explicit_series);
      episodes.push({
        diagnostic_kind: first.diagnostic_kind,
        normalized_identity: first.normalized_identity,
        occurrences: current,
        same_day: sameDay,
        explicit_series: explicitSeries,
      });
      current = [];
    };

    for (const occurrence of sorted) {
      const first = current[0];
      if (!first) {
        current = [occurrence];
        continue;
      }
      if (daysBetween(first.date, occurrence.date) <= DUPLICATE_POLICY.window_days) {
        current.push(occurrence);
      } else {
        flush();
        current = [occurrence];
      }
    }
    flush();
  }

  return episodes.sort((left, right) => {
    const identityOrder = left.normalized_identity.localeCompare(right.normalized_identity);
    if (identityOrder !== 0) return identityOrder;
    return left.occurrences[0]!.date.localeCompare(right.occurrences[0]!.date);
  });
}

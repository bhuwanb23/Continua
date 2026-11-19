# Duplicate Diagnostic Testing Policy

## Question

Does the frozen synthetic benchmark contain two distinct diagnostic occurrences
that are redundant under the benchmark policy?

This is not a universal medical-necessity rule.

## Diagnostic identity

### Labs

Labs compare on the normalized test code. The frozen aliases make these
equivalent when the alias table declares them equivalent:

- `CBC`
- `CBC with differential`
- `Complete Blood Count`

The canonical identity is `lab:<code>`.

### Imaging

Imaging compares on normalized modality plus normalized body region.

- MRI brain and MRI knee are not duplicates.
- The canonical identity is `imaging:<modality>:<region>`.

## Occurrences before comparisons

The detector consumes canonical occurrence-level events. If the same lab appears
in a report and again as a mention in another note, Phase 5 reconciliation should
have produced one occurrence. The detector also collapses same test/date/value
records before comparing occurrences.

## Window

The frozen duplicate window is **14 calendar days** for both lab and imaging
duplicates. This matches the frozen `continua-eval-v1` contracts.

## Rule

1. Group occurrences by normalized identity.
2. Sort by date.
3. Build episodes where the next occurrence is within 14 days of the episode
   start.
4. Apply exclusions.
5. Emit one candidate per eligible episode.

## Exclusions

- Any occurrence explicitly marked `series_status = explicit_series` suppresses
  the episode.
- Same-day entries are treated as one occurrence. Conservative suppression is
  preferred over inventing duplicate care.
- Copied documents resolving to one canonical occurrence produce no candidate.
- Unknown series status does not mean serial; it remains eligible.

## Grouping repeated occurrences

Three or more repeats in one episode produce one candidate, not three pair
alerts. The candidate records `occurrence_count`, all event IDs, and all
contributing evidence references.

## Severity

Workflow severity only:

- 3+ occurrences → `high`
- imaging duplicate → `high`
- two lab occurrences ≤ 7 days → `medium`
- two lab occurrences 8–14 days → `low`

## Required behavior

- D-N1 explicit weekly CBC → no gap
- D-N2 CBCs 21 days apart → no gap
- D-N3 MRI brain + MRI knee → no gap
- D-N4 same CBC copied into two documents → no gap
- D-N5 same-day same occurrence → no gap
- D-N6 CBC alias pair inside window without series context → eligible gap
- D-N7 3 repeated tests → one grouped candidate
- D-N8 unknown provider → deterministic result; provider identity alone does not
  determine duplication

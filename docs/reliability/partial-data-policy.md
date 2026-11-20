# Partial-Data Policy

Source of truth: `lib/reliability/completeness.ts` and
`PatientAnalysisCompleteness` in `lib/domain/candidate-gap.ts`.

## States

| State | Meaning |
| --- | --- |
| `COMPLETE` | Every available record was processed successfully. |
| `PARTIAL` | At least one record processed and at least one failed. |
| `FAILED` | No record could be processed, or there were no records. |

When no completeness value is supplied to a pure detection context, it defaults
to `COMPLETE` for backward compatibility with frozen benchmark inputs. Any path
that actually performed extraction must pass its real status; the default is
not an assertion that processing succeeded.

## Invariant

Absence-derived gap types are `missed_followup` and `med_monitoring`. They claim
that an event did **not** happen across the available record set. That claim is
trustworthy only when completeness is `COMPLETE`.

For `PARTIAL` or `FAILED`:

- absence-derived candidates are suppressed in detection;
- absence-derived evidence verification fails closed with `EV-008`;
- positive-fact gaps (for example a duplicated test that is present) may remain;
- the UI must show the honest incomplete copy, never "no issues found".

Suppression is not silent to the coordinator: the completeness state is
surfaced separately as incomplete processing. A suppressed gap must never be
reintroduced by retrying a display path or by falling back to cached absence
evidence.

## Verified boundaries

Tests cover COMPLETE producing all three gap types, PARTIAL and FAILED
suppressing every absence-derived gap, evidence verification refusing an
unestablished completeness state, and the exact user-facing copy. FAULT-05
confirms one failed document leaves the positive duplicate gap but no
absence-derived gap.

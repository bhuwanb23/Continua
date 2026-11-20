# Failure Taxonomy and Severity

## Outcomes

| Outcome | Meaning | Demo behavior |
| --- | --- | --- |
| `RECOVERED` | The system completed after a transient failure, within frozen bounds. | Continue; no user-visible alarm required. |
| `DEGRADED` | A feature is reduced or suppressed, but the output stays truthful. | Show honest incomplete/unavailable copy. |
| `FAILED_SAFE` | The operation is refused rather than producing untrusted output. | Explicit error or empty state, never fabricated data. |
| `UNSAFE_FAILURE` | Untrusted clinical-like output reached, or could reach, a user. | Release blocker. |

`UNSAFE_FAILURE` blocks release regardless of the severity assigned to the
scenario.

## Severity

| ID | Label | Release blocking | Definition |
| --- | --- | --- | --- |
| R0 | BLOCKER | Yes | Wrong-patient output, ungrounded gap, ground-truth leakage, silent corruption, real PHI exposure, or autonomous clinical action. |
| R1 | HIGH | Yes | Materially wrong workflow output: queue order, stale verified gap, wrong due date, or incomplete analysis shown complete. |
| R2 | MEDIUM | No, with documented acceptance | Feature unavailable or degraded without unsafe data. |
| R3 | LOW | No | Cosmetic or non-critical issue off the flagship path. |

## Conflict resolution

When mitigations compete, the earlier dimension wins:

1. trust and safety
2. data integrity
3. correctness
4. determinism
5. availability
6. performance
7. visual polish

A blank evidence panel is preferable to an ungrounded claim. A suppressed
absence-derived gap is preferable to a missed-follow-up alert built from records
that were never processed.

## Verified scenarios

`artifacts/reliability/fault-results.json` records 14 injected scenarios:
0 unsafe failures, 0 unresolved release blockers. Six exercised R0/R1 paths
(wrong-patient evidence, cache corruption, NaN priority input, late UI
response, partial-patient absence suppression, deterministic repeats); each
ended `FAILED_SAFE` or `DEGRADED`, never `UNSAFE_FAILURE`.

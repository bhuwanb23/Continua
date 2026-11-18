# Failure Taxonomy — continua-eval-v1

Every incorrect output is classifiable. Error cases are emitted to `error-cases.json` with a stable id, patient id, category, predicted gap id, truth gap id, scenario id when known, and a short summary.

## Extraction

| Code | Meaning |
|---|---|
| `EX-01` | Event missed. |
| `EX-02` | Wrong event type or unsupported extra event. |
| `EX-03` | Wrong date. |
| `EX-04` | Normalization failure for test, drug, specialty, or imaging identity. |
| `EX-05` | Wrong source attribution. |

Extraction errors explain comprehension failures; they must not be silently reclassified as gap-reasoning failures.

## Detection

| Code | Meaning |
|---|---|
| `GAP-01` | False-positive missed follow-up. |
| `GAP-02` | False-negative missed follow-up. |
| `GAP-03` | False-positive duplicate test. |
| `GAP-04` | False-negative duplicate test. |
| `GAP-05` | False-positive medication monitoring. |
| `GAP-06` | False-negative medication monitoring. |

Duplicate predictions are reported as the corresponding false-positive code and also appear in `duplicate_prediction_ids`.

## Evidence

| Code | Meaning |
|---|---|
| `EV-01` | Missing citation or unknown document. |
| `EV-02` | Incorrect source document ownership. |
| `EV-03` | Unsupported or unverifiable quoted span. |

Grounding failures suppress the candidate before display. A displayed gap with an `EV-*` failure is a benchmark failure, not a UI choice.

## Temporal

| Code | Meaning |
|---|---|
| `TIME-01` | Window calculation error. |
| `TIME-02` | Evaluation clock error. |

The evaluation clock is frozen at `2026-06-05`. Window arithmetic is UTC calendar-day arithmetic. Maria’s oncology referral window is 45 days and she is 3 days overdue; she is not 45 days overdue.

## Priority

| Code | Meaning |
|---|---|
| `PRIO-01` | Formula application error, non-finite score, or non-deterministic score. |
| `PRIO-02` | Unexpected ordering or uncapped low-confidence band. |

## Error analysis workflow

Metric → failure code → scenario family → root cause → pipeline fix → re-run. Do not respond to a low metric with random prompt changes. Example: duplicate precision 0.71 → six false positives → five are explicit serial CBCs → extraction dropped `series_status` → fix extraction/schema → rerun.

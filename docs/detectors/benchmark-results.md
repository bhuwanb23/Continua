# Gap Engine V1 Benchmark Results

These are measured results, not targets.

```text
CONTINUA GAP ENGINE V1
Detector:      gaps-v1
Policy:        gap-policy-v1
Evaluation:    continua-eval-v1
As-of:         2026-06-05
LLM calls:     0
```

## Oracle-event benchmark — final partition

60 patients, 41 planted gaps, 29 hard negatives.

| Detector | TP | FP | FN | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Missed follow-up | 19 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Duplicate testing | 9 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Medication monitoring | 13 | 0 | 0 | 1.00 | 1.00 | 1.00 |

- Macro F1: **1.00**
- Micro F1: **1.00**
- Hard-negative pass rate: **1.00** (29/29)

## Oracle-event benchmark — all 80 patients

| Detector | TP | FP | FN | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Missed follow-up | 26 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Duplicate testing | 20 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Medication monitoring | 20 | 0 | 0 | 1.00 | 1.00 | 1.00 |

- Macro F1: **1.00**
- Micro F1: **1.00**
- Hard-negative pass rate: **1.00** (35/35)

## Maria demo

1 patient, 3 planted gaps.

| Detector | TP | FP | FN | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Missed follow-up | 1 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Duplicate testing | 1 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Medication monitoring | 1 | 0 | 0 | 1.00 | 1.00 | 1.00 |

Hard-negative pass rate is not defined for the Maria-only demo because the demo
scope has no hard negatives.

## Extracted-event pipeline — final partition

60 patients, 41 planted gaps, 29 hard negatives.

| Detector | TP | FP | FN | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Missed follow-up | 19 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Duplicate testing | 9 | 0 | 0 | 1.00 | 1.00 | 1.00 |
| Medication monitoring | 13 | 0 | 0 | 1.00 | 1.00 | 1.00 |

- Macro F1: **1.00**
- Micro F1: **1.00**
- Hard-negative pass rate: **1.00** (29/29)

This run used the local `extractor-v1` fixture store. It proves the extraction →
canonical store → detector plumbing. It is not a live-model quality claim. See
`limitations.md`.

## Performance

Measured detector computation only, excluding artifact I/O:

| Measurement | Value |
| --- | ---: |
| Single patient p50 | 0.07 ms |
| Single patient p95 | 0.20 ms |
| 80-patient panel p50 | 1.72 ms |
| 80-patient panel p95 | 2.49 ms |
| RSS | 128.8 MB |

## Failure analysis

No false positives or false negatives were observed in the measured oracle and
fixture-extracted runs. The error taxonomy remains active for future extracted
runs and is written to `error-cases.json` for every evaluation.

## Artifacts

- `artifacts/detectors/phase6-oracle-final/eval-results.json`
- `artifacts/detectors/phase6-oracle-all/eval-results.json`
- `artifacts/detectors/phase6-maria-oracle/eval-results.json`
- `artifacts/detectors/phase6-extracted-final/eval-results.json`
- `artifacts/detectors/phase6-benchmark-summary.json`
- `artifacts/detectors/performance.json`
- `artifacts/detectors/validation-report.json`
- `artifacts/detectors/phase-6-freeze.json`

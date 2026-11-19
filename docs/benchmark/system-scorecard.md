# Continua System Scorecard

Final held-out run: `benchmark-20261119-1400-14edc3e-final` (60 patients, 41 truth gaps).

## Extraction (fixture replay, annotated 6-patient scope)

- Event precision: 1.000
- Event recall: 1.000
- Event F1: 1.000
- Date accuracy: 1.000
- Normalization accuracy: 0.295
- Source attribution accuracy: 1.000
- Span support rate: 1.000

## Oracle gap engine

- Missed follow-up F1: 1.000
- Duplicate test F1: 1.000
- Medication monitoring F1: 1.000
- Macro F1: 1.000

## End-to-end verified gaps

- Missed follow-up P/R/F1: 1.000 / 1.000 / 1.000
- Duplicate test P/R/F1: 1.000 / 1.000 / 1.000
- Medication monitoring P/R/F1: 1.000 / 1.000 / 1.000
- Macro F1: 1.000
- Micro F1: 1.000

## Trust

- Displayed gaps grounded: 100%
- Unsupported displayed claims: 0
- Wrong-patient citations: 0
- Citation validity: 1.000
- Span support rate: 1.000

## Queue

- Top-5 verified: 5/5
- Top-5 truth precision: 5/5
- Precision@1/3/5/10: 1.000 / 1.000 / 1.000 / 1.000
- Demographic invariance: PASS (0 violations)
- Deterministic repeat: PASS (0 differences)

## Performance

- Single patient p50 / p95: 8.40 ms / 14.35 ms
- 60-patient panel p50 / p95: 18.68 ms / 21.93 ms
- Cached queue read p50: 1.65 ms

## Hard negatives

- Verified pass rate: 100%

## Corruption

- Critical corruption rejection: 6/6 (100%)

## Baselines

- Predict nothing Macro F1: 0
- Naive keyword rules Macro F1: 0.444
- Oracle events upper bound Macro F1: 1.000
- Full hybrid fixture replay Macro F1: 1.000
- LLM-only gap judge: not run (no provider configured)

## Reproducibility

- Deterministic downstream repeat: identical

# Continua Benchmark V1 Final Report

Dataset: `continua-synth-v1`  
Benchmark: `continua-eval-v1`  
Final partition: 60 patients / 41 truth gaps  
Run ID: `benchmark-20261119-1400-14edc3e-final`  
Git: `14edc3e`  
Evaluation date: `2026-06-05`

## Extraction

- Event precision: 1.000
- Event recall: 1.000
- Event F1: 1.000
- Date accuracy: 1.000
- Normalization accuracy: 0.295
- Source attribution: 1.000
- Span support: 1.000

Extraction is fixture replay only; these numbers verify evaluation plumbing and frozen artifacts, not live extractor model quality.

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
- Hard-negative pass: 100%

## Trust

- Displayed gaps grounded: 100%
- Unsupported claims: 0
- Wrong-patient citations: 0

## Queue

- Top-5 verified: 5/5
- Top-5 truth precision: 5/5
- Demographic invariance: PASS
- Deterministic repeat: PASS

## Performance

- Single patient p50/p95: 8.40 ms / 14.35 ms
- 60-patient panel p50/p95: 18.68 ms / 21.93 ms
- Cached queue read p50: 1.65 ms

## Baselines

- Naive Macro F1: 0.444
- LLM-only Macro F1: not measured
- Continua Macro F1: 1.000

## Limitations

Synthetic-only benchmark. Not clinically validated. No real EHR/PHI evaluation. No patient-outcome claims.

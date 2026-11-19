# Continua Benchmark Protocol

## Benchmark identity

- Benchmark: `continua-benchmark-v1`
- Dataset: `continua-synth-v1`
- Evaluation set: `continua-eval-v1`
- Evaluation date: `2026-06-05`
- Final held-out run: `benchmark-20261119-1400-14edc3e-final`
- Git commit: `14edc3e`

## Modes

- Development mode uses the `dev` partition and permits inspection, fixes, and reruns.
- Final mode uses the `final` partition and is scored once after freeze.
- Development and final partitions are disjoint: 20 dev patients and 60 final patients.

## Layers

1. Extraction: event precision, recall, F1, date accuracy, normalization accuracy, source attribution, span support.
2. Oracle gap detection: deterministic gap rules against canonical truth events.
3. Extracted-event gap detection: full pipeline from frozen fixture extraction.
4. Evidence/trust: candidate vs verified metrics, grounding, corruption rejection.
5. Priority/ranking: determinism, demographic invariance, Top-5 verified/truth precision.
6. End-to-end: raw records through extraction, normalization, detection, evidence, priority.

## Hard gates

- Invalid benchmark artifacts: 0
- Dataset/benchmark hash mismatches: 0
- Held-out patient leakage: 0
- Displayed-gap grounding: 100%
- Unsupported displayed claims: 0
- Wrong-patient citations: 0
- Top-5 verified: 5/5
- Top-5 truth precision: 5/5
- Demographic-invariance violations: 0
- Downstream nondeterministic differences: 0

## Scope

This is a synthetic-only benchmark. It is not clinically validated and makes no patient-outcome or regulatory claims.

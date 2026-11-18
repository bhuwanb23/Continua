# Benchmark Card — continua-eval-v1

**Status:** FROZEN. Freeze stamp: `CONTINUA PHASE 3: continua-eval-v1 FROZEN`.
**Dataset:** `continua-synth-v1` (synthetic, de-identified by construction).
**Evaluation clock:** `2026-06-05`.
**Panel:** 80 patients, 485 documents, 26 providers.
**Labels:** 66 planted gaps (26 missed follow-up, 20 duplicate test, 20 medication monitoring), 42 positive patients, 38 negative patients.
**Hard negatives:** 35 scenarios across 13 families.
**Extraction gold:** 12 patients, 130 events.
**Partitions:** dev 20, final 60, patient overlap 0. Maria remains in dev/demo.

> The specification’s earlier 70-gap target was a design target. The frozen Phase 2 corpus contains 66 planted gaps. Phase 3 labels the corpus that exists; it does not invent gaps to match a target.

## What this benchmark measures

- Event extraction against a hand-labelled synthetic event manifest.
- Three continuity gap types: missed follow-up, duplicate test, medication monitoring.
- False-positive pressure from explicit hard-negative scenarios.
- Evidence validity: citation existence, document ownership, and quoted-span support.
- Deterministic priority behaviour: score validity, confidence band caps, and metamorphic ordering checks.
- Queue-oriented precision@5/coverage@5 when priorities are supplied.
- Latency when the runner supplies live or cached measurements.

## What this benchmark does not measure

- Clinical efficacy, patient outcomes, or quality of diagnosis.
- Physician accuracy or safety in real healthcare deployment.
- Generalization to real EHR data.
- Prose quality, summarization elegance, or UI polish.
- A causal effect from coordination workflow changes.
- Any performance number before an evaluator run. The benchmark can measure F1; Phase 3 does not claim an F1.

## Intended use

Use this benchmark to compare implementations that consume the frozen synthetic documents and emit the frozen prediction contract. Report results only with the eval version, extractor version, detector version, priority version, and partition. Emphasize the held-out `final` partition when discussing technical quality; use `demo` only for product visualization.

## Prohibited uses

- Editing labels, identities, partitions, or matching semantics to improve a score.
- Training on the final partition or hand-tuning prompts to individual final patients.
- Reporting Maria/demo performance as generalization evidence.
- Calling this benchmark clinical validation.
- Reporting metrics without a run artifact under `artifacts/eval/<run-id>/`.

## Integrity

The benchmark manifest records SHA-256 hashes for ground truth, negatives, extraction gold, partitions, derived contracts, and the evaluator configuration. Any label, identity, partition, date, expected-outcome, matching-semantics, or metric-definition change requires a new eval version (`continua-eval-v2`).

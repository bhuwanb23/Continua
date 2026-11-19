# Evaluation story

## What we actually measured

Frozen run `benchmark-20261119-1400-14edc3e-final` (`continua-benchmark-v1`, dataset
`continua-synth-v1 / continua-eval-v1`, partition `final`, evaluation date 2026-06-05).

| Metric | Value | Support |
| --- | --- | --- |
| Held-out Macro F1 | 1.00 | 41 truth gaps across 3 supported gap types |
| Micro F1 | 1.00 | 41 truth gaps |
| Hard-negative pass rate | 1.00 | 29/29 adversarial cases, 11 families |
| Displayed-gap grounding | 1.00 | 41 displayed gaps, 50 evidence items |
| Unsupported displayed claims | 0 | 41 displayed gaps |
| Top-5 verified | 5/5 | architecture check |
| Top-5 truth precision | 5/5 | performance check |
| Demographic invariance violations | 0 | input-mutation test |
| Determinism differences | 0 | 2 repeat executions |

Per detector: missed follow-up 1.00 (n=19), repeat diagnostic 1.00 (n=9),
medication monitoring 1.00 (n=13). Precision and recall are 1.00 for each; we show n
because a perfect F1 on small support is not the same evidence as a perfect F1 on
thousands of cases.

## How to read these numbers

Extraction is **fixture replay**: a frozen event cache stands in for live model
output. Three consequences:

1. The gap pipeline is genuinely exercised end to end over frozen events.
2. Live extractor quality is **not measured**. The 61-event annotated extraction
   sample shows event F1 1.00 and date accuracy 1.00, but normalization accuracy is
   29.5% (18/61) — a real weak spot that rules currently tolerate.
3. Oracle events and fixture-replayed events produce identical gap metrics, so this
   run validates evaluation plumbing and determinism, not extraction robustness.

## Oracle vs end-to-end

- Oracle event stream → deterministic detectors: Macro F1 1.00 (diagnostic upper bound).
- Fixture-replayed extraction → detectors → evidence → priority: Macro F1 1.00.
- Difference: 0.00 in this run. A live model would be expected to separate them.

## Baselines

| System | Macro F1 | Hard negatives | Grounding |
| --- | --- | --- | --- |
| Predict nothing | 0.00 | 1.00 | not measured |
| Naive keyword rules | 0.44 | 0.62 | 1.00 |
| Oracle events (upper bound) | 1.00 | not measured | not measured |
| Continua hybrid (fixture replay) | 1.00 | 1.00 | 1.00 |
| LLM-only gap judge | not run | not run | not run |

The LLM-only baseline was **not run** (no live provider). No synthetic substitute is
reported. We do not know whether an LLM-only baseline would beat Continua on this
benchmark; we only claim that the naive baseline loses on precision and on
hard-negative resistance.

## Pipeline funnel

Displayed stages (all from the same run): 41 truth gaps → 41 correct candidates →
41 evidence-verified gaps → 41 ranked gaps → 5/5 top-5 truth matches.

**Anomaly disclosed:** the Phase-9 `failure-funnel.json` stage
`support_events_extracted` reports 0 while the same run scores 41/41 candidates.
Truth-gap support events are keyed in a different id space than the frozen canonical
event store, so that stage — and the per-gap `EXTRACTION` attribution derived from it
— is internally inconsistent with the metrics. Phase 14 does not repair or reselect
the frozen artifact. The proof layer omits the broken stage and shows the coherent
aggregate counts instead.

## Failure transparency

- 0 false positives and 0 false negatives in this run.
- 6/6 corrupted-evidence variants suppressed (wrong patient, wrong document, altered
  span, missing policy, stale event store, missing evidence).
- Normalization accuracy 29.5% is the weakest measured stage.
- Live extraction, real-EHR data, template drift, and rare specialty aliases remain
  untested.

## What the evidence gate did (and did not) do here

Ablating the evidence gate changes Macro F1 by 0.00 in this run because every
candidate already had valid evidence. Its measured value is trust and auditability —
plus a 6/6 rejection record on deliberately corrupted evidence — not an F1 gain.

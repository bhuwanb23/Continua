# Metric Definitions — continua-eval-v1

All metrics are computed from matched truth/prediction pairs. No metric is pre-filled, estimated, or invented. Null means “not measured” or “undefined denominator”; it never means zero.

## Detection confusion

For each gap type:

- **TP** — a prediction matched to one planted gap.
- **FP** — a prediction not matched to any planted gap, including duplicate predictions.
- **FN** — a planted gap with no matched prediction.
- **TN** — not enumerated for detection F1. Negative safety is measured separately.

## Per-type metrics

| Metric | Formula | Zero-denominator rule |
|---|---|---|
| Precision | TP / (TP + FP) | `null` when no predictions of that type |
| Recall | TP / (TP + FN) | `null` when no truth of that type |
| F1 | 2PR / (P + R) | `0` when P is null and recall is 0; `0` when P + R is 0; otherwise `null` if undefined |

No metric may be `NaN`, `Infinity`, or `undefined`. The evaluator asserts this before writing artifacts.

## Aggregate detection

- **Macro F1** — equal-weight mean of per-type F1 values that are defined. If no type has a defined F1, `null`. In the full benchmark all three types have definition, so the aggregate is equal weight across all three.
- **Micro F1** — F1 pooled over all gap instances (sum TP/FP/FN, then compute).
- **Hard-negative pass rate** — negative scenarios receiving no prediction for the declared detector target, divided by all negative scenarios. A target of `all` fails if the patient receives any prediction; a type-specific target fails only on a prediction of that type.

## Grounding

For every reported gap:

- **Citation validity** — cited document exists and belongs to the prediction’s patient.
- **Span support** — quoted span is an exact normalized substring or a token-level fuzzy match at or above `0.85`.
- **Grounded gap rate** — reported gaps whose every evidence item exists, is owned by the patient, and has a supported span.
- **Unsupported claim rate** — `1 - grounded_gap_rate`.
- **Display rule** — ungrounded candidates are suppressed before display. The benchmark reports both candidate and displayed grounding; displayed grounding is the architectural gate.

A gap with no evidence is not grounded and contributes an `EV-01` failure. A wrong owner contributes `EV-02`; an unsupported span contributes `EV-03`.

## Extraction

- **Event precision** — matched extracted events / extracted events.
- **Event recall** — matched gold events / gold events.
- **Event F1** — harmonic mean of event precision and recall.
- **Date accuracy** — matched events with a compatible date / matches.
- **Normalization accuracy** — matched events with all truth-declared normalized fields correct / matches that have scorable normalized fields.
- **Source attribution accuracy** — matched events citing the gold source document / matches.
- **Span support rate** — matched events whose predicted span is supported by the source / matches.

Event F1 is the headline. Normalization and source/citation accuracy are reported separately rather than collapsed into an arbitrary composite score.

## Priority

- **Deterministic** — repeated scoring of the same input is identical.
- **Formula applied** — every scored gap has a finite score in `[0, 100]`.
- **Confidence band cap** — confidence below `0.6` may not produce `CRITICAL` or `HIGH`.
- **Overdue monotonicity** — holding everything else equal, more overdue days must not decrease priority.
- **Confidence monotonicity** — holding everything else equal, lower confidence must not increase priority.
- **Precision@5** — true positive gaps among the top five ranked gaps.
- **Coverage@5** — planted gaps represented in the top five.

Priority measures internal ranking consistency, not clinical risk or patient outcomes.

## Latency

Latency is reported only when measured by the runner or supplied by a prediction artifact. Live and cached measurements are never combined. Null means not measured.

## Gate targets

Targets are not results: per-type precision ≥0.80, recall ≥0.70, F1 ≥0.75 desirable, macro F1 ≥0.75, hard-negative pass rate ≥0.90, displayed grounding 1.00, extraction accuracy ≥0.90, panel latency <60 s. Missing a target means reporting the actual value and explaining the failure mode.

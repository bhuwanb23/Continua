# Claim registry

Single source of truth: `lib/claims/registry.ts`. Export: `npm run export:claims` →
`artifacts/claims/{approved-claims.json,approved-claims.md,submission-metrics.json}`.
Validation: `npm run validate:claims` (measured values are compared against
`continua-demo-cache-v1/evaluation.json`).

## Taxonomy

| Class | Meaning |
| --- | --- |
| MEASURED | Actual Continua benchmark/system result |
| MODELED | Derived from measured values and/or explicit assumptions |
| SCENARIO_ASSUMPTION | Input chosen for the demo/business model |
| EXTERNAL_RESEARCH | Third-party evidence |
| FUTURE_TARGET | Not achieved |

Only `APPROVED` claims may appear in final artifacts. `DRAFT`, `VALIDATED`, and
`RETIRED` are blocked by `validateClaims`.

## Approved claims

| Claim | Class | Value | Support |
| --- | --- | --- | --- |
| benchmark-macro-f1 | MEASURED | 1.00 | 41 truth gaps |
| benchmark-micro-f1 | MEASURED | 1.00 | 41 truth gaps |
| detector-missed-followup-f1 | MEASURED | 1.00 | n=19 |
| detector-duplicate-test-f1 | MEASURED | 1.00 | n=9 |
| detector-med-monitoring-f1 | MEASURED | 1.00 | n=13 |
| hard-negative-pass-rate | MEASURED | 1.00 | 29 cases |
| displayed-gap-grounding | MEASURED | 1.00 | 41 gaps |
| unsupported-displayed-claims | MEASURED | 0 | 41 gaps |
| top5-verified | MEASURED | 5/5 | architecture |
| top5-truth-precision | MEASURED | 5/5 | performance |
| demographic-invariance-violations | MEASURED | 0 | input mutation |
| cached-queue-latency-p50 | MEASURED | 1.6514 ms | cached read path |
| live-pipeline-latency-p50 | MEASURED | 8.3956 ms | fixture replay |
| modeled-redirected-time | MODELED | formula | 4 assumptions |
| assumption-patients-reviewed-per-day | SCENARIO_ASSUMPTION | 20 | — |
| assumption-baseline-review-minutes | SCENARIO_ASSUMPTION | 8 | — |
| assumption-assisted-review-minutes | SCENARIO_ASSUMPTION | 6 | — |
| assumption-working-days-per-month | SCENARIO_ASSUMPTION | 20 | — |
| future-fhir-integration | FUTURE_TARGET | — | not built |
| future-real-ehr-deployment | FUTURE_TARGET | — | not built |
| future-clinical-validation | FUTURE_TARGET | — | synthetic only |

Total: 21 approved (13 measured, 1 modeled, 4 assumptions, 0 external, 3 future
targets), 0 unclassified.

## Copy standards enforced by review

- "Measured on continua-eval-v1" — never "proven".
- "Modeled potential time redirected" — never "time saved".
- "0 unsupported displayed claims in this benchmark run" — never "zero hallucinations" or "hallucination-free".
- "100% grounding on displayed gaps in our frozen synthetic benchmark" — never
  "100% medically accurate".

`npm run audit:claims` fails on banned overstatement phrases and lists quantitative
fragments needing manual review. Current unmatched fragments: the two numbers in the
superseded-Phase-10 disclosure on `/insights`, reviewed and intentionally retained.

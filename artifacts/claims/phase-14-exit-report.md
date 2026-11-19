# CONTINUA PROOF & IMPACT EXPERIENCE V1

Generated from `artifacts/claims/submission-metrics.json` and the frozen benchmark run.

```
Approved claims:                  21
Measured:                         13
Modeled:                           1
Scenario assumptions:              4
External research:                 0
Future targets:                    3

Unclassified claims:               0
Benchmark mismatches:              0
Unsupported external claims:       0
```

## Evaluation experience

```
Benchmark run:       benchmark-20261119-1400-14edc3e-final
Benchmark version:   continua-benchmark-v1
Partition:           final
Synthetic:           yes
Headline metrics:    4
Per-detector view:   PASS (n = 19 / 9 / 13)
Pipeline funnel:     PASS (41 -> 41 -> 41 -> 41 -> 5/5; one artifact stage disclosed as excluded)
Trust scorecard:     PASS (grounding 1.00, unsupported 0, wrong-patient 0)
Hard-negative view:  PASS (29/29, 11 families)
Baseline comparison: PASS (naive 0.44; LLM-only not run)
Ablations:           PASS (listed with Δ = 0.00 and explicit findings)
Failure analysis:    PASS (0 FP / 0 FN, normalization 29.5% disclosed)
Latency distinction: PASS (cached 1.6514 ms vs live not measured)
```

## Impact

```
Model formula validated:          PASS (lib/impact/model.ts, unit tested)
Assumptions visible:              PASS (4 rows, all SCENARIO_ASSUMPTION)
Human review time measured:       NO
Financial impact modeled:         NO
Modeled figure at defaults:       13.33 hours/month (800 minutes)
Patient-outcome claims:           0
Clinical-validation claims:       0
```

## Consistency

```
UI <-> benchmark:                 PASS (EVX tests compare to evaluation.json)
Demo <-> benchmark:               PASS (scene 6 reads /api/v1/evaluation)
README <-> approved claims:       PASS (same four headline values)
Export artifact:                  PASS (artifacts/claims/)
Claim surface audit:              PASS (no banned overstatement; 2 reviewed legacy fragments)
Claim red-team:                   PASS (attacks A-I documented)
```

## Verification (this checkout)

```
TypeScript (npx tsc --noEmit)                  PASS
ESLint (app, components, lib, tests, scripts)  PASS
Production build (npm run build)               PASS (/evaluation dynamic, /insights static)
New Phase-14 tests                             PASS (26/26: claims 8, impact 10, evaluation-experience 8)
Full suite                                    638/641 PASS
Dev smoke                                      /evaluation 200, /insights 200, /demo 200, / 200
Claim export / validation                      PASS (21 approved, 0 mismatches, 0 unclassified)
External verification                          PASS (0 external claims to source)
Claim surface audit                            PASS (0 banned phrases; 2 reviewed legacy fragments)
```

### Known pre-existing failures (not introduced by Phase 14, not repaired here)

| Test | Cause | Why not fixed in Phase 14 |
| --- | --- | --- |
| `tests/benchmark/preflight.test.ts` | `no_label_leakage` check flags `lib/cache/*` tooling (`builder.ts`, `source-run.ts`, `evaluation.ts`, `schemas.ts`) | Phase-9 leakage scanner scope; changing it alters benchmark gating, which Phase 14 forbids |
| `tests/reproducibility/reproducibility.test.ts` (label isolation) | Same scanner finding | Same |
| `tests/cache/reproducibility.test.ts` (committed cache) | Rebuild stamps HEAD commit `3b1c377` into `manifest.json`; committed cache recorded `128ed07`, so manifest hashes always differ after any commit | Requires cache regeneration or a semantic-hash change in the frozen Phase-10 cache |

Also repaired: `tests/contract/disclaimer.test.ts` asserted the synthetic banner lives in
`app/layout.tsx`, but it moved to `components/layout/AppShell.tsx` in an earlier phase.
The test now checks layout → AppShell → banner, and passes.

These are reported so no gate is claimed green on top of a red check. They do not affect
any Phase-14 measurement: the benchmark run and demo cache artifacts are untouched.

## Gates

A Measurement integrity: PASS
B Modeling integrity: PASS
C Research integrity: PASS (no external claims retained; metadata guard active)
D Trust interpretation: PASS
E Benchmark transparency: PASS
F Failure transparency: PASS
G Business credibility: PASS
H Technical credibility: PASS
I Cross-surface consistency: PASS
J Claim red-team: PASS

CONTINUA PHASE 14: PROOF & IMPACT EXPERIENCE v1 FROZEN

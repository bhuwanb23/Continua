# priority-v1 Benchmark Results

Generated from the frozen full synthetic panel on `2026-06-05`. All values are
measured by the local pipeline. No LLM or network call is involved.

## Panel

| Measure | Result |
|---|---:|
| Patients | 80 |
| Patients with ≥1 verified gap | 42 |
| Verified gaps | 66 |
| Ranked gaps | 66 |
| Ineligible gaps | 0 |
| Top K | 5 |
| Compression ratio | 16× (80 / 5) |
| Average verified gaps per flagged patient | 1.571 |

## Queue

| Rank | Band | Patient score | Verified gaps | Headline |
|---:|---|---:|---:|---|
| 1 | P1 | 89 | 3 | Warfarin monitoring appears unresolved · 132 days overdue |
| 2 | P1 | 86 | 2 | Warfarin monitoring appears unresolved · 96 days overdue |
| 3 | P1 | 86 | 3 | Oncology follow-up appears unresolved · 72 days overdue |
| 4 | P1 | 85 | 3 | Oncology follow-up appears unresolved · 65 days overdue |
| 5 | P1 | 84 | 2 | Warfarin monitoring appears unresolved · 139 days overdue |

## Queue quality

| Measure | Result |
|---|---:|
| Patients in Top-5 with a true benchmark gap | 5 / 5 |
| Top-5 precision | 1.0 |
| Top-5 top-gap truth matches | 5 / 5 |
| Queue gaps verified | 5 / 5 |
| Unverified gaps ranked | 0 |
| Queue trust | 100% |

Top-5 precision is patient-level against the frozen benchmark truth: the patient
has at least one true gap. It does not claim clinical prioritization accuracy.

## Determinism

| Measure | Result |
|---|---:|
| Repeat-run queue differences | 0 |
| Formula reproduced byte-equivalently | Yes |
| Tie instability | 0 |
| Patient-specific overrides | 0 |

## Sensitivity

| Measure | Result |
|---|---:|
| Mean Top-5 retention | 97.5% |
| Minimum Top-5 retention | 80.0% |
| Rank-1 stability | 100% |
| Rank-1 changes | 0 / 8 |

## Maria

| Measure | Result |
|---|---:|
| Verified gaps | 3 |
| Missed follow-up | 77 / P2 |
| Medication monitoring | 33 / P4 |
| Duplicate test | 26 / P4 |
| Patient score | 69 / P2 |
| Full-panel rank | 27 / 80 |

Maria is not forced to #1. Her score is reproduced by the public formula.

## Performance

| Operation | p50 | p95 |
|---|---:|---:|
| Gap scoring | 0.0042 ms | 0.0092 ms |
| Patient aggregation | 0.0014 ms | 0.0047 ms |
| Full 80-patient panel | 1.7649 ms | 3.7037 ms |
| Top-K + queue construction | 0.0295 ms | 0.0570 ms |

Performance varies by machine; the values above are from the frozen local run.

## Validation

`npm run validate:priority` passes all fourteen gates:

- semantic honesty
- verified-only eligibility
- exact formula recomputation
- bounded aggregation
- input/label invariance
- perturbation stability
- explainability
- deterministic Top-K
- measured benchmark integrity
- Maria demo integrity
- no LLM/network/clock/randomness
- determinism
- staleness
- score/band consistency

Artifacts are under `artifacts/priority/phase8-oracle-all/`.

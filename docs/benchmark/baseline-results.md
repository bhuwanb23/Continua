# Baseline Results

Final held-out run: `benchmark-20261119-1400-14edc3e-final`.

| Baseline | Status | Macro F1 | Notes |
|---|---|---:|---|
| Predict nothing | measured | 0.000 | Sanity predictor. |
| Naive keyword rules | measured | 0.444 | Simple referral-completion and exact duplicate rules over frozen extracted events; no normalization beyond frozen fields and no evidence gate. |
| Oracle events upper bound | measured | 1.000 | Gold canonical events plus deterministic rules; diagnostic upper bound, not deployable. |
| Full hybrid fixture replay | measured | 1.000 | Full extracted -> detector -> evidence -> priority path using frozen fixture extraction. |
| LLM-only gap judge | not run | n/a | No live provider configured; no synthetic substitute is reported. |

Naive baseline limitations:
- Shares the frozen fixture-extracted event store.
- Tests simpler judgment, not simpler extraction.
- Medication monitoring is not implemented in the naive baseline.
- LLM-only baseline was not run because no provider was configured.
- Oracle-events baseline is an upper bound, not a competitor.

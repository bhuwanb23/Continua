# Ablation Results

Final held-out run: `benchmark-20261119-1400-14edc3e-final`.

| Ablation | Status | Macro F1 / retention | Finding |
|---|---|---:|---|
| Oracle events | measured | 1.000 | Fixture replay gives the same gap metrics as oracle events in this run; no extraction loss is observable. |
| No evidence gate | measured | 1.000 | The evidence gate removed no benchmark gap in this fixture run; its value is trust/auditability, not measured F1 gain here. |
| No secondary priority cap | measured | Top-5 retention 1.000 | Removing the secondary cap does not change the Top-5 in this panel. |

Not run:
- `no_normalization`: frozen extraction store is already normalized; a faithful raw-entity ablation requires a new extraction run.
- `no_reconciliation`: reconciliation is embedded in the frozen extraction artifact.
- `no_negative_safeguards`: detector safeguard flags are not exposed as a supported runtime configuration.
- `no_grounding_claim_filter`: evidence gate and claim-coverage filter are the same architecture boundary.

Limitation: single fixed panel; not evidence of population-level ranking stability.

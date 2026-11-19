# Sensitivity Analysis

The sensitivity suite is an interpretability check. It is **not** a search for
weights that preserve a preferred demo rank.

## Frozen perturbations

Eight deterministic variants:

1. medium/low severity +15%
2. medium/low severity −15%
3. duplicate-test actionability +15%
4. duplicate-test actionability −15%
5. temporal thresholds shifted five days earlier
6. temporal thresholds shifted five days later
7. secondary factor `0.10 → 0.08`
8. secondary cap `0.30 → 0.35`

High severity and the top actionability mapping are held fixed in the weight
tests so the perturbation actually changes relative order.

## Measured result

| measure | result |
|---|---:|
| Variants | 8 |
| Mean Top-5 retention | 97.5% |
| Minimum Top-5 retention | 80.0% |
| Rank-1 stability | 100% |
| Rank-1 changes | 0 / 8 |

Seven variants retain the exact Top-5. The later temporal-threshold variant
replaces one of five patients, producing 4/5 retention (`0.80`) and Jaccard
`0.667`. Rank 1 does not change.

## Interpretation

The queue is stable under modest policy perturbations, and the one change is
explainable: moving bucket boundaries later changes the temporal factor for
borderline overdue gaps. No perturbation causes wholesale queue replacement.

The suite does not prove clinical validity. It demonstrates that the arithmetic
is not pathologically sensitive to arbitrary small changes in policy constants.

## Reproduce

```
npm run sensitivity:priority
```

Artifact: `artifacts/priority/phase8-oracle-all/sensitivity.json`.

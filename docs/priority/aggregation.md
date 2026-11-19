# Patient Aggregation

## Rule

```
ordered = patient's gaps by raw score desc, overdue desc, gap_id asc
patient_raw = ordered[0].raw + min(0.10 × sum(ordered[1..].raw), 0.30)
```

The top verified issue dominates. Secondary issues add at most `0.30`, regardless
of how many exist.

## Why sum-only is rejected

A patient with many low-value alerts could outrank one patient with an urgent
unresolved referral. That rewards alert volume, not coordination need.

## Why max-only is rejected

A second genuine verified issue still adds coordination work. A small capped
contribution reflects that workload without letting quantity become the ranking
strategy.

## Measured behavior

- Maria: top gap `1.15`, secondary sum `0.874125`, bonus `0.087413`,
  patient raw `1.237413` → 69/P2.
- Twenty weak duplicate gaps plus one serious gap: bonus stays exactly `0.30`,
  patient raw `1.70` → 94/P1.
- Twenty weak gaps alone score far below the single serious gap.

## Patient with no gaps

`patient_priority_score = 0`, `priority_band = NONE`, `rank = null`.

The UI copy is "No verified continuity issues found." It is not "low risk."

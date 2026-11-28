# Impact model

## Formula

```
modeled_redirected_time =
  patients_reviewed_per_day
  × (baseline_minutes_per_patient − assisted_minutes_per_patient)
  × working_days_per_month
```

Implemented once, as a pure function: `calculateRedirectedTime` in
`lib/impact/model.ts`. The UI, tests, and any exported copy must call it; no surface
recomputes the figure independently.

## Defaults

| Input | Default | Class |
| --- | --- | --- |
| Patients reviewed per working day | 20 | SCENARIO_ASSUMPTION |
| Baseline manual review | 8 minutes/patient | SCENARIO_ASSUMPTION |
| Continua-assisted review | 6 minutes/patient | SCENARIO_ASSUMPTION |
| Working days per month | 20 | SCENARIO_ASSUMPTION |

Result at defaults: 2 minutes/patient × 20 patients = 40 minutes/day = **13.33
modeled hours per month** (800 minutes).

The 2-minute reduction is deliberately conservative. We are not claiming that a
coordinator reviews a patient in six minutes; we are asserting a small reduction in
information-search and issue-triage time.

## What the model must never do

- Subtract system latency from manual review time. A cached queue read of 1.7859 ms is
  not a human workflow duration.
- Model patient outcomes, avoided hospitalizations, prevented progression, or lives
  saved.
- Emit dollars unless a wage/cost assumption is explicitly entered. None is.
- Silently use a per-gap assumption multiplied by verified gaps. That is what the
  superseded Phase-10 figure did (12 minutes × 66 gaps = 13.2 hours) without
  subtracting assisted review time; Phase 14 does not surface it.

## Input bounds

| Input | Range |
| --- | --- |
| Patients reviewed/day | 1–1000 |
| Baseline minutes | 0–120 |
| Assisted minutes | 0–120, and ≤ baseline |
| Working days/month | 1–31 |

`validateImpactInputs` enforces these in the UI and in tests.

## Human review time: not measured

We did not run a usability study. Both baseline and assisted review times are
scenario assumptions surfaced in the assumption ledger. If a study is run later, its
values become measured and the ledger must say `MEASURED` with sample size `n`.

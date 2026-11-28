# Assumption ledger

Every row is a `SCENARIO_ASSUMPTION`. None is a measured Continua result. No usability
study has been run, so no row can be promoted to `MEASURED`.

| Assumption | Default | Why | Editable |
| --- | --- | --- | --- |
| Patients reviewed per working day | 20 | The demo panel holds 80 patients, reviewed across several days rather than daily | Yes |
| Baseline manual review | 8 min/patient | Scenario input for manual information search and issue triage | Yes |
| Continua-assisted review | 6 min/patient | Scenario input for a conservative 2-minute reduction; **not** system latency | Yes |
| Working days per month | 20 | Model input | Yes |

## What is deliberately not an assumption

- **System latency** is measured separately (cached queue read p50 1.7859 ms; fixture
  pipeline p50 3.9105 ms) and never enters the impact formula.
- **Panel size** (80) is a frozen dataset property, not a business assumption.
- **Verified gaps** (41 in the benchmark run; 66 verified gaps in the 80-patient demo
  cache) are counted, not assumed.

## Sensitivities worth stating out loud

At defaults the model yields 13.33 hours/month. Doubling the assumed time reduction
to 4 minutes/patient doubles that figure; halving the reviewed-patient count halves
it. The model is linear, so judges can mentally rescale it. That is intentional: a
transparent range beats a single confident number.

## Origin of the old 13.2-hour figure

`data/demo-cache/continua-demo-cache-v1/impact.json` stores a Phase-10 modeled value
of 13.2 hours from 12 minutes × 66 verified gaps. It counts verified gaps rather than
reviewed patients and subtracts no assisted review time. Phase 14 does not edit that
frozen artifact; it documents the supersession and computes its own figure from the
pure function above.

# priority-v1 Contract

## Purpose

`priority-v1` turns Phase 7 `VerifiedGap[]` into a deterministic coordinator
queue. It answers:

> Which verified coordination issue should the coordinator inspect first, and
> why is it above the others?

It does not predict harm, deterioration, readmission, mortality, treatment
response, or the probability that a patient will be missed.

## Input boundary

The priority layer consumes only:

- `VerifiedGap v1` from `evidence-v1`
- frozen `gaps-v1` and `gap-policy-v1`
- the frozen evaluation date `2026-06-05`
- the current event-store hash
- patient identifiers and display labels for queue presentation

It does not consume:

- raw documents
- candidate gaps
- suppressed gaps
- LLM output
- ground-truth labels at runtime
- patient demographics, diagnosis, provider, or hospital identity
- a manually specified Top-5

`lib/priority` contains no model client, network call, clock read, or random
source. Priority does not read source text.

## Eligibility

A gap participates only if:

- it is `verified-gap-v1` and `grounded: true`
- its evidence bundle is `evidence-v1`, `verified`, with zero failures
- positive, absence, and policy evidence are all verified
- required claim coverage is exactly `1`
- detector, policy, and evidence versions match the frozen targets
- the candidate event-store hash matches the current snapshot
- the evaluation date matches `2026-06-05`
- temporal metadata reconciles with the due date and frozen date

Anything else is `NOT RANKED`, with `PR-001` or `PR-011`. There is no low score
for unverified material.

## Outputs

- `GapInterventionPriority`
- `PatientInterventionPriority`
- ranked patient panel
- Top-K queue
- factor breakdowns
- deterministic explanation
- queue API response model
- ranking audit artifacts

## Frozen names

Use only:

- `gap_priority_score`
- `patient_priority_score`
- `priority_band`
- `priority_breakdown`

Bare `priority_score` is forbidden. `PRIORITY_BANDS` is now
`P1 | P2 | P3 | P4 | NONE` under the SPEC-1.2 amendment.

## Versions carried

Every result carries:

```
priority_version       priority-v1
evidence_version       evidence-v1
detector_version       gaps-v1
verified_gap_set_hash  sha256 of the stable eligible gap set
evaluation_as_of_date  2026-06-05
```

A changed gap set changes the hash. A prior ranking is stale and must be
recomputed.

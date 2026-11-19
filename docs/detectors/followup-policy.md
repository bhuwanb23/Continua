# Missed Specialist Follow-Up Policy

## Question

Was an active specialist referral followed by an accepted completion event
inside the required window?

Nothing else is evaluated by this detector.

## Trigger eligibility

A referral is evaluated only when its normalized status is:

- `placed`
- `unknown`

The following statuses are not unresolved referrals:

- `completed`
- `cancelled`

## Specialty matching

Specialty matching uses the normalized specialty code, not substring matching.
`Medical Oncology`, `Med Onc`, and `Oncology` all normalize to `oncology`.

## Window authority

1. A document-stated `expected_window_days` with `window_source = document`.
2. The frozen benchmark fallback from `lib/policies/referral-windows.ts`.

The detector never guesses a window from note text.

## Completion events

A referral is satisfied only by a `consult` or `followup` event that:

- belongs to the same patient
- has the same normalized specialty
- is dated on or after the referral date
- is dated on or before the due date
- has an accepted completion status (`completed`)
- is not a scheduled-only or cancelled event

`followup.status = scheduled` does not satisfy a referral. A consult before the
referral does not satisfy it.

## State and emission

```text
Referral
  │
  ├── completed / cancelled ─────────────→ no candidate
  │
  ├── qualifying completion in window ───→ no candidate
  │
  └── as-of after due date ──────────────→ OVERDUE candidate
```

A referral that is not yet due produces no benchmark gap. `DUE_SOON` is a
workflow warning concept, not a benchmark gap.

## Consolidation

Overlapping unresolved referrals for the same patient and specialty are grouped
into one candidate. The earliest referral is the trigger; supporting referral
event IDs and evidence references are attached. Clearly separate episodes remain
separate candidates.

## Severity

Workflow severity only:

- overdue oncology / cardiology → `high`
- overdue other supported specialty → `medium`

This is not a clinical-risk judgment. See `severity-policy.md`.

## Required behavior

- R-N1 matching specialist inside window → no gap
- R-N2 wrong specialty → gap remains
- R-N3 referral not due → no benchmark gap
- R-N4 completed telehealth consult → no gap
- R-N5 cancelled referral → no gap
- R-N6 consult before referral → does not satisfy
- R-N7 scheduled but not completed → does not satisfy
- R-N8 copied note mention → does not create a new completion occurrence

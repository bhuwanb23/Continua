# Medication Monitoring Policy

## Scope

This is a synthetic benchmark-policy checker, not a universal medical-guideline
engine. Only medications in the frozen registry are evaluated. Every other
medication is ignored.

## Registry

`lib/detectors/monitoring/registry.ts` freezes:

| Medication | Target | Window | Completion |
| --- | --- | --- | --- |
| metformin | `a1c_or_bmp` | 90 days | lab `a1c` or `bmp` |
| warfarin | `inr` | 7 days | lab `inr` |
| tamoxifen | `annual_oncology_followup` | 365 days | completed oncology consult/follow-up |
| anastrozole | `annual_oncology_followup` | 365 days | completed oncology consult/follow-up |

The registry is the full Phase 6 policy. There is no spontaneous expansion from
medication names, note text, or inferred clinical reasoning.

## Trigger

A `medication_start` event is evaluated only when its normalized drug exists in
the registry. The detector does not infer that a medication was started from a
note, a plan, or an order.

## Satisfaction

Monitoring is satisfied by a qualifying canonical event on or after the start date
and on or before the due date.

- Lab targets require the normalized lab code.
- Oncology follow-up targets require a completed `consult` or `followup` with
  normalized specialty `oncology`.

A note that says a lab was ordered is not a completed lab result. Planning is not
completion.

## Stop protection

If a matching normalized medication has a `medication_stop` event on or before the
due date, no monitoring gap is emitted.

## State and emission

```text
Medication start
  │
  ├── not in registry ───────────────→ ignored
  │
  ├── stopped before due ────────────→ no candidate
  │
  ├── monitoring completed in window ─→ no candidate
  │
  └── as-of after due ───────────────→ OVERDUE candidate
```

A not-yet-due medication produces no benchmark gap.

## Severity

Workflow severity based only on elapsed window:

- 0–30 days overdue → `low`
- 31–90 days overdue → `medium`
- more than 90 days overdue → `high`

This is not a clinical-risk statement.

## Required behavior

- M-N1 monitoring inside window → no gap
- M-N2 normalized alias result → no gap
- M-N3 medication stopped before due → no gap
- M-N4 monitoring one day before deadline → no gap
- M-N5 monitoring one day after deadline → overdue candidate
- M-N6 medication not in registry → ignored
- M-N7 wrong lab exists → gap remains
- M-N8 medication explicitly not started → no start event, nothing to evaluate

# Temporal Semantics — Continua Spec v1.0

> Resolves C-009. One definition of "today" for the entire benchmark. No clock is read anywhere in the detection path.

## 1. The constant

```
evaluation_as_of_date = "2026-06-05"
```

- Type: ISO `YYYY-MM-DD` string.
- Stored in `data/spec/versions.json` as `evaluation_as_of_date`.
- Every temporal computation in the pipeline, the eval harness, and the seed case uses this value. No `new Date()`, no `Date.now()`, no `today` derived from the runtime clock may appear in any detection, priority, or eval code path.
- The UI may display a "as of 2026-06-05" label; it never computes it.

## 2. Window state machine

For a rule with a trigger event date `D` and a window of `W` days, the due date is `D + W`.

```
state = 
  if evaluation_as_of_date <  D + W  →  "pending"   (window not yet closed; NOT a gap)
  if evaluation_as_of_date == D + W  →  "due_today" (window closes today; early warning only, low severity)
  if evaluation_as_of_date >  D + W  →  "overdue"   (gap candidate; overdue_days = as_of - (D+W))
```

Hard rule (Fix 1): a window that is `pending` **never** produces a gap. It may produce a `pending_monitoring` note (severity none, excluded from the queue and from ground truth).

## 3. Overdue computation

```
overdue_days = max(0, (evaluation_as_of_date - (D + W)).days)
```

- Integer days.
- Negative or zero → 0.
- No fractional days; all dates are midnight UTC.

## 4. Reference dates (Maria)

| Item | Date | Window | Due date | State at 2026-06-05 |
|---|---|---|---|---|
| Referral R4 | 2026-03-25 | 45 d | 2026-05-09 | overdue 27 d |
| Metformin R1 | 2026-02-10 | 90 d | 2026-05-11 | overdue 25 d |
| Tamoxifen R7 | 2026-04-22 | 365 d | 2027-04-22 | pending (321 d remaining) |
| CBC R6→R8 | 2026-04-20 / 2026-04-28 | 14 d | — | 8 days between |

## 5. Temporal test fixture shape

Every test that exercises a rule must declare its "today" explicitly:

```json
{
  "evaluation_as_of_date": "2026-06-05",
  "events": [ /* ... */ ]
}
```

- The fixture's `evaluation_as_of_date` overrides any default.
- A fixture without `evaluation_as_of_date` is invalid and the test must fail to load.
- No test may read the system clock.

## 6. Date arithmetic rules

- All dates ISO `YYYY-MM-DD`, interpreted as midnight UTC.
- Day counts are calendar days (not business days).
- "Within window" means `event.date` in `[D, D + W]` inclusive on both ends.
- "Overdue" means `evaluation_as_of_date > D + W` (strictly).
- Tamoxifen/anastrozole: 365-day window; gap reportable only after `S + 365` elapses with no oncology consult.

## 7. Determinism

- `computeOverdue(trigger_date, window_days, as_of)` is a pure function of its arguments.
- Re-running with the same inputs yields identical `overdue_days` and state.
- No timezone conversions; UTC throughout.
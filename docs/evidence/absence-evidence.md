# Absence Evidence

Absence claims are first-class deterministic queries, not quotations.

## Query shape

```json
{
  "event_types": ["consult", "followup"],
  "normalized_identity": "specialty:oncology",
  "start_date": "2026-03-25",
  "end_date": "2026-05-09"
}
```

Supported identity forms:

- `specialty:oncology` — completed consult or follow-up with the normalized specialty
- `lab_code:a1c|bmp` — qualifying lab result by normalized code
- `series:lab:cbc` — an explicit-series marker for the diagnostic identity
- `series:imaging:mammogram:breast`
- `drug:metformin` — a medication stop for the drug

## Verification

The verifier:

1. validates event types, identity, date syntax, start ≤ end, and end ≤ evaluation date
2. re-executes the query over the current canonical event store
3. requires zero qualifying matches for an absence claim
4. records the matching event IDs when the claim is contradicted

A contradicted absence produces `EV-009`. A malformed or modified query that does not match the candidate rule produces `EV-008`.

## Maria

For the missed oncology follow-up:

- identity: `specialty:oncology`
- event types: `consult`, `followup`
- window: referral date `2026-03-25` through due date `2026-05-09`
- matching completions: `0`
- status: verified absence

For metformin monitoring:

- primary query: `lab_code:a1c|bmp`, `2026-02-10` → `2026-05-11`
- structural query: no `drug:metformin` stop before the due date

Both return zero qualifying matches in the corrected Maria fixture.

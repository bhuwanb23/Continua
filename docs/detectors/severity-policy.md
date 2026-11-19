# Candidate Severity Policy

Severity is **coordinator-workflow severity**, not clinical risk. It answers:
how much queue attention does this candidate merit under the frozen benchmark
policy?

## Follow-up

- `high`: overdue oncology or cardiology referral
- `medium`: overdue referral in another supported specialty

## Duplicate testing

- `high`: three or more occurrences, or imaging duplicate
- `medium`: two lab occurrences within 7 days
- `low`: two lab occurrences 8–14 days apart

## Medication monitoring

- `low`: 0–30 days overdue
- `medium`: 31–90 days overdue
- `high`: more than 90 days overdue

## Constraints

No severity rule uses diagnosis, treatment, medication class, patient risk, or
model output. Changing a threshold changes `gap-policy-v1` and requires a new
policy version.

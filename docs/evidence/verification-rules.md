# Verification Rules

## Documents

- `EV-001` when the source document does not exist
- `EV-002` when the document belongs to another patient
- `EV-003` when current document text does not match its frozen content hash

## Spans

- Normalize line endings, curly quotes, duplicate whitespace, and case.
- Exact normalized containment is preferred and returns score `1.0`.
- Fuzzy support is accepted only at `>= 0.85`.
- Fuzzy spans must be at least `40` normalized characters and `6` tokens.
- Fuzzy matching is lexical/window-based, never embedding or semantic similarity.
- Offsets are calculated server-side. A stored offset that does not resolve to the quote fails with `EV-004`.
- A canonical event whose recorded offsets no longer resolve to its own source span fails with `EV-003`.

## Critical fields

Missed follow-up: referral exists, specialty, referral date, unresolved status, window source, and due date.

Duplicate test: two distinct occurrences, diagnostic identity, each date, interval inside the frozen window, and no explicit-series evidence. Two records that resolve to the same fingerprint do not count as independent evidence.

Medication monitoring: medication start, medication identity, start date, registry target/window/due date, and no stop before due.

Critical-field failures use `EV-005`, except policy window/value mismatches which use `EV-007`.

## Policies

- Missing required policy: `EV-006`
- Wrong policy version, rule, or provenance class: `EV-007`
- `benchmark_policy` is never displayed as clinician-authored text
- `document_extracted` requires the source referral span to contain the stated window

## Staleness

A candidate must carry the event-store hash and frozen detector/policy versions. A mismatch produces `EV-011`. Verification never silently uses a newer event store to re-validate an old candidate.

## Claims

Required claims must all be supported. Any unsupported required claim produces `EV-010`, and the gap is suppressed. A weighted score cannot rescue a failed critical claim.

## Failure taxonomy

| Code | Meaning |
|---|---|
| EV-001 | Document not found |
| EV-002 | Patient mismatch |
| EV-003 | Event/source mismatch |
| EV-004 | Exact/fuzzy span failed |
| EV-005 | Critical normalized field unsupported |
| EV-006 | Policy missing |
| EV-007 | Policy version/rule/provenance mismatch |
| EV-008 | Absence query invalid |
| EV-009 | Absence contradicted by matching event |
| EV-010 | Required claim unsupported |
| EV-011 | Stale event-store or version identity |
| EV-012 | Malformed candidate/evidence bundle |

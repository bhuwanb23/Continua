# Evidence Model

The evidence contract is defined in `lib/domain/verified-gap.ts`.

## Evidence items

`PositiveSourceEvidence`

- `evidence_id`, `patient_id`, `event_id`, `event_type`
- `source_doc_id`
- `quoted_span`
- `span_start`, `span_end` when an exact location is unambiguous
- `verification_method`: `exact` or `fuzzy`
- `verification_score`
- `verified`

`AbsenceEvidence`

- `search_definition`: event types, normalized identity, start date, end date
- `matching_event_count`
- `matching_event_ids`
- `event_store_version`
- `evaluation_as_of_date`
- `verified`

`PolicyEvidence`

- `policy_id`
- `policy_version`
- `rule`
- `source`: `benchmark_policy` or `document_extracted`
- `verified`

No absence statement is represented as a source quotation.

## Bundle

An `EvidenceBundle` contains all three evidence classes plus:

- required claims and their support state
- claim coverage
- binary verification status (`verified` / `failed`)
- structured failure list

Internal failure codes are richer than the user-facing binary status, but only fully verified bundles become `VerifiedGap`.

## VerifiedGap

`VerifiedGap` contains:

- the original `CandidateGap`
- the verified evidence bundle
- deterministic title and structured rationale
- deterministic explanation prose
- evidence deep dive for the future evidence drawer
- coordinator action
- full verification metadata
- `grounded: true` (the type cannot represent an ungrounded gap)

There is no generic user-visible confidence field.

## Deep dive

The deep dive separates:

- positive sources: document type, provider, date, exact span, surrounding excerpt, normalization explanation
- absence checks: event types, identity, window, zero-match count
- policy checks: policy identity/version, rule, provenance class, display label

This is the data contract for the future evidence API and drawer.

# Deterministic Gap Engine Design

## Purpose

Phase 6 converts canonical clinical events into candidate continuity gaps. The
engines make rule decisions only from canonical events, frozen policy, and an
injected evaluation date. They do not read raw notes, call a model, use the wall
clock, or import benchmark labels.

## Pipeline

```text
ClinicalEvent store
        │
        ├── FollowupDetector
        ├── DuplicateDetector
        └── MonitoringDetector
                    │
                    ▼
          dedupeCandidateGaps
                    │
                    ▼
           CandidateGap[]
```

The cross-detector entry point is `detectCandidateGaps(events, context)` in
`lib/detectors/index.ts`. Different gap types are never merged.

## Candidate contract

`CandidateGap` is defined in `lib/domain/candidate-gap.ts`:

- `schema_version: "candidate-gap-v1"`
- deterministic `gap_id`
- `patient_id`, `gap_type`, `detector_version`
- workflow `severity`
- `identity` for evaluation matching
- `trigger_event_ids`
- inherited `evidence_refs`
- optional `window_days` and `due_date`
- `temporal_state`
- discriminated metadata union
- structured `rationale`
- coordinator action template

The contract is a candidate contract, not a displayed-gap contract. Phase 7 still
verifies evidence independently.

## Purity rules

Given the same canonical events, policy version, detector version, and
`evaluation_as_of_date`, output is byte-equivalent after deterministic sorting.

The detector source is checked for:

- no generator or label imports
- no fixture keys or patient-specific exceptions
- no `new Date()` / `Date.now()`
- no randomness
- no network calls
- no raw document text access

## Temporal engine

All date math goes through `lib/detectors/common/dates.ts`, backed by the frozen
UTC calendar implementation. The detector accepts the evaluation clock explicitly
and never reads the system clock.

Frozen state names are `OPEN`, `DUE_SOON`, `OVERDUE`, and `RESOLVED`. Only
`OVERDUE` creates benchmark gaps. `RESOLVED` is never emitted as a candidate.

## Versions

- Overall detector version: `gaps-v1`
- Policy version: `gap-policy-v1`
- Internal labels: `followup-v1`, `duplicate-v1`, `monitoring-v1`

## Evidence carry-through

Every candidate carries trigger event IDs and evidence references inherited from
canonical event provenance. Detection does not re-extract evidence and does not
open source text.

## Benchmark modes

1. **Oracle mode** canonicalizes frozen truth events and measures the rules alone.
2. **Extracted mode** consumes a Phase 5 canonical event store.

Extraction and oracle event IDs use different deterministic schemes. The
evaluation script aligns extracted occurrences to the frozen truth occurrence by
patient, event type, date, source document, and normalized identity. Unmatched
extracted occurrences remain unmatched and count as false positives.

## Commands

```bash
npm run run:detectors -- --mode oracle --partition final
npm run eval:detectors -- --run artifacts/detectors/<run-id>
npm run inspect:detectors -- --run artifacts/detectors/<run-id>
npm run benchmark:detectors
npm run benchmark:detector-performance
npm run validate:detectors
```

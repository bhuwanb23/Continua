# Suppression Policy

An ungrounded candidate never reaches the coordinator queue. It is not shown with a warning and it is not shown at a lower confidence.

## Gate

The final conversion requires:

- valid candidate identity and frozen versions
- matching current event-store hash
- existing, patient-owned source documents
- verified required source spans
- supported critical fields
- re-executed absence queries with zero qualifying matches
- valid frozen policies with correct provenance class
- 100% required claim coverage

Any failure blocks conversion.

## Outcomes

- `verified` → `VerifiedGap` with `grounded: true`
- `suppressed` → `SuppressionRecord` retained for development/evaluation only

Suppression records contain the gap ID, patient, gap type, failure codes, primary failure, relevant event/document IDs, evidence version, and message.

## Phase 8 boundary

`VerifiedGap[]` is the only input type Phase 8 should accept. A suppressed candidate has no priority because it has no verified existence.

## Observability

Benchmark and validation artifacts retain:

- candidate gaps before gating
- verified gaps after gating
- suppressed gaps
- full evidence bundles
- failure list
- audit trail
- grounding report

This makes over-suppression visible rather than hidden.

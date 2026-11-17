# ADR-005 — Separate gap and patient intervention priority

- **Status:** Accepted
- **Date:** 2026-11-17

## Context

An earlier draft used one ambiguous `priority_score` for both a single gap and a patient's queue rank, producing inconsistent numbers (84 vs 89).

## Decision

Two explicit fields: `gap_priority_score` (one gap's contribution) and `patient_priority_score` (queue rank). The bare name `priority_score` is forbidden. There is no `RiskScore` and no clinical-risk terminology.

## Alternatives

- One shared score: ambiguous, caused the original contradiction.
- Clinical risk model: no validated data; would overclaim.

## Consequences

- API and UI labels are unambiguous.
- Priority is framed as **intervention priority for coordinator triage**, not patient risk.

# ADR-003 — Fixed benchmark clock

- **Status:** Accepted
- **Date:** 2026-11-17

## Context

Window arithmetic (overdue days) must be reproducible across machines and reruns. The system clock silently breaks benchmark comparability.

## Decision

`evaluation_as_of_date = 2026-06-05` is a frozen constant behind an injectable `Clock`. Clinical and benchmark paths must use the injected clock, never `new Date()` directly.

## Alternatives

- System time: non-reproducible.
- Per-run "now": makes results drift.

## Consequences

- `FixedClock` in tests and benchmarks; `SystemClock` only for non-clinical infrastructure.
- Any accidental system-clock call is a review defect.

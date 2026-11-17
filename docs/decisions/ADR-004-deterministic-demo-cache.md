# ADR-004 — Deterministic demo cache

- **Status:** Accepted
- **Date:** 2026-11-17

## Context

Live synthesis during a demo is risky (latency, model variance). Cached output must never be silently stale.

## Decision

Cache artifacts carry `cache_version`, `dataset_version`, `detector_version`, `priority_version`, and `generated_at`. A mismatch is rejected (`DataIntegrityError`), not displayed.

## Alternatives

- Always live: unreliable under demo conditions.
- Unversioned cache: silently serves stale results.

## Consequences

- Demo reliability improves.
- Re-generating a dataset or detector forces an explicit cache refresh.

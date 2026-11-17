# ADR-002 — Synthetic-only demonstration data

- **Status:** Accepted
- **Date:** 2026-11-17

## Context

The project must not touch real PHI, and no EHR integration is in scope for the MVP.

## Decision

All data is synthetic and de-identified by construction. No real patient records, no live EHR/FHIR connection, no false claim of HIPAA compliance.

## Alternatives

- Real de-identified records: legal and ethical overhead, slow.
- Fake "Epic integration": misleading and out of scope.

## Consequences

- The synthetic data generator and provenance metadata are first-class (Phase 2).
- Every screen carries the synthetic-data disclosure.
- Results are explicitly not evidence of real-world efficacy.

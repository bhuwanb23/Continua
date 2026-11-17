# ADR-006 — No EHR integration in the MVP

- **Status:** Accepted
- **Date:** 2026-11-17

## Context

EHR/FHIR integration is a large, regulated surface and is unnecessary to prove continuity intelligence on synthetic data.

## Decision

The MVP is synthetic-only. FHIR/HL7 is a roadmap item, not an implementation. No fake Epic connection, no implied live data feed.

## Alternatives

- Sandbox FHIR server: time sink, still synthetic.
- Mock "Epic" branding: misleading to judges and users.

## Consequences

- Data ingestion is the synthetic generator + fixtures (Phase 2).
- Repository abstractions keep a future persistence swap possible.

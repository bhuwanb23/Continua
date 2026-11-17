# ADR-001 — Hybrid AI extraction with deterministic gap reasoning

- **Status:** Accepted
- **Date:** 2026-11-17

## Context

Clinical records are unstructured; care-gap logic must be auditable and reproducible.

## Decision

Use an LLM (later phase) only to extract structured events. Deterministic rules decide whether a gap exists. The extraction boundary is a provider-independent interface.

## Alternatives

- Fully LLM-driven gap judgment: non-reproducible, hard to audit.
- Fully rule-based extraction: brittle on messy prose.

## Consequences

- Extraction can be swapped or mocked; detectors are unit-testable with fixtures.
- Prompt changes do not silently change gap semantics.
- The system must maintain a strict normalized event store.

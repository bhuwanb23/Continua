# Intended Use

**Safety version:** `continua-safety-v1`
**Status:** frozen
**Data boundary:** synthetic only (`continua-synth-v1`). No real PHI is processed.

## Purpose

Continua is a **coordinator decision-support prototype** that surfaces care-gap candidates that have already been verified against source evidence. It helps a human coordinator decide what to review first. It does not make clinical decisions, communicate with patients, or change care.

## In scope

1. Ingest **synthetic** primary-care documents from the frozen demo dataset.
2. Extract candidate clinical events with a constrained model prompt and closed JSON schema.
3. Normalize events deterministically and detect **candidate** care gaps with rule-based detectors.
4. Verify each candidate against source spans, fields, absence checks, and policy checks.
5. Display only `VerifiedGap` objects, with evidence and absence provenance.
6. Rank verified gaps by a transparent workflow-priority formula.
7. Record coordinator workflow intent (`acknowledged`, `contacted`, `reviewed`) without executing clinical action.

## Out of scope

- Diagnosis, triage, prognosis, or clinical risk scoring.
- Prescribing, ordering tests, adjusting treatment, or scheduling care.
- Patient-facing communication or autonomous outreach.
- Processing real patient records, PHI, or production EHR data.
- Claims of HIPAA compliance, clinical validation, or regulatory clearance.
- Use as the sole basis for any clinical or coverage decision.

## Users

Trained care coordinators and reviewers working with synthetic demonstration data. The interface assumes a human reviewer reads the evidence before acting.

## Operating assumptions

- The demo cache is benchmark-qualified and fails closed if any artifact is missing or tampered with.
- Absence statements are limited to the available records; the record set is not a complete medical history.
- Priority labels describe workflow order, not clinical urgency or risk.
- Every surfaced gap requires human review before any real-world action.

## Explicit non-claims

This prototype is **not** HIPAA compliant, **not** HIPAA certified, and **not** "HIPAA-safe". It is a synthetic-data-only MVP. No real PHI is processed by design, and the synthetic boundary is enforced in the data pipeline, cache loader, and release gate.

## Related documents

- `prohibited-use.md`
- `authority-matrix.md`
- `synthetic-data.md`
- `safety-case.md`

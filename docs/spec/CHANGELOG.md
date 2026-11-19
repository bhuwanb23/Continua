# Continua Spec CHANGELOG

## v1.2 — priority-v1 workflow amendment (2026-11-19)

- `docs/spec/priority-engine.md`: replaces the v1.0 five-factor draft with the
  frozen three-factor `priority-v1` formula (severity × temporal × actionability),
  exact theoretical normalization (`1.50` gap, `1.80` patient), capped secondary
  aggregation, and deterministic tie order. Required by `plans/phase_8.md`.
- `docs/spec/terminology.md` §3: workflow bands are `P1 | P2 | P3 | P4 | NONE`.
  `CRITICAL/HIGH/MEDIUM/LOW` is retired for priority output because `CRITICAL`
  can be read as clinical acuity.
- `docs/spec/api-contract-v1.md`: priority query/type bands amended. Existing
  JSON examples are marked shape-only where they show superseded values.
- `lib/domain/gap.ts` and `lib/schemas/index.ts`: priority band enum amended.
- Field-name freeze is unchanged: `gap_priority_score`, `patient_priority_score`,
  `priority_band`, `priority_breakdown`; bare `priority_score` remains forbidden.
- Arithmetic: gap maximum `1.50`, patient maximum `1.80`, secondary cap `0.30`.
  `priority-v1` remains the version identifier in `data/spec/versions.json`.

## v1.1 — clinical-event schema amendment (2026-11-18)

- `docs/spec/clinical-event-schema.md` §9: optional `mention_context`
  (`contemporaneous | historical_reference | unknown`, default `unknown`) on
  the canonical base envelope; schema identifier `clinical-event-v1.1`.
  Required by `plans/phase_5.md` §5.34–5.36 (occurrence vs historical mention).
- Backward compatible: `clinical-event-v1` envelopes remain valid inputs;
  event identity namespace and `event_id` values unchanged; no frozen
  benchmark artifact pins the pre-amendment serialized event hash.
- The v1.0 frozen contract set and its FROZEN stamp are otherwise untouched.

## v1.0 (frozen 2026-11-17)

### 0.0 — Preflight
- Created `docs/spec/`, `data/spec/`, `plans/`. Confirmed tooling.

### 0.1 — Master plan sync
- `master_plan.md`: status line, gate 0 row, row 0 outcome, sub-phase table 0.0–0.19, `docs/spec/` canonical note, `evaluation_as_of_date` naming.

### 0.2 — Phase plan rewrite
- `plans/phase_0.md`: 25-row contradiction register, sub-phases 0.0–0.19, 16-item acceptance gate, 10 hard-negative families, AT reconciliation, audit grep list, FROZEN stamp target.

### 0.3 — Contradiction register
- `docs/spec/contradiction-register.md`: 25 rows (9 VERIFIED carry-in, 12 OPEN, 4 PROPOSED, 0 FROZEN).

### 0.4 — Terminology
- `docs/spec/terminology.md`: allowed/prohibited terms, priority field naming, claim classes, confidence/date vocabulary.

### 0.5 — Temporal semantics
- `docs/spec/temporal-semantics.md`: `evaluation_as_of_date` constant, window state machine, overdue formula, Maria reference dates, fixture shape.

### 0.6 — Clinical event schema
- `docs/spec/clinical-event-schema.md`: frozen schema, canonical field names, `series_status` enum, typed fields, validation rules, drift resolution.

### 0.7 — Gap contracts
- `docs/spec/gap-contracts.md`: shared + per-type metadata, field names, versions, temporal policy, action verbs.
- `docs/spec/gap-rules.md`: three deterministic detectors with corrected imaging key, series_status, action verbs, not-yet-elapsed hard rule.

### 0.8 — Evidence contract
- `docs/spec/evidence-contract.md`: Level A/B, suppression, span/excerpt naming, confidence decomposition.

### 0.9 — Priority engine
- `docs/spec/priority-engine.md`: formula, factors, bands, terminology, guardrails, worked example (70/11/37, 74).

### 0.10 — Benchmark distribution
- `data/spec/benchmark-manifest.json`: 80 patients, 40/40, 70 gaps (28/22/20), 10 hard-negative families.

### 0.11 — Claim classification
- `docs/spec/safety-contract.md` Part A: four claim classes (baseline/measured/modeled/sourced) and enforcement.

### 0.12 — Evaluation spec
- `docs/spec/evaluation-spec.md`: extraction vs gap eval, matching rule v2, empty results table, pass criteria.

### 0.13 — API contract v1
- `docs/spec/api-contract-v1.md`: frozen v1 API with corrected field names and regenerated examples (Maria 70/74, 70 gaps/40 patients, last_contact 2026-04-28).

### 0.14 — AT reconciliation
- `docs/spec/acceptance-tests.md`: field names aligned, matching rule v2, claim classes, new/corrected ATs.

### 0.15 — Safety contract (Part B)
- `docs/spec/safety-contract.md` Part B: MAY/MUST NOT/human gate, prohibited terms, enforcement.

### 0.16 — Versioning
- `data/spec/versions.json`: all version constants.

### 0.17 — Cross-doc audit
- `docs/spec/audit-report.md`: mechanical grep results, field-name freeze check, JSON validation, cross-doc consistency, verdict.

### 0.18 — Benchmark run
- `eval-report.json`: status `not_run`, all metrics null (no pipeline exists in Phase 0; no invented numbers).

### 0.19 — Packaging + stamp
- `docs/spec/SPEC-v1.0.md`: entry point with **CONTINUA SPECIFICATION v1.0: FROZEN**.
- All 25 contradiction-register rows flipped to FROZEN.
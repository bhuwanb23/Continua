# Phase 5 — Extraction & Provenance Engine

> Depends on: Phase 4 (event model) · Unblocks: Phase 6
> Gate: **extraction benchmark passes — ≥90% accuracy, 100% traceability**

## Objective

Introduce the LLM — and confine it to the one job it is genuinely good at: turning messy documents into typed facts with citations. It must never decide whether a gap exists.

## Sub-phases

### 5.1 Contract and prompt

- One call per patient, full record set in context.
- System prompt: *"You are a clinical information extractor. Extract only what is stated. Cite source_doc_id for every item. If unsure, omit."*
- Structured output only (JSON schema / function calling). No free-text parsing anywhere.
- Temperature 0.1. Prompt versioned as `extract-v1` and stored in `lib/extraction/prompts/`.

### 5.2 Schema validation

- Validate the response against the ClinicalEvent schema before anything else.
- Unknown fields → rejected (not stripped silently).
- Missing `source_doc_id` or `source_span` → event dropped.
- Malformed JSON → retry with a stricter reminder, max 2 attempts, then fail the stage loudly.

### 5.3 Span verification

- `lib/evidence/spanMatch.ts` — verbatim match first, then fuzzy (normalized whitespace, ≥0.85 similarity).
- Every retained event records `verification_score`.
- Span mismatch → drop event, increment `dropped_span_mismatch`.

### 5.4 Normalization handoff

- Extraction emits raw strings (`test_name_raw`, `drug_raw`).
- Phase 4 maps convert to normalized values. The LLM never sees the alias map.
- If normalization fails, the event is kept with `unknown` normalized value and flagged, not dropped.

### 5.5 Drop log and observability

- `logs/extraction-drops.json` — `{patient_id, doc_id, reason, raw_excerpt}`.
- Reason enum: `invalid_json`, `missing_provenance`, `span_mismatch`, `invalid_date`, `bad_enum`.
- Counts surfaced to the eval runner.

### 5.6 Extraction benchmark

Against `data/eval-set/v1/events-labeled.json`:

- Event-type accuracy (correct type for the labeled event).
- Date accuracy (exact day match; month-precision counted separately).
- Specialty / test / drug normalization accuracy.
- Citation validity (every retained event's span verified).
- **Targets:** ≥90% event accuracy on the labeled subset, 100% retained-event traceability.

### 5.7 Cost & latency instrumentation

- Log tokens + wall-clock per patient.
- Target: full 80-patient extraction under ~40 s with `gpt-4o-mini`; cost per panel < $0.50.
- Cache by content hash so re-runs during development are free.

## Deliverables

| Artifact | Purpose |
|---|---|
| `lib/extraction/extract.ts` | per-patient extraction orchestration |
| `lib/extraction/prompts/extract-v1.ts` | versioned prompt |
| `lib/extraction/validate.ts` | schema validation + retries |
| `lib/evidence/spanMatch.ts` | verbatim + fuzzy span verification |
| `scripts/run-extraction.ts` | offline runner for the whole panel |
| `eval-report-extraction.json` | measured accuracy on labeled subset |

## Gate — exit criteria

- [ ] All 80 patients extract without an unhandled failure.
- [ ] Event accuracy ≥ 0.90 on the labeled subset (report the actual number).
- [ ] 100% of retained events have a verified source span.
- [ ] Drop log exists and every drop has a reason; drop rate reported.
- [ ] Deterministic with cached responses (same input → same events).
- [ ] No detector logic in this phase — extraction only.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Letting the model summarize instead of extract | Schema forces typed events; free-form descriptions capped at 200 chars |
| Retrying until the model "gets it right" | Retries only on malformed output, max 2, and counted |
| Span check being lenient enough to pass fabrications | Fuzzy threshold ≥0.85 with whitespace normalization, tested against a fabricated span |
| Prompt drift | Versioned prompt file, eval re-run on every change |

## Handoff to Phase 6

Phase 6 gets a normalized, grounded event store. If the store still has gaps the detectors need (e.g. missing referrals), fix extraction here rather than adding LLM calls to the detectors.

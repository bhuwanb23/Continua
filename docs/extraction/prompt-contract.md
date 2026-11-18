# Extraction Prompt Contract — extraction-prompt-v1

Frozen for Phase 5. Any meaningful change to the system prompt or output
structure bumps `PROMPT_VERSION` (`lib/extraction/prompt-version.ts`) and is
recorded in every evaluation run.

## Philosophy

Intentionally boring information extraction. The model extracts explicitly
supported facts; it never decides gaps, risk, diagnosis, or treatment.
No chain-of-thought, no few-shot examples in v1 (added only if the dev
benchmark shows they help, and never from the final partition or Maria's
expected gap results).

## Output structure

Model returns only:

```json
{ "patient_id": "<input patient_id>", "events": [ CandidateClinicalEvent... ] }
```

`extraction_metadata` (model, prompt_version, request_id) is attached
server-side by the LLM extractor — never model-generated, never mixed into
clinical events.

## Candidate fields

Strict per-type shapes in `lib/schemas/candidate-event.schema.ts`. Raw entity
wording only (`specialty_raw`, `test_name_raw`, `drug_raw`, `modality_raw`,
`body_region_raw`, `procedure_raw`); deterministic normalization happens
outside the model. No `event_id`, `schema_version`, normalized codes, or
character offsets — the server assigns all of those.

Defaults applied by the runtime gate: `confidence` 0.5, `mention_context`
"unknown", `series_status` "unknown", status enums "unknown".

## Prohibitions (enforced by prompt + runtime gate)

Never infer gap existence, referral failure, duplicate testing, overdue
status, clinical necessity, unstated diagnosis/treatment, risk level, or
recommended actions. Never invent dates, providers, specialties, medications,
tests, statuses, or spans. Unknown → omit or explicit "unknown".

Unsupported model keys are stripped and logged as `SCHEMA_UNSUPPORTED_KEY`
before strict parsing; they never reach canonical storage.

## Temporal semantics

- `mention_context`: contemporaneous | historical_reference | unknown —
  document temporal context, set only from explicit textual evidence.
- `series_status`: explicit only; never inferred from repeated dates.
- `expected_window_days`: only when the document states a window; the
  benchmark-policy default is applied downstream by `lib/policies`, never by
  the model (`window_source` provenance stays transparent).
- Planned/future, negated/absent, and other-person facts are omitted.

## Injection boundary

Record text is wrapped in `<document>…</document>` and declared data, never
instructions. Instruction-like record content is treated as record content.
Covered by `tests/extraction/prompt-injection.test.ts`.

## Runtime gate

`gateCandidateResponse` (`lib/extraction/candidate-event.ts`): envelope parse
→ per-event unknown-key strip + log → strict per-event parse. One bad
candidate never sinks a document; an unusable envelope is a retryable format
failure.
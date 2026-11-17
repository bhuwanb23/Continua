# Foundation architecture (Phase 1)

## Module direction

```
app / components (UI)
        ↑
services / API route handlers
        ↑
priority → evidence → detectors → normalization → extraction
        ↑
domain contracts + repositories
```

Hard rules:

- Clinical domain code never imports React.
- Detectors never import the UI or a browser API.
- Evaluation never imports visual components.
- Priority never imports an LLM client.
- Normalization never imports Supabase-specific code.

## Contracts vs. schemas

- `lib/domain/` holds TypeScript contracts transcribed from the frozen Phase 0 spec.
- `lib/schemas/` holds Zod schemas for runtime validation at boundaries (files, API, cache, LLM output, env).
- Types are not duplicated in components; components import from `lib/domain`.

## Determinism

- `lib/time/clock.ts` — `Clock`, `SystemClock`, `FixedClock`; benchmark date `2026-06-05`.
- `lib/ids/` — stable SHA-256 → UUID v5-shaped identifiers; fixture keys are separate.
- `lib/random/random-source.ts` — `RandomSource`, `SeededRandomSource` (mulberry32).

## Failure semantics

`lib/errors/` defines one hierarchy that maps to the frozen envelope:

```json
{ "error": { "code": "patient_not_found", "message": "Patient not found." } }
```

Stack traces, prompts, secrets, and raw internals never cross the API boundary.

## Data boundaries

- `lib/repositories/` — interfaces plus in-memory and JSON-file implementations.
- `lib/cache/` — versioned artifacts; mismatched versions are rejected, not displayed.
- `lib/extraction/` — provider-independent extractor interface; fixture implementation for tests.

## What Phase 1 does not contain

No LLM calls, no gap detectors, no priority formula, no synthetic 80-patient panel, no EHR integration. Those arrive in later phases behind these boundaries.

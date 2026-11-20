# Retry Policy

Source of truth: `lib/reliability/retries.ts`.

Retries are transport and format recovery only. A retry never loosens the
prompt, schema, source-span requirement, patient ownership, or completeness
rule. The maximum is three attempts.

| Failure | Retry | Attempts | Notes |
| --- | --- | ---: | --- |
| 429 rate limit | yes | 3 | Deterministic exponential backoff. |
| Timeout | yes | 3 | Transport recovery. |
| Transient 5xx | yes | 3 | 500/502/503. |
| Invalid JSON | bounded | 3 | Same prompt and schema. |
| Invalid API key | no | 1 | Authentication cannot heal by retry. |
| Provenance failure | no | 1 | Trust constraint. |
| Patient ownership failure | no | 1 | Trust constraint. |
| Unsupported schema field | no | 1 | Validation path. |
| Missing document | no | 1 | Data problem. |

## Backoff

Base 500 ms, doubling per attempt, capped at 4,000 ms, no jitter by default.
Tests inject sleep so no real timer is required. Attempt values below 1 or
negative/non-finite jitter throw instead of producing a NaN delay.

## Failure behavior

Exhausted retries throw the last controlled error. At the extraction boundary
this means no events are invented; the patient can become `PARTIAL` or
`FAILED`, which then suppresses absence-derived reasoning. A total LLM outage
therefore degrades the affected analysis but leaves the cached P0 read path
operational.

Verified by `tests/reliability/extraction-failures.test.ts` and FAULT-01 through
FAULT-04. The observed 429 recovery used 3 attempts with 500/1000 ms delays.

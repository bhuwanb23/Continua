# CONTINUA PHASE 11 — EXIT REPORT

**CONTINUA PHASE 11: continua-api-v1 FROZEN**

Measured on 2026-11-19 from the frozen Phase-10 snapshot. No value below is
hand-entered into the API; each is produced by `scripts/freeze-api.ts` or by the
test suite, and the raw record is in
`artifacts/api/continua-api-v1-freeze.json`.

## API

| Field | Value |
| --- | --- |
| API | `continua-api-v1` |
| Cache | `continua-demo-cache-v1` |
| Patients | 80 |
| Verified gaps | 66 (26 missed follow-up, 20 duplicate test, 20 med monitoring) |
| P0 routes | 11 |
| P1 routes | 1 (`POST /api/v1/gaps/{gapId}/actions`) |

P0: panel, patient list, queue, patient, timeline, gaps, evidence, metrics,
evaluation, health, readiness.

## Contract

| Check | Result |
| --- | --- |
| Schema failures | 0 |
| Cross-endpoint inconsistencies | 0 |
| Candidate gaps exposed | 0 |
| Hidden benchmark labels exposed | 0 |
| Response-contract enforcement | every 200 parsed through its zod DTO before send |
| OpenAPI drift | 12 documented paths = 12 route files |

Cross-checks CT-01…CT-08: patient count 80 = 80, gap mix
`{missed_followup: 26, duplicate_test: 20, med_monitoring: 20}` matches the
panel and cache, 80 patient gap counts match the verified-gap set, 5 queue items
match the cached priority ordering, gap scores match `priorities.json`,
evaluation equals the frozen Phase-9 report
(`benchmark-20261119-1400-14edc3e-final`, macro F1 1 from fixture replay), and
all 4 impact metrics carry the matching evidence class.

## Dependencies

| Check | Result |
| --- | --- |
| LLM calls on P0 GET suite | 0 |
| External DB calls on P0 GET | 0 |
| Network calls with `fetch` disabled and `LLM_*`/`SUPABASE_*` removed | 0 (all P0 reads 200) |
| Route files importing a repository | 0 |
| `node:fs`/`readFileSync` in `lib/api` or `lib/services` | 0 |

## Performance

Warm server processing time, 20 samples per route, from the freeze run. Cold
request: **62.5 ms** including cache validation and index build.

| Route | p50 | p95 | Target |
| --- | --- | --- | --- |
| Panel | 0.04 ms | 0.06 ms | < 50 ms |
| Queue | 0.12 ms | 0.19 ms | < 50 ms |
| Patients (limit 50) | 0.57 ms | 0.87 ms | < 75 ms |
| Patient | 0.08 ms | 0.18 ms | < 75 ms |
| Timeline | 0.12 ms | 0.17 ms | < 100 ms |
| Gaps | 0.12 ms | 0.26 ms | < 75 ms |
| Evidence | 0.17 ms | 0.32 ms | < 100 ms |
| Metrics | 0.17 ms | 0.24 ms | < 50 ms |
| Evaluation | 0.20 ms | 0.34 ms | < 50 ms |

## Safety

| Check | Result |
| --- | --- |
| Disclaimer coverage | 100% (9/9 clinical responses) |
| Risk-score terminology (`risk_level`, `risk_score`, `clinical_risk`) | 0 |
| Generic `priority_score` field | 0 |
| Raw error / stack / path leaks | 0 |
| Wrong-patient evidence | 0 |
| Invalid cache serving 200 | 0 (503 `demo_cache_not_ready`, `/readiness` 503) |
| Debug, recompute, ground-truth routes | 0 |

Score fields are `patient_priority_score` and `gap_priority_score`; labels are
`workflow_severity` and `priority_band` only.

## Gates

| Gate | Name | Result |
| --- | --- | --- |
| A | Contract | PASS — 11 P0 routes, 12 OpenAPI paths match the route tree |
| B | Trust boundary | PASS — verified gaps only, no candidate or hidden label fields |
| C | Storage independence | PASS — no filesystem in API/services, no repository imports in routes |
| D | Offline read path | PASS — network disabled, credentials removed, all P0 reads 200 |
| E | Consistency | PASS — CT-01…CT-08 |
| F | Validation | PASS — unknown enum 400, oversized limit clamped to 100, traversal 400 |
| G | Error safety | PASS — structured envelopes, header request id equals body |
| H | Benchmark integrity | PASS — evaluation equals the frozen report |
| I | Performance | PASS — 9 routes within p95 targets |
| J | Security | PASS — no leakage, traversal, debug route, or wrong-patient evidence |
| K | Maria | PASS — rank 27 matches the stored priority rank; never forced to #1 |

**Security red-team: PASS.**
**Maria API regression: PASS** (panel → patients → queue → patient → timeline →
gaps → evidence → metrics → evaluation, rank 27, flagship gap
`6c55444c-b2fb-5f94-aabf-8f2905c141e0`).
**Production build: PASS** (`npm run build`, all 12 v1 routes emitted as dynamic
server routes).

## Tests

`npx vitest run tests/api` — **77 passing / 15 files**, covering:

- route contracts and pagination/filter clamps (`panel`, `patients`, `queue`)
- timeline canonical order, gaps, evidence ownership, metrics, evaluation whitelist
- error envelopes and status mapping (`errors`)
- cross-endpoint consistency (`consistency`)
- security red-team and leakage (`security`)
- external-dependency independence (`independence`)
- OpenAPI ↔ route tree (`openapi`)
- Maria end-to-end path (`maria`)
- measured latency targets (`performance`)

Also run: `npx tsc --noEmit` (clean), scoped `eslint` on every changed path
(clean), `npm run build` (PASS), `npm run freeze:api`, `npm run validate:api`.

Not run as a whole in this sitting: the aggregate `npm run validate` chain
(≈20 pre-existing suites). The API step was added to its end and passes
standalone; all Phase-10 cache checks remain unchanged.

## Artifacts

- `artifacts/api/continua-api-v1-freeze.json` — gates, checks, latency, hashes
- `docs/api/openapi.json` — generated OpenAPI 3.1 (12 paths), hash pinned in the freeze
- `docs/api/api-v1.md`, `errors.md`, `examples.md`
- `lib/api/openapi.ts` — source of truth for the OpenAPI document
- `scripts/validate-api.ts`, `scripts/freeze-api.ts`, `scripts/lib/api-cli.ts`
- npm scripts: `validate:api`, `freeze:api`; `npm run validate` now ends with
  `validate:api`

Reproduce:

```bash
npm run validate:api
npm run freeze:api
npx vitest run tests/api
```

## Failure conditions — audited

Frontend cache-layout coupling: none (routes return DTOs).
Route reads ground truth: none.
Hand-entered evaluation metrics: none (loaded from the frozen report).
Candidate gaps in output: none.
Priority semantics differ between queue and patient: none (stored priority).
Evidence route returns another patient's record: none (ownership checked).
Routes recalculating clinical logic: none (snapshot-only mapping and display).
P0 reads requiring an LLM or Supabase: none.
Invalid cache returning 200: none.
Debug/recompute route exposed: none.
Raw stack traces: none.

**CONTINUA PHASE 11: continua-api-v1 FROZEN**

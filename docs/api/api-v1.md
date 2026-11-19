# continua-api-v1

Phase 11 backend over the frozen Phase 10 cache. It is a read-only coordination
surface: it explains *why a verified gap needs a human*, not what disease a
patient has or who is "risky".

- **Status:** frozen (`CONTINUA PHASE 11: continua-api-v1 FROZEN`)
- **Base path:** `/api/v1`
- **Runtime:** Next.js route handlers, Node runtime, no external database
- **Snapshot:** `continua-demo-cache-v1` (80 synthetic patients, 66 verified gaps)
- **Contract:** [`openapi.json`](./openapi.json), generated from `lib/api/openapi.ts`
- **Freeze evidence:** `artifacts/api/continua-api-v1-freeze.json`

## Architecture

```
app/api/v1/**/route.ts   parse params → call one service → attach meta/disclaimer → validate response
        ↓
lib/services/*.ts        query semantics and DTO mapping (no HTTP objects)
        ↓
JsonDemoRepository       validated, hash-checked, in-memory snapshot
```

Routes never read JSON and never import a repository directly. Services never
touch the filesystem. Every response is parsed through its zod DTO before it is
sent; a contract drift becomes `500 data_integrity_error`, not a silent change.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/panels/{panelId}` | Panel counts and gap mix |
| GET | `/api/v1/panels/{panelId}/patients` | Search, filters, pagination |
| GET | `/api/v1/panels/{panelId}/queue?k=5` | Frozen top-K intervention queue |
| GET | `/api/v1/patients/{patientId}` | Patient detail and priority breakdown |
| GET | `/api/v1/patients/{patientId}/timeline` | Canonical event order |
| GET | `/api/v1/patients/{patientId}/gaps` | Verified gaps only |
| GET | `/api/v1/evidence/{gapId}` | Claims, sources, absence and policy checks |
| GET | `/api/v1/metrics?panelId=demo` | Impact metrics by evidence class |
| GET | `/api/v1/evaluation` | Frozen Phase-9 benchmark aggregates |
| GET | `/api/v1/health` | Liveness |
| GET | `/api/v1/readiness` | Cache validated and serving |
| POST | `/api/v1/gaps/{gapId}/actions` | Optional coordinator workflow state |

Eleven P0 reads plus one P1 write. There is deliberately no route that returns
candidate gaps, ground truth, negative-manifest labels, benchmark match tables,
raw notes, or model internals.

### Query semantics

**Patients** — `query` is a case-insensitive `display_name` substring.
`gap_type` is `missed_followup | duplicate_test | med_monitoring`;
`priority_band` is `P1…P4 | NONE`; `sort` is `priority | name | last_contact`.
`limit` is clamped to 1–100 (default 50), `offset` is ≥ 0. A non-numeric value or
an unknown enum is `400 invalid_query`; an oversized number is clamped, never
rejected. `total` is the filtered count before pagination.

**Queue** — returns the stored Phase-8 order unchanged; `k` is clamped to 1–80
(default 5) and cannot re-rank. The frozen snapshot stores a top-5 queue, so
`k > 5` returns the available 5 items. `rank` is the stored rank, not a position
computed at request time.

**Metrics** — buckets are `measured`, `modeled`, `scenario_assumptions`,
`external_research`. Every row carries a `classification`, so a modeled estimate
can never be displayed as a measurement.

**Evaluation** — whitelisted aggregates only: extraction, gap detection,
grounding, hard negatives, priority, end-to-end, latency, limitations. Per-patient
priority matches and gold identifiers from `evaluation.json` are not exposed.

**Actions** — `acknowledged | contacted | reviewed`. The response always has
`intelligence_unchanged: true`: this endpoint records coordination workflow, it
does not alter gaps, scores, ranking, or the snapshot. Unknown actions are `422
unsupported_action`; malformed JSON is `400 invalid_request`.

## Response envelope

Every clinical response (all except health/readiness) carries:

```json
{
  "meta": {
    "api_version": "v1",
    "synthetic": true,
    "evaluation_as_of_date": "2026-06-05",
    "request_id": "req_9c2debd2a4a24cf8b392a2a7700328a1"
  },
  "disclaimer": "Synthetic demo data. For coordinator verification only. Not medical advice."
}
```

Headers on every response: `Content-Type: application/json; charset=utf-8`,
`Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Request-Id`,
`X-API-Version: v1`. The request id in the header always equals
`meta.request_id` (or `error.request_id`), so a screenshot, log line, and support
report can be joined.

## Naming and language

- Scores are `patient_priority_score` and `gap_priority_score`, integers 0–100.
  There is no generic `priority_score` field.
- `workflow_severity` (`low | medium | high`) and `priority_band` (`P1…P4`) are
  coordination labels, not clinical risk. The strings `risk_level`,
  `risk_score`, and `clinical_risk` never appear in a response.
- Gap titles are workflow descriptions (`Oncology follow-up unresolved`,
  `Possible repeat CBC`, `Metformin monitoring unresolved`), derived
  deterministically from the cache; no free-form model prose is generated at
  request time.
- Evidence excerpts are capped at 400 characters.

## Trust and safety invariants

1. Only `VerifiedGap` reaches the API. Candidate gaps and suppression reasons
   are unavailable.
2. No route reads ground truth, labels, scenario ids, or the negative manifest.
3. No LLM, embedding service, or database client is imported by `lib/api` or
   `lib/services`; the read path works with the network disabled and without
   provider keys.
4. An invalid, missing, or hash-mismatched cache fails closed: clinical reads
   return `503 demo_cache_not_ready`; `/health` stays `200` but `/readiness`
   returns `503`.
5. Response contracts are enforced on the way out (`500 data_integrity_error` on
   drift), and every request is logged with route, status, duration, and request
   id (`CONTINUA_API_LOG=off` or `NODE_ENV=test` silences it).

## Measured performance

Server processing time, warm, 20 samples per route, from the freeze run:

| Route | p50 | p95 | Target |
| --- | --- | --- | --- |
| panel | 0.05 ms | 0.08 ms | < 50 ms |
| queue | 0.11 ms | 0.14 ms | < 50 ms |
| patients (limit 50) | 0.34 ms | 0.42 ms | < 75 ms |
| patient | 0.06 ms | 0.13 ms | < 75 ms |
| timeline | 0.15 ms | 0.25 ms | < 100 ms |
| gaps | 0.12 ms | 0.19 ms | < 75 ms |
| evidence | 0.08 ms | 0.45 ms | < 100 ms |
| metrics | 0.06 ms | 0.09 ms | < 50 ms |
| evaluation | 0.08 ms | 0.27 ms | < 50 ms |

Cold request (first request in a fresh process, including cache validation and
index build): **71.5 ms**. `/readiness` is the cheap probe once the process is
warm; it does not rebuild anything.

## Verification

```bash
npm run validate:api     # routes, contracts, consistency, safety, latency
npm run freeze:api       # writes docs/api/openapi.json and the freeze artifact
npx vitest run tests/api # 74 contract, consistency, security, Maria, latency tests
```

`validate:api` also compares `docs/api/openapi.json` with the code document, so a
route added without docs fails the gate. `npm run validate` includes it after
`validate:demo-cache`.

## Known limits

- Single synthetic panel (`demo`) and a single frozen snapshot; there is no
  tenant, auth, or user model in this phase. The API is intended for the demo
  host, not a public deployment.
- Coordination actions are in-memory and per-process; they reset on restart and
  intentionally do not change intelligence.
- Queue depth is limited to the 5 entries stored in the frozen snapshot.
- Evaluation numbers come from fixture replay, as stated in the payload's
  `limitations`; they are not live model quality.

# Phase 11 — Backend / API Layer

> Depends on: Phase 10 (data sources) · Unblocks: Phase 12
> Gate: **contract tests pass on every P0 route**

## Objective

Expose the frozen contracts reliably. No new endpoints beyond what the UI needs; no reshaping responses ad hoc in components.

## Sub-phases

### 11.1 Route scaffolding

Next.js Route Handlers under `app/api/`:

```
GET  /api/panels/[panelId]
GET  /api/panels/[panelId]/patients
GET  /api/patients/[patientId]
GET  /api/patients/[patientId]/timeline
GET  /api/patients/[patientId]/gaps
GET  /api/panels/[panelId]/queue
GET  /api/evidence/[gapId]
GET  /api/metrics
GET  /api/eval
POST /api/panels/[panelId]/load
POST /api/gaps/[gapId]/action      (P1 — after all P0 green)
```

### 11.2 Response contracts

Implement exactly `research/build-readiness/api-contracts.md`:

- `patient_priority_score`, `gap_priority_score`, `priority_band` — no bare `priority_score`, no `risk_level`.
- Every clinical response includes the `disclaimer` string.
- Metrics returns separate `counted` / `baseline` / `measured` / `modeled` blocks.
- Eval returns measured values or `status: "not_run"` — never invented numbers.

### 11.3 Error model

Structured errors with stable codes:

`panel_not_found`, `patient_not_found`, `gap_not_found`, `gap_not_grounded`, `invalid_payload`, `pipeline_error`.

- 404 for unknown ids, 400 for bad payloads, 500 only for genuine pipeline failure (message names the stage).
- No stack traces or internal paths in responses.

### 11.4 Caching and performance headers

- `Cache-Control` appropriate for demo data (short-lived, revalidating).
- Panel endpoints served from the cache in < 50 ms.

### 11.5 Contract tests

- One test per route asserting shape, required fields, and disclaimer presence.
- Snapshot tests for the response *shape* (not exact values, which change with data).
- Negative tests: unknown ids, malformed payload, ungrounded gap id.
- A test asserting no response contains `risk_level` or bare `priority_score`.

### 11.6 P1 action endpoint (deferred)

- Only after all P0 green: `POST /api/gaps/[gapId]/action` recording `acknowledged | contacted | reviewed` in local state.
- No mutation of clinical data.

## Deliverables

| Artifact | Purpose |
|---|---|
| `app/api/**/route.ts` | 11 handlers |
| `lib/api/respond.ts` | shared response + error helpers |
| `lib/api/schemas.ts` | runtime validation of query params and bodies |
| `tests/api/*.test.ts` | contract + negative tests |

## Gate — exit criteria

- [ ] All P0 routes return contract-conformant payloads (tests green).
- [ ] Unknown ids return 404 with a structured `error.code`.
- [ ] Every clinical response includes `disclaimer`.
- [ ] No `risk_level` / bare `priority_score` anywhere in a response body (test).
- [ ] Demo routes respond in < 50 ms from cache.
- [ ] `POST /load` is idempotent for the demo panel.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Frontend shaping data that the API should provide | Contracts first; UI consumes as-is |
| Drift between contract doc and handler | Contract tests derived from the doc's field lists |
| Adding endpoints for convenience | New endpoint requires a phase-file change |

## Handoff to Phase 12

Phase 12 builds screens against these endpoints only. If a screen needs a new shape, change the contract (and this file) — not the component.

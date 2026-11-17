# Phase 16 — Reliability & Failure Testing

> Depends on: Phase 15 (safety) · Unblocks: Phase 17
> Gate: **P0 regression suite green**

## Objective

Break it on purpose, now, in private. Every failure mode needs a graceful state — the demo must never show a raw error, a blank screen, or a fabricated result.

## Sub-phases

### 16.1 Failure matrix (must be handled)

| # | Failure | Required behavior |
|---|---|---|
| 1 | Invalid LLM JSON | retry ≤2, then `pipeline_error` naming the stage |
| 2 | LLM/API unavailable | demo serves cache; custom path shows retry |
| 3 | Zero gaps on a patient | confident "no gaps detected" state, not an error |
| 4 | Many gaps (10+) on one patient | scrollable, primary gap still emphasized |
| 5 | Missing source document | gap dropped, count logged, no crash |
| 6 | Malformed date | event rejected, extraction continues |
| 7 | Ambiguous alias | normalized or flagged; never silently mis-grouped |
| 8 | Duplicate documents | deduped by doc id; no phantom duplicate-test gap |
| 9 | Empty panel | "load demo data" empty state |
| 10 | Bad patient/gap id | 404 + structured error, friendly UI |
| 11 | Cache corruption | checksum failure → clear message, no partial render |
| 12 | Slow path (simulated) | stage-named loading states |
| 13 | Narrow viewport (1024px) | usable layout, no overlap |
| 14 | Refresh mid-flow | deep link restores state |

### 16.2 Graceful-state implementation

- Error boundary at the app shell + per-route.
- `Skeleton`, `EmptyState`, `ErrorState` components used consistently.
- Retry buttons that actually retry (not a page reload).

### 16.3 Regression suite

- `tests/reliability/*` covering each row above (mock the LLM client for 1, 2, 5; corrupt cache fixture for 11).
- A scripted smoke test that walks the demo path and asserts no console errors.

### 16.4 Observability for the demo

- `logs/` for extraction drops, ungrounded gaps, and pipeline errors.
- A dev-only `/api/health` reporting: cache loaded, eval status, LLM mode (mock/live), dataset checksum.

## Deliverables

| Artifact | Purpose |
|---|---|
| `tests/reliability/*.test.ts` | failure matrix coverage |
| `components/states/*` | skeleton / empty / error |
| `app/api/health/route.ts` | demo health snapshot |
| `docs/FAILURE_MODES.md` | matrix + expected behavior |

## Gate — exit criteria

- [ ] All 14 rows in the failure matrix handled and tested.
- [ ] No raw stack trace or internal path reachable in any UI state.
- [ ] Cache corruption produces a clean, explanatory error.
- [ ] Demo path smoke test completes with zero console errors.
- [ ] `/api/health` accurately reports cache/eval/LLM mode.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Handling errors by hiding them | Errors are visible, friendly, and logged |
| Retry loops that never terminate | Bounded retries with a terminal error state |
| Only testing the happy path | The matrix is the test plan |

## Handoff to Phase 17

Phase 17 tunes speed and rehearses the demo repeatedly against this hardened system.

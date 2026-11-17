# Phase 10 — Persistence & Demo Cache

> Depends on: Phase 9 (real outputs) · Unblocks: Phase 11, 13
> Gate: **judge demo works with no LLM key and no network beyond the app**

## Objective

Make the judge experience independent of LLM latency, rate limits, outages, and Wi-Fi. A live path may exist; the official demo runs against validated cached results.

## Sub-phases

### 10.1 Supabase schema

- Tables per `research/architecture/data-schema.md`: `panels`, `patients`, `records`, `timeline_events`, `gaps`, `prioritized_queue`, `eval_results`.
- No `risk_level`, no `risk_score`.
- Indexes: `records(patient_id, date)`, `gaps(patient_id, type)`, `prioritized_queue(panel_id, rank)`.
- Migration file committed; seed script idempotent.

### 10.2 Cache writer

`scripts/build-demo-cache.ts` writes `data/demo-cache/`:

```
panel.json        Panel + patients (headers)
records.json      all records incl. text (needed for evidence)
timelines.json    { patient_id: TimelineEvent[] }
gaps.json         { patient_id: Gap[] }   (verified only)
queue.json        ranked top-K + headlines
metrics.json      counted / baseline / measured / modeled blocks
eval.json         measured eval report
manifest.json     dataset checksum, pipeline version, generated_at, seed
```

- File names and shapes match `api-contracts.md`.
- Cache is **generated**, never hand-edited. A checksum mismatch at load time fails loudly.

### 10.3 Cache reader

`lib/data/source.ts` — one interface, two implementations:

- `CachedSource` (demo) — reads JSON, zero network, zero LLM.
- `LiveSource` (fallback) — runs the pipeline for custom/uploaded panels.

Selection: `DEMO_MODE=true` (default for the deployed demo) → cached. Any request for `panelId=demo` always uses cache.

### 10.4 Offline proof

- Remove `OPENAI_API_KEY`, restart, run the whole demo path.
- Assert zero outbound LLM calls (mock client throws if invoked).
- Assert identical queue order and scores to the cached run.

### 10.5 Supabase as optional credibility layer

- Loader can populate Supabase from the same JSON so the "we have a real database" claim is true.
- The demo must not *depend* on Supabase being reachable; cached JSON is the source of truth at demo time.

## Deliverables

| Artifact | Purpose |
|---|---|
| `lib/data/source.ts` | CachedSource / LiveSource switch |
| `scripts/build-demo-cache.ts` | cache generation |
| `data/demo-cache/*.json` | frozen demo artifacts |
| `supabase/migrations/*.sql` | schema |
| `scripts/seed-supabase.ts` | idempotent loader |

## Gate — exit criteria

- [ ] Demo path renders the full flow with `OPENAI_API_KEY` unset.
- [ ] Cached run and live run produce identical queue order, gap ids, and scores.
- [ ] Cache manifest checksum verified at load; corruption produces a clear error, not a broken screen.
- [ ] `panelId=demo` never triggers an LLM call (asserted by a throwing mock).
- [ ] Supabase seed is idempotent (run twice → same row counts).

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Hand-editing cache JSON to make the demo nicer | Cache is generated; checksum enforced; edits require a pipeline fix |
| Demo silently falling back to live and timing out | Demo mode is default; live calls throw in demo mode |
| Two sources of truth (cache vs DB) diverging | Cache is authoritative at demo time; DB is loaded from the same artifacts |

## Handoff to Phase 11

Phase 11 exposes these cached/live sources through the frozen HTTP contracts.

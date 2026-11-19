# Offline Demo Mode

The official judge path must work with no LLM key, no Supabase, and no external network
beyond serving the application itself.

## What runs offline

`JsonDemoRepository` reads `data/demo-cache/continua-demo-cache-v1` from disk, validates it
once, builds in-memory indexes, and serves:

- panel and patient list,
- Top-5 queue and gap/patient priorities,
- timeline per patient,
- verified gaps and evidence bundles/deep dives,
- evaluation report and impact metrics,
- Maria navigation ids.

No extractor, detector, evidence verifier, or priority computation executes at read time.
`lib/cache/source-run.ts` is build-only.

## Configuration

```
CONTINUA_DEMO_MODE=true      # default official demo configuration
```

`LLM_API_KEY`, `SUPABASE_URL`, and related variables are optional in this mode. The cache
store does not import the provider client or the database client, so an absent key cannot
turn into a runtime failure. `tests/cache/offline.test.ts` deletes those environment
variables, initializes the repository, and exercises every P0 read.

## What "offline" does not mean

The deployed URL still needs network access from the judge's browser. Offline here means:
no external data, AI, or database services are needed to produce the demo intelligence.

Live healthcare systems, live model calls, and Supabase-backed coordinator actions are
out of scope for P0.

## Backup layers

1. Hosted deployment.
2. Local `npm run build && npm run start` against the committed cache.
3. Recorded 1–2 minute demo video.

## No fake AI theater

Because reads come from cache, the UI must say so — "Demo data loaded · benchmark-qualified
snapshot" — and must not show "Analyzing 80 patients…". Historical timing claims are only
shown when they come from a measured, classified source (`impact.json.measured`).

## Recovery

If initialization fails, the app shows:

> Demo data couldn't be validated. Reload the application or use the packaged demo
> snapshot.

The developer log carries the exact cause (`DemoCacheUnavailableError.code`). The
repository keeps returning `DEMO_CACHE_INVALID` until a rebuild succeeds; it never serves
partial data. See `docs/cache/recovery.md`.

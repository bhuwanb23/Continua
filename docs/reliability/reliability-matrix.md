# Reliability Matrix

Frozen suite: `tests/reliability/*.test.ts` (102 tests, 18 files).
Injected fault scenarios: `artifacts/reliability/fault-results.json` (14/14).
Browser behavior checks: `artifacts/reliability/browser-results.json`.
Recovery drills: `artifacts/reliability/recovery-results.json` (A-E).

## Layer coverage

| Layer | Tests | What is proven |
| --- | ---: | --- |
| Happy path / golden | 3 | Frozen cache output matches the generated baseline; all 8 P0 stages return 200. |
| Dataset | 10 | Missing IDs, impossible dates, duplicates, bad encoding, bad snapshot versions fail closed. |
| Extraction / retries | 7 | Three-attempt cap, no retry on trust failures, deterministic backoff, no invented events. |
| Completeness | 6 | PARTIAL/FAILED patients cannot produce absence-derived gaps; honest copy is used. |
| Event store | 10 | Payload/discriminator, ownership, date, confidence, alias, and merge boundaries are enforced. |
| Detectors | 7 | Zero/one event, order independence, frozen follow-up/monitoring/duplicate boundaries. |
| Evidence | 7 | Missing source, wrong patient, altered span, stale store, and contradicted absence suppress output. |
| Priority | 9 | Zero-gap panels, invalid arithmetic, NaN/Infinity, ties, frozen queue order, demographic neutrality. |
| Cache | 10 | Missing, malformed, edited, stale, dangling, unverified, and tampered artifacts all fail validation. |
| Repository | 6 | Invalid cache is unavailable, reads are refused, valid-cache nulls stay honest, restart revalidates. |
| API | 7 | Structured 404/400 contracts, no raw exceptions, no invented gaps, read-only surface. |
| Dependencies | 2 | Full P0 path with LLM/Supabase/network disabled; demo mode ignores credentials. |
| Determinism | 4 | 100 detection runs, 100 priority runs, 20 evidence runs, object-identity independence. |
| Concurrency | 2 | 50 interleaved reads agree; independent repositories initialize to the same state. |
| Race conditions | 4 | Late responses cannot overwrite a newer patient or evidence request. |
| Recovery | 6 | Drill scoring, fallback definitions, and invalid recovery timing. |
| Soak | 1 | 50 consecutive P0 route runs, 400 requests, no failures. |
| Browser artifact | 1 | Recorded Chromium run has zero unexpected, skipped, or flaky specs. |

## Injected faults

`FAULT-01` through `FAULT-14` span extraction, detectors, evidence, cache,
priority, API delay, UI race, and determinism. Outcomes: 10 `FAILED_SAFE`,
2 `DEGRADED`, 2 `RECOVERED`; 0 `UNSAFE_FAILURE`.

## Browser and viewport

Chromium on Playwright 1.51.1 covers desktop and 390x844. Nine behavior specs
passed with no external network requests on the P0 path. Edge is not installed
on this machine (`NOT_RUN`); Firefox and Safari are `N/A`, not claimed as passed.

## Performance

The soak run's route-level median was 3 ms, p95 6 ms, worst 238 ms over 50
runs. These are in-process route timings, not hosted latency or an SLA. Heap
growth over the short 409 ms run was 9.61 MB and is not evidence of a leak.

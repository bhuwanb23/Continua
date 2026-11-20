# CONTINUA RELIABILITY V1

Version: `continua-reliability-v1`  
Frozen: 2026-11-19  
Generated: 2026-11-20T05:46:08.531Z

> Prototype rehearsal reliability only. No production uptime, availability, or HIPAA claim.

## Summary

| Metric | Value |
| --- | ---: |
| Total failure scenarios | 116 |
| Passed | 116 |
| Failed | 0 |
| All verification checks | 131 |
| R0 unresolved | 0 |
| R1 unresolved | 0 |
| R2 accepted | 0 |
| R3 accepted | 0 |
| Unsafe failures | 0 |

Reliability tests: 102/102. Injected faults:
14/14. Browser specs:
10/10. Recovery drills:
5/5.

## Acceptance gates

| Gate | Name | Status | Evidence |
| --- | --- | --- | --- |
| A | Safety under failure | PASS | 0 unsafe failures, 14/14 injected scenarios passed. |
| B | Partial-data integrity | PASS | 6/6 completeness tests passed; FAULT-05 suppresses absence gaps. |
| C | Determinism | PASS | 100 detection runs, 100 priority runs, and 20 evidence runs had zero semantic differences. |
| D | Cache | PASS | 16/16 cache and repository failure tests passed; corrupt caches are not served. |
| E | API | PASS | 7/7 contract scenarios passed with no raw exception leak. |
| F | UX | PASS | 10/10 Chromium behavior specs passed, including degraded and fallback states. _(Edge NOT_RUN; Firefox/Safari N/A.)_ |
| G | Dependencies | PASS | P0 read path passed with LLM, Supabase, and network disabled; local route path also passed. |
| H | Race safety | PASS | 4/4 race-condition tests passed; no stale-patient overwrite observed. |
| I | Demo fallback | PASS | Drills A-E passed; local boot 0.112s, local P0 path 0.137s, recorded backup verified. _(NOT_TESTED (no hosted deployment available from this environment); hosted failure was simulated (true).)_ |
| J | Reproducibility | PASS | Clean .next build PASS; 3/3 frozen golden checks passed. _(Built on the current machine, not a fresh clone or separate machine.)_ |
| K | Failure budget | PASS | 0 unresolved R0, 0 unresolved R1, 0 UNSAFE_FAILURE. |

## Critical integrity

| Check | Count |
| --- | ---: |
| Wrong-patient outputs | 0 |
| Ungrounded gaps displayed | 0 |
| Partial analyses shown complete | 0 |
| Corrupt caches served | 0 |
| Stale rankings served | 0 |

## Determinism

- Core repeat runs: 100 detection + 100 priority; semantic differences: 0.
- Evidence verification repeats: 20; differences: 0.
- Top-5 repeat differences: 0.
- 50 interleaved reads agreed in concurrency tests.

## Dependencies

| Dependency | P0 result |
| --- | --- |
| LLM outage | PASS |
| Database outage | PASS |
| Local cached fallback | PASS |
| Recorded fallback | PASS |
| Hosted demo fallback | NOT_TESTED (no hosted deployment) |

## API

Contract scenarios: 7; passed: 7; unexpected 5xx: 0; raw
exception leaks: 0. The surface is read-only; invalid IDs return structured
400/404 responses.

## Client

Chrome: PASS (10 specs, 0 failed, 0 skipped, 0 flaky).  
Edge: NOT_RUN. Firefox: N/A. Safari: N/A.  
UI race failures: 0. Flagship console errors: 0. Viewports: 1280x720 and 390x844.

## Soak and flagship

- 50/50 consecutive P0 runs passed.
- 400 requests over 292 ms.
- Median 3 ms, p95 5 ms, worst 133 ms.
- Unhandled errors: 0.
- Heap growth: 9.19 MB; assessment NONE for this short run.

These are in-process route timings, not hosted latency.

## Recovery drills

| Drill | Result | Measured | Notes |
| --- | --- | ---: | --- |
| A | PASS | 0.112s | Simulated hosted failure. Frozen cache startup PASS; 80 patients; 5-item queue. |
| B | PASS | 0.137s | Simulated mid-demo hosted failure. Local P0 route path PASS; Maria rank 27. |
| C | PASS | 0s | Browser drill passed: failed evidence request showed explicit error; retry rendered the real bundle. Reused browser artifact, not independently timed. |
| D | PASS | 0s | Browser drill passed: frozen evaluation page rendered benchmark provenance and limitations. Reused browser artifact, not independently timed. |
| E | PASS | 0s | Recorded six-scene walkthrough verified as WebM (256 KB). Playback not independently timed. |

Hosted deployment: NOT_TESTED (no hosted deployment available from this environment). Hosted failure was simulated;
A and B measure the local fallback. C-E are verified from browser artifacts and
the recorded WebM, not independently timed.

## Build

`npm run build` after removing `.next`: PASS in
300485 ms. This proves the current machine builds cleanly,
not that a separate clean clone has no hidden dependencies.

## Accepted risks

No R2 or R3 issues were accepted. Expected `FAILED_SAFE` and `DEGRADED`
outcomes are truthful behavior, not accepted defects.

## Unresolved limitations

- No hosted deployment exists in this environment; hosted failure was simulated and is not an uptime claim.
- Edge was not installed (NOT_RUN); Firefox/Safari are N/A. Only Chromium behavior is claimed.
- The soak is 50 in-process runs / 400 requests lasting milliseconds, not a production soak.
- Three pre-existing repository test failures remain outside this reliability suite.
- Build reproducibility was checked on the current machine, not a separate clean clone.
- C, D, and E recovery drills are artifact assertions, not independently timed recoveries.

## Overall

**PASS**

Frozen as `continua-reliability-v1`.

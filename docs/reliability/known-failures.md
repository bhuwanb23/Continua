# Known Failures and Limitations

This file records what was **not** proven. It is part of the report, not a list
of things that were waived.

## Accepted R2/R3 issues

None. The frozen fault matrix reports 0 accepted R2 and 0 accepted R3 issues.
R2/R3 scenarios that ended `FAILED_SAFE` or `DEGRADED` are expected behavior,
not accepted defects.

## Untested environments

- **Hosted deployment:** no hosted deployment is available from this
  environment. Drills A and B simulate the hosted failure and then measure the
  local cached fallback. No hosted uptime, latency, or cold-start claim is made.
- **Edge:** not installed; reported `NOT_RUN`, not passed.
- **Firefox and Safari:** not run; reported `N/A`. Only Chromium behavior is
  claimed.
- **Real patient data:** never used. All data is synthetic and frozen.

## Limits of the measurements

- The soak is 50 consecutive in-process P0 route runs (400 requests) lasting
  409 ms. It is a failure-drift and memory-smoke check, not a multi-hour soak.
- Heap growth of 9.61 MB over that short run is not evidence of a leak and was
  not treated as a production memory profile.
- Route timings are in-process calls, not hosted network latency.
- The recorded fallback is a 13-second, 256 KB WebM captured from the local
  demo. It is verified to have a valid WebM header and non-trivial size; smooth
  playback on the presentation machine was not instrumented.
- C, D, and E recovery drills are artifact assertions, not independently timed
  recoveries.

## Pre-existing repository failures

The full repository suite has three known failures outside the Phase 16
reliability suite. They are baseline issues, not reclassified as passes:

1. `tests/benchmark/preflight.test.ts`
2. `tests/cache/reproducibility.test.ts` (manifest commit mismatch)
3. `tests/reproducibility/reproducibility.test.ts` (label isolation)

They do not touch the P0 read path, cache validation of the demo snapshot, or
evidence verification. They remain open and are reported in the final report.

## Fault-injection boundary

Fault injection is test-only dependency injection. There is no query parameter,
environment variable, or UI control that enables a fault in a running demo.
`faultsAllowedInCurrentProcess()` recognizes only test/rehearsal contexts.

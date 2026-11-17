# Phase 17 — Performance & Demo Hardening

> Depends on: Phase 16 (reliability) · Unblocks: Phase 18
> Gate: **20 consecutive successful demo runs, each < 90 seconds**

## Objective

The demo must work every single time. Not usually. Every time. A single broken rehearsal is evidence that the real one could break.

## Sub-phases

### 17.1 Performance budgets

| Path | Budget |
|---|---|
| Cold load of dashboard (cached) | < 1.5 s |
| Queue render | < 300 ms |
| Patient page (cached) | < 500 ms |
| Evidence drawer open | < 150 ms |
| Full live panel synthesis (non-demo path) | < 60 s |
| Demo path total (script) | < 90 s |

- Measure with real timings written to `metrics.json.measured`.
- No budget is claimed without a measurement on the demo machine.

### 17.2 Caching and prefetch

- Prefetch patient detail on queue hover/focus.
- Cache immutable demo payloads at the edge.
- No client-side waterfall: queue → patient → evidence should be 3 requests max.

### 17.3 Rehearsal protocol

- Run the full scripted demo 20 consecutive times.
- Log each run: duration, any visual glitch, any missing evidence, any delayed beat.
- A single failure resets the counter.

### 17.4 Failure contingencies

- Backup recording of the full demo (screen capture) stored locally and in the repo's release assets.
- Offline checklist: laptop charged, browser zoom fixed, no OS notifications, single tab, no auto-updates.
- If live deployment fails, run locally from cache.

### 17.5 Demo machine parity

- Verify the demo on the machine and browser actually used for judging.
- Confirm no dependency on a second monitor, dev tools open, or a specific window size beyond the script.

## Deliverables

| Artifact | Purpose |
|---|---|
| `docs/PERFORMANCE.md` | budgets vs measured |
| `docs/REHEARSAL_LOG.md` | 20-run log with durations |
| backup demo video | contingency |
| `scripts/smoke-demo.ts` | automated path check |

## Gate — exit criteria

- [ ] 20 consecutive successful runs logged, each < 90 s.
- [ ] Measured values in `metrics.json` match `PERFORMANCE.md`.
- [ ] No missing evidence across any of the 20 runs.
- [ ] Maria's position and scores identical in all 20 runs.
- [ ] Backup video exists and plays without audio/video desync.
- [ ] Local fallback verified with the network disabled after first load.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Rehearsing only the happy path | Failure contingencies rehearsed once each |
| "It'll be fine on the day" | 20-run counter, no exceptions |
| Latency claims from a dev laptop only | Measure on the judging machine |

## Handoff to Phase 18

Only after the demo is bulletproof does visual polish get real time.

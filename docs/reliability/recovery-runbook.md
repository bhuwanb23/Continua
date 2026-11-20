# Recovery Runbook

This runbook is for the rehearsal demo. It does not assert production RTO,
uptime, or HIPAA compliance. Never debug live in front of a judge.

## Triage

1. Stop narrating the failed screen.
2. Name the failure plainly: "that view did not load."
3. Move to a rehearsed fallback below; do not refresh repeatedly.
4. Record what failed and which fallback was used.

## Fallback order

### 1. Local cached app

Use when the hosted app or network is unavailable and the local repository is
present.

```bash
npm run dev
# open http://127.0.0.1:3000
```

Startup must validate the frozen cache first. If readiness is not `READY`, do
not narrate patient data from that process; move to the recorded walkthrough.

Measured rehearsal: cache boot 0.095 s and local P0 route path 0.136 s. These are
local measurements, not a hosted recovery guarantee.

### 2. Frozen evaluation artifact

Use when the evaluation page is unavailable but the demo can continue.

- Open `/evaluation` on the local app if available.
- If the page itself is broken, use the frozen benchmark report artifact and
  label it explicitly as frozen evidence.
- Do not recompute, retype, or improvise benchmark numbers.

### 3. Recorded walkthrough

Use when both apps fail, the browser crashes, or the screen share is lost.

- File: `artifacts/reliability/backup-walkthrough.webm`
- It is a real six-scene capture of the local flagship demo, 256 KB.
- Label it as a recording. Do not present it as a live run.

## Drill results

| Drill | Scenario | Fallback | Target | Measured | Result |
| --- | --- | --- | ---: | ---: | --- |
| A | Hosted app fails before demo | Local cached app | 15 s | 0.095 s | PASS |
| B | Hosted app fails mid-demo | Local cached app | 15 s | 0.136 s | PASS |
| C | Maria route fails | Local cached app + explicit retry | 10 s | not independently timed | PASS |
| D | Evaluation page fails | Frozen evaluation | 10 s | not independently timed | PASS |
| E | Browser crashes | Recorded walkthrough | 10 s | not independently timed | PASS |

A and B simulate the hosted failure because no hosted deployment is available
from this environment. C and D reuse the passed browser degraded-state drills.
E verifies the recording's WebM header and size. C, D, and E are artifact
assertions, not measured recovery times. Full detail is in
`artifacts/reliability/recovery-results.json`.

## After the demo

Run the drill script again if any route, cache artifact, or browser behavior
changed:

```bash
npm run reliability:drill
```

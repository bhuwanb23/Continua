# Demo Recovery

Presenter card for the flagship rehearsal.

## If a screen fails

| Symptom | Action |
| --- | --- |
| Hosted app does not load | Start the local cached app; do not retry the hosted URL. |
| A panel fails while loading | Use the visible retry once. If it fails again, switch to the local app. |
| Maria's evidence fails | The page shows an explicit evidence error. Retry; if it persists, stay on the verified issue list and do not narrate evidence. |
| Evaluation page fails | Open the frozen evaluation page locally. If that is unavailable, show the frozen benchmark artifact and say it is frozen. |
| The browser dies or screen share is lost | Play `artifacts/reliability/backup-walkthrough.webm` and label it a recording. |

## What never to do

- Do not present cached or recorded material as a live run.
- Do not fill a blank evidence panel with a plausible story.
- Do not retype benchmark numbers from memory.
- Do not claim production uptime, real patient use, or HIPAA compliance.
- Do not debug in front of the judge.

## Local start

```bash
npm run dev
```

Open `http://127.0.0.1:3000`. The P0 path needs no LLM, Supabase, or external
network credentials. If cache readiness fails, the app must show an unavailable
state; use the recorded walkthrough rather than serving an invalid cache.

## Rehearsal evidence

All five drills in `artifacts/reliability/recovery-results.json` pass. Browser
degraded states are recorded in `artifacts/reliability/browser-results.json`.
The hosted deployment itself was not available for testing; hosted failure was
simulated locally.

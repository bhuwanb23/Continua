# Scene-by-scene

Each scene maps 1:1 to `SCENES` in `lib/demo/flagship.ts` and to the rendered
`DemoClient` section. No scene edits data.

## Scene 1 — The problem (10s)

- Route: `/demo` (scene 1)
- Data: `api.panel()` → `patient_count` (80), `patients_with_verified_gaps`
- Visual: one number, 80 patients, with patients-with-verified-gaps count
- Focus anchor: none
- Spoken: "Care coordinators don't lack patient data. They lack time to find what
  matters across fragmented records."
- Caption: "Continua turns the full panel into the coordination issues worth
  reviewing first."

## Scene 2 — Continua's output (13s)

- Route: `/demo` (scene 2)
- Data: `api.queue('demo', 5)` → 5 items with rank, name, band, label, headline
- Visual: five real queue cards, top-5, with priority badge
- Focus anchor: `queue`
- Spoken: "Sarah has 80 synthetic patients. Continua reconstructs their care
  journeys, verifies continuity gaps, and gives her a ranked review queue."
- Caption: "These five aren't predicted to be clinically high risk. They're the
  five highest-priority verified coordination issues under our workflow model."

## Scene 3 — Maria's journey (19s)

- Route: `/demo` (scene 3)
- Data: `api.patient(FLAGSHIP_PATIENT_ID)`, `api.timeline(FLAGSHIP_PATIENT_ID)`
- Visual: patient header, 10 of N reconstructed events, rank 27
- Focus anchor: `timeline`
- Spoken: "Let's look at Maria. Her information is spread across primary care,
  surgery, imaging, labs and medication records. Continua reconstructs those
  records into one source-linked journey."
- Caption: "Maria is real rank 27 in this panel; she is here because her story is
  representative, not because she is #1."

## Scene 4 — The gap (19s)

- Route: `/demo` (scene 4)
- Data: `api.gaps(FLAGSHIP_PATIENT_ID)` → missed-followup gap, verified,
  `recommended_coordinator_action`
- Visual: gap card with band, summary, coordinator action, rank disclosure
- Focus anchor: `flagship-gap`
- Spoken: "This referral asked for medical-oncology follow-up within 45 days.
  That window passed, and Continua found no qualifying completed oncology
  consultation in the available records."
- Caption: "Instead of burying that signal in another summary, Continua turns it
  into a coordinator action — verify referral status and coordinate follow-up."
- Button: "View evidence" (also available in scene 5).

## Scene 5 — Evidence (15s)

- Route: `/demo` (scene 5)
- Data: `api.evidence(FLAGSHIP_GAP_ID)` — one click
- Visual: source quote, absence check (0 matches, 2026-03-25 → 2026-05-09),
  referral-window policy `followup_window_days=45`
- Focus anchor: `evidence`
- Spoken: "Continua doesn't ask Sarah to trust a black box: here is the exact
  source, the source-defined 45-day window, and the search over Maria's available
  records showing zero matching completed consults. If required evidence can't be
  verified, Continua suppresses the gap rather than showing it."

## Scene 6 — Architecture + evaluation (14s)

- Route: `/demo` (scene 6)
- Data: `api.evaluation()` → benchmark run id, status, limitations
- Visual: hybrid architecture 4-step list, frozen benchmark line, limitations
- Focus anchor: `evaluation`
- Spoken: "Under the hood, the AI only extracts structured facts. Deterministic
  rules detect gaps, a separate evidence layer verifies every displayed claim, and
  our intervention-priority engine ranks only verified issues. We evaluate the full
  system on a frozen synthetic benchmark, including held-out patients and
  adversarial negative cases. Continua helps coordinators spend their time on
  patients, not on finding the signal hidden in the chart."

## Navigation

- ← / P previous, → / N next, R reset, bottom bar has Prev/Next/Reset.
- Persisted scene in sessionStorage `continua-demo-scene`.
- `/demo?reset=1` clears state and returns to scene 1.
- Preflight: `validateDemo()` reads only frozen endpoints; on failure shows
  `DemoFallback` with retry + patient workspace + evaluation links.

## Evidence click budget: 1 (scene 4 or 5, same state).

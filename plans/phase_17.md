Continua Phase 17: Performance & Demo Hardening

Phase 16 proved Continua behaves predictably when components fail. Phase 17 now takes that reliable system and makes it fast, stable, deployment-ready, and nearly impossible to derail during judging.

The governing rule is:

Optimize delivery, not intelligence.

extractor-v1, gaps-v1, evidence-v1, priority-v1, and the frozen benchmark results do not change in this phase.

17.0 Phase Mission

Turn the reliable prototype into a hardened judge build where:

the first screen appears quickly,
queue and patient navigation feel immediate,
Maria's evidence is preloaded,
browser/layout behavior is stable,
cold starts are understood,
no live LLM is required,
no optional database is required,
hosted and local builds behave equivalently,
the demo repeatedly finishes inside its time budget,
recovery from a demo-environment failure takes seconds.

Target experience:

Open Continua
      ↓
Today immediately usable
      ↓
Queue
      ↓
Patient
      ↓
Timeline
      ↓
Verified issue
      ↓
Evidence
      ↓
Evaluation


No waiting around for backend intelligence.

17.1 Inputs

Phase 17 consumes only frozen upstream artifacts:

continua-reliability-v1
continua-api-v1
continua-demo-cache-v1
Coordinator UX v1
Oncology Flagship Experience v1
continua-safety-v1
continua-benchmark-v1


plus actual Phase-16:

p50/p95 API timings
cold-start observations
E2E timings
browser results
fallback tests
accepted R2/R3 reliability issues
17.2 Outputs

Phase 17 produces:

continua-demo-release-candidate-v1

including:

performance budget
frontend bundle optimization
server/cache startup optimization
route/data preloading
interaction hardening
deployment configuration
cold-start strategy
warm-up procedure
browser/display profile
local backup package
recorded-demo backup
demo reset system
rehearsal automation
launch checklist
performance report
final demo reliability report
17.3 Non-Goals

Do not:

change care-gap logic,
tune F1,
introduce a new model,
alter Maria's scenario,
alter rankings,
rewrite benchmark labels,
add features,
introduce Redis,
introduce microservices,
optimize hypothetical hospital-scale traffic,
fake processing animations,
defer correctness for speed.

If an optimization changes clinical/intelligence semantics:

Reject the optimization.

17.4 Phase Map
Subphase	Workstream	Outcome17.0	Baseline freeze	Current performance measured
17.1	Performance budget	Targets locked
17.2	Critical-path profiling	Bottlenecks located
17.3	Bundle hardening	Browser payload reduced
17.4	App startup	Cold boot optimized
17.5	Repository/cache	Reads optimized
17.6	API latency	P0 endpoints hardened
17.7	Route strategy	Fast navigation
17.8	Preloading	Demo data warmed
17.9	Evidence path	Flagship interaction immediate
17.10	UI rendering	Re-render/layout control
17.11	Asset optimization	Fonts/icons/images
17.12	Deployment	Hosted build hardened
17.13	Cold-start defense	Startup variability controlled
17.14	Local fallback	Offline intelligence build
17.15	Demo reset	Known state restored
17.16	Presentation environment	Screen-share optimized
17.17	Rehearsal harness	Repeatable runs
17.18	Stress/repetition	Demo stability
17.19	Performance regression	CI budgets
17.20	Failure drills	Fast fallback
17.21	Final validation	Release candidate
17.22	Freeze	RC v1
17.5 Performance Principles

Freeze five principles.

P1: Never optimize by weakening safety

No:

skip evidence verification


because it saves 30 ms.

P2: Cache computation, not truth

Use Phase-10 benchmark-qualified artifacts.

Don't hardcode UI values.

P3: Optimize the judge path first

Critical path:

Today
→ Patient
→ Verified Gap
→ Evidence
→ Evaluation


Patient search filter speed is secondary.

P4: Perceived latency matters

A 250 ms request that produces layout jumping can feel worse than a stable 400 ms screen.

Optimize:

immediate shell
stable dimensions
predictable transitions

not only server benchmarks.

P5: Measure before optimizing

No speculative rewrites.

Profile:

network
server
render
bundle
cold startup


then fix dominant contributors.

17.6 Performance Budget

Freeze an engineering budget before optimization.

For the cached official demo:

Interaction	TargetCache initialization	<500 ms local target
Panel API server time	<50 ms
Queue API server time	<50 ms
Patient API	<75 ms
Timeline API	<100 ms
Gap API	<75 ms
Evidence API	<100 ms
Evaluation API	<50 ms
Warm client navigation	<300 ms perceived
Evidence drawer after preload	<150 ms perceived

Actual release report must contain measured numbers.

17.7 Frontend Web-Vitals Budget

For the deployed judge experience, aim for:

LCP < 2.5 s
CLS < 0.1
INP < 200 ms


These are useful engineering targets, not contest claims.

If a serverless cold start occasionally pushes first load beyond them, record that honestly and make warm-up/fallback part of demo operations.

17.8 Demo Time Budget

Phase 13 target remains:

80–85 seconds rehearsed
90 seconds hard maximum


Phase 17 adds operational budgets:

UI/system waiting during demo:
target <3 seconds cumulative

live LLM waiting:
0 seconds

manual troubleshooting:
0 seconds


The presenter should spend time telling the story, not waiting.

17.9 Freeze Performance Baseline

Before changing anything, capture:

cold page load
warm page load
queue API
patient API
timeline API
evidence API
evaluation API
JS bundle sizes
page bundle sizes
render timing
demo total time


Save:

artifacts/performance/baseline.json


Then every optimization needs evidence.

17.10 Profile the Critical Path

Break Total Demo Latency into:

Browser navigation
+
Next.js route/API
+
repository lookup
+
React render
+
animation


We already know:

clinical reasoning ≈ 0


during official cached demo.

If screen transitions remain slow, the problem is delivery/frontend, not AI.

17.11 Bundle Audit

Inspect production build.

Look for:

unexpectedly large client components
giant icon imports
chart libraries
unused libraries
code that's unnecessarily client-side
full benchmark JSON shipped to browser
all 500 records bundled upfront
17.12 Server vs Client Components

With Next.js, default to server-side rendering/server components where appropriate.

Client components only where interaction requires them:

evidence drawer
local filters
demo controls
optional actions

Don't mark an entire page "use client" because one button needs state.

This reduces shipped JavaScript.

17.13 Keep Clinical Data Server-Side Until Needed

On Today:

fetch:

queue
panel summary


Not:

80 patients
500 documents
all evidence
entire benchmark


On patient page:

fetch that patient only.

Evidence:

preload only flagship evidence in judge mode.

17.14 Eliminate Heavy Chart Libraries

If Evaluation uses only:

performance bars
simple funnel
detector table

prefer HTML/CSS primitives.

A full plotting package solely to render three bars isn't worth bundle/runtime cost.

If a library already exists and is lightweight enough, measure before removing.

17.15 Font Strategy

Avoid demo failure because a remote font CDN is blocked or slow.

Prefer:

system font stack, or
locally bundled font supported by framework.

No essential external font dependency.

17.16 Icons

Import individual icons.

Avoid packages/import patterns that accidentally ship hundreds.

But don't spend hours shaving 8 KB if actual profile says something else dominates.

17.17 Image Strategy

Continua's core UX is data-driven.

Avoid large hero stock photography.

For logo/brand assets:

SVG/optimized static asset
local
tiny

This also keeps clinical product tone serious.

17.18 CSS Stability

Ensure:

widths reserved
skeleton dimensions match final content
badges don't cause large layout movement
evidence drawer doesn't resize page unpredictably
tables have stable columns

Target:

CLS effectively negligible


during demo.

17.19 Skeleton Strategy

Use skeleton only where requests may be visible.

For cached/preloaded Maria evidence:

content may appear immediately.

Don't show:

fake 3-second skeleton


to simulate intelligence.

17.20 API Hardening

At this stage endpoints should already be fast.

Profile:

JSON validation
repository indexing
serialization
response size


Repeatedly parsing all cache files on every request would be a bug.

Load/index once according to Phase 10.

17.21 Repository Initialization

Expected:

app startup
↓
validate/read manifest
↓
load/index snapshot
↓
ready


not:

every API call
↓
read entire JSON corpus from disk


Measure.

17.22 Selective Hash Validation

Security/integrity cannot disappear.

Recommended:

Build/CI

Full hash verification.

Startup

Manifest/version plus required integrity checks once.

Every request

Do not recompute SHA-256 across all artifacts.

This retains integrity without needless latency.

17.23 API Payload Minimization

Measure actual response sizes.

Targets should emerge from data.

Potential red flag:

GET patient → 2MB


indicates oversharing.

Patient response should remain summary-sized.

Timeline/evidence fetched separately.

17.24 Evidence Optimization

Evidence is the flagship interaction.

Pre-index:

gap_id → EvidenceBundle


and:

source_doc_id → record


Then:

View evidence


is direct map lookup.

No scanning all records.

17.25 Maria/Flagship Preload

On /demo:

preload:

real Maria patient route
timeline
gaps
flagship evidence
evaluation summary

but not necessarily every patient.

This allows the signature interaction to feel instantaneous.

17.26 Backup Flagship Preload

Also preload Phase-13 backup patient data.

If Maria temporarily fails UX regression:

demo can switch quickly.

Again, backup does not alter intelligence.

17.27 Next.js Route Prefetch

Use Next.js's native navigation/prefetch behavior appropriately.

Don't implement a bespoke global preload framework unless measurement shows it is needed.

Simple is more reliable.

17.28 Judge Mode Warm Path

When /demo loads:

Today visible
↓
Maria data prefetched
↓
evidence prefetched
↓
evaluation prefetched


By the time the presenter clicks, resources are warm.

17.29 No Background Live Extraction

Ensure demo route does not accidentally trigger a development recomputation job.

That risks:

API cost
provider outage
data drift
latency
benchmark inconsistency

Judge mode reads frozen data only.

17.30 Cold Start Profiling

Measure deployed:

first request after idle
warm request


Repeat enough times to understand variation.

Record:

minimum
median
p95 if sample supports it
maximum observed


Do not optimize one lucky warm request.

17.31 Cold Start Mitigation

Operationally:

Before judging:

open demo
hit readiness
load Today
open Maria once if acceptable
return to Step 1


That warms:

deployment
application
caches
browser assets

Create:

npm run demo:warm


if useful.

17.32 Warm Script

The warm script can request:

/api/v1/readiness
/api/v1/panels/demo
/api/v1/panels/demo/queue?k=5
Maria patient
Maria timeline
Maria gaps
Maria evidence
/api/v1/evaluation


It should not alter state.

17.33 Deployment Environment Freeze

Record deployed:

Node version
package lock hash
Next.js version
environment variables
cache version
Git commit
deployment identifier


This gives us exact judge-build provenance.

17.34 Production Environment Variables

P0 judge deployment should require as little configuration as possible:

CONTINUA_DEMO_MODE=true
ACTIVE_DEMO_CACHE_VERSION=...


Ideally no LLM key in production judge deployment at all.

If live developer functions are absent:

even safer.

17.35 Remove Unnecessary Secrets From Judge Deployment

If judge build doesn't use:

LLM provider
Supabase


don't configure those secrets.

Less risk, less confusion.

17.36 Deployment Health Check

After each deployment automatically check:

/health → 200
/readiness → ready
queue → 5
Maria reachable
flagship evidence → verified
evaluation available


If any fail:

deployment not candidate.

17.37 Deployment Smoke Script

Create:

npm run smoke:deployment -- <base-url>


Outputs:

Health PASS
Readiness PASS
Queue PASS
Flagship PASS
Evidence PASS
Evaluation PASS


No manual assumption.

17.38 Production Console Audit

Before release:

Open browser console.

Expected:

0 errors
0 failed important network requests
0 hydration warnings
0 React warnings


Any red line during the flagship flow gets investigated.

17.39 404/Asset Audit

Production network tab:

No missing:

logo
icon
font
CSS chunk
API path
source map dependency that affects runtime

A tiny broken favicon is not R0, but clean it before judging if trivial.

17.40 Local Fallback Build

Local backup should require:

npm ci
npm run build
npm run start


or a prepared already-tested build on demo machine.

No internet required for clinical intelligence.

17.41 Don't Depend on npm ci During Emergency

At judging time, local environment should already be prepared.

Fallback sequence should be:

open terminal
run predefined start command
open localhost URL


not:

reinstall dependencies on venue Wi-Fi

17.42 Local Startup Script

Example:

npm run demo:local


Should:

validate cache
start production build
print URL
optionally open browser if environment supports it

One command.

17.43 Pre-Built Local Artifact

Optionally keep:

repo clone
dependencies installed
production build created
cache validated

on presentation machine.

Then fallback is near-instant.

17.44 Recorded Backup

By Phase 17, have at least a rough backup video even if Phase 21 later replaces it.

Requirements:

same six-scene story
no private desktop data
crisp text
actual benchmark metrics
actual UI
1080p where possible
local file

Do not rely on streaming a cloud-hosted video.

17.45 Screenshot Backup

Maintain:

01-today.png
02-maria.png
03-gap.png
04-evidence.png
05-methodology.png
06-evaluation.png


Even if video playback fails, the pitch can continue.

17.46 Demo Reset Hardening

One command/action:

npm run demo:reset


should:

clear optional local action state
validate active cache
avoid changing intelligence
restore expected judge-mode route
report readiness

If no mutable state exists, reset may simply validate and prepare.

17.47 Demo Validation Command
npm run demo:check


Outputs:

Cache PASS
API PASS
Top-5 PASS
Maria PASS
Flagship evidence PASS
Evaluation PASS
Safety PASS
Fallback assets PASS


This gets run before judging.

17.48 Demo Manifest

Create:

{
  "release_candidate": "continua-demo-release-candidate-v1",
  "git_commit": "...",
  "cache_version": "...",
  "api_version": "v1",
  "flagship_patient_id": "...",
  "flagship_gap_id": "...",
  "actual_queue_rank": 0,
  "benchmark_run_id": "...",
  "fallback_video_sha256": "...",
  "validated_at": "..."
}


Machine-readable demo state.

17.49 Browser Environment

Freeze preferred setup:

current Chrome or Edge
browser zoom 100%, unless tested otherwise
bookmarks bar hidden
extensions minimized/disabled if risky
DevTools closed
notifications disabled
no personal tabs
local backup tab prepared but not visible

Professional basics.

17.50 Presentation Viewport

Primary target:

1440×900


or actual judging machine resolution.

Also validate:

1280×720


because video conferencing/screen sharing often feels closer to this.

Critical content must fit both.

17.51 Zoom Test

Test:

90%
100%
110%
125%


At minimum 100 and 110 should not break important layouts.

Judge might have browser accessibility settings.

17.52 Screen Share Optimization

Evidence quote needs to be readable through compression.

Avoid:

12px text
pale gray


Flagship evidence should be comfortably readable.

Use actual screen-share trial.

17.53 Cursor Path

This sounds trivial, but matters.

Rehearse where cursor rests before each step.

Don't leave it covering:

patient name
metric
source quote

and don't wildly hunt for buttons.

17.54 Animation Budget

During demo:

Transition animations:

~100–250 ms


where useful.

Avoid >500ms decorative sequences.

Evidence should feel responsive.

Respect reduced-motion preference.

17.55 Route Transition State

If a page does take >300ms:

show a small stable loading state.

No full-screen spinner.

Keep sidebar/header visible so product feels anchored.

17.56 Error-Free Preloading

Prefetch failure should not crash page.

If Maria evidence prefetch fails:

normal click fetch still attempts it and can surface a controlled error.

Preloading is performance optimization, not correctness dependency.

17.57 Race Condition Revalidation

Phase 16 tested this.

Phase 17 repeats after preloading/client optimizations because performance changes often reintroduce races.

Test:

patient switch
evidence switch
back navigation
demo step navigation

17.58 Memory After Preloading

Don't preload so aggressively that browser memory balloons.

80 patients is small, but record corpus can be larger.

Preload only critical demo assets.

17.59 Evaluation Page Hardening

Evaluation response is small.

Preload summary.

Only lazy-load deeper:

baselines
ablations
failure tables

if large.

The four headline proof metrics should appear immediately.

17.60 Methodology Page Hardening

No need for expensive diagram libraries/animations.

Use simple styled architecture.

Methodology must be available instantly during Q&A.

17.61 API Benchmark After Optimization

Re-run Phase 11 timings.

Compare:

Before Phase 17
After Phase 17
Delta


Ensure no route regressed substantially.

17.62 UI Benchmark After Optimization

Measure:

first load
navigation
evidence open
evaluation navigation
total scripted flow

Don't claim improvements without before/after.

17.63 Performance Regression Budget

Create CI thresholds with some headroom.

Example:

If queue normally takes 8ms server time:

Don't make CI fail at 10ms due to noisy environment.

Instead choose a reasonable coarse threshold.

Better CI gates:

response payload size
production build succeeds
page doesn't exceed gross bundle ceiling
no external service calls
demo E2E under generous timeout

Precise performance benchmarking runs separately.

17.64 Bundle Regression Gate

Record page bundle/reference sizes.

Fail or flag if there is a material increase, e.g.:

>20–25%


without intentional review.

Exact threshold should be frozen based on baseline.

17.65 Payload Regression Gate

Same idea:

If evidence response grows:

5×


because someone accidentally returns entire records corpus:

CI/test catches it.

17.66 No External Resource Gate

Official demo should not require third-party:

font CDN
stock image CDN
analytics script
external chart script

other than serving the deployed app itself.

If external resources are added, justify and test them.

17.67 Rehearsal Levels

Use four.

Level 1: Navigation rehearsal

No speaking.

Goal:

perfect interaction sequence.

Level 2: Script rehearsal

Speak with app.

Goal:

timing.

Level 3: Failure rehearsal

Introduce broken hosted demo, switch fallback.

Level 4: Judge simulation

People interrupt/questions included.

Phase 21 expands storytelling, but Phase 17 hardens the mechanics.

17.68 Rehearsal Count

Before Phase 17 exit:

Automated

At least:

50 consecutive E2E runs


from Phase 16/17.

Human

At least:

10 full live rehearsals


with no technical failure.

Failure-mode drills

At least:

3 hosted/local/video switchovers


successful.

17.69 Demo Success Definition

A rehearsal counts as successful only if:

correct release candidate
correct queue
flagship loads
evidence opens
evaluation loads
no console/runtime error
no presenter workaround
under hard time limit

Don't count a run where you secretly refreshed broken state.

17.70 Rehearsal Results

Store:

date
build
environment
demo duration
technical failures
speaker mistakes if relevant
fallback used?
notes


We mainly care about technical failures here.

17.71 Consecutive Success Gate

Require:

20 consecutive human/automated flagship runs with zero technical failure at minimum before release.

I would aim for:

50 automated
10 human


and ensure the final 10 human runs are clean.

17.72 Performance Failure Taxonomy

Freeze:

PERF-001

Cold start too slow.

PERF-002

Route exceeds budget.

PERF-003

UI navigation jank.

PERF-004

Evidence drawer delay.

PERF-005

Bundle regression.

PERF-006

Payload regression.

PERF-007

Layout shift.

PERF-008

Screen-share readability.

PERF-009

Deployment startup inconsistency.

PERF-010

Preload race/regression.

PERF-011

Fallback startup too slow.

PERF-012

Demo exceeds time.

17.73 Demo Blockers

R0/R1 for this phase:

flagship page fails
evidence unavailable
benchmark values wrong
stale cache
hosted and local disagree
local fallback doesn't start
demo exceeds judging limit repeatedly
runtime error during critical sequence
offline AI dependency appears
unsupported benchmark number appears

Must be zero.

17.74 Red-Team

Attack the hardened demo.

Attack A

Deploy cold and start immediately.

Attack B

Throttle network.

Attack C

Kill LLM credentials.

No effect.

Attack D

Remove Supabase.

No effect.

Attack E

Hard refresh on Patient page.

Must work.

Attack F

Open demo in a clean incognito session.

Must work.

Attack G

Screen share at 1280×720.

Must remain legible.

Attack H

Press Back midway.

Must remain coherent.

Attack I

Rapidly click Next twice.

No incorrect demo state.

Attack J

Hosted URL unavailable.

Switch local immediately.

Attack K

Local process unavailable.

Open video.

Attack L

Evaluation route fails.

Have backup screenshot/video and do not fabricate metrics.

17.75 Performance/Release Files

Expected:

lib/performance/
├── budgets.ts
├── timings.ts
├── preload.ts
└── report.ts

lib/demo/
├── warm.ts
├── check.ts
├── reset.ts
└── manifest.ts

scripts/
├── profile-demo.ts
├── benchmark-api.ts
├── benchmark-pages.ts
├── demo-warm.ts
├── demo-check.ts
├── demo-local.ts
├── demo-reset.ts
├── deployment-smoke.ts
└── rehearsal-record.ts

tests/performance/
├── payload-size.test.ts
├── bundle-budget.test.ts
├── preload.test.ts
├── production-smoke.test.ts
└── demo-timing.test.ts

docs/release/
├── performance-budget.md
├── deployment-profile.md
├── judge-machine-checklist.md
├── demo-startup.md
├── fallback-procedure.md
├── rehearsal-protocol.md
└── performance-report.md

artifacts/performance/
├── baseline.json
├── optimized.json
├── comparison.json
├── deployment-smoke.json
└── rehearsal-results.json

artifacts/demo/
├── release-manifest.json
├── fallback-video.mp4
└── screenshots/

17.76 Execution Order

Follow exactly:

17.0 Verify Phase-16 reliability gate
       ↓
17.1 Capture baseline performance
       ↓
17.2 Freeze performance budgets
       ↓
17.3 Profile judge critical path
       ↓
17.4 Audit Next.js client/server boundaries
       ↓
17.5 Audit bundle/dependencies
       ↓
17.6 Optimize repository/cache initialization
       ↓
17.7 Optimize API payloads
       ↓
17.8 Optimize Today screen
       ↓
17.9 Optimize patient workspace
       ↓
17.10 Optimize evidence drawer
       ↓
17.11 Optimize evaluation view
       ↓
17.12 Implement flagship preloading
       ↓
17.13 Re-run race-condition suite
       ↓
17.14 Optimize static assets/fonts/icons
       ↓
17.15 Create production deployment profile
       ↓
17.16 Deploy release candidate
       ↓
17.17 Measure cold/warm behavior
       ↓
17.18 Implement demo warm/check/reset commands
       ↓
17.19 Harden local fallback
       ↓
17.20 Create fallback recording
       ↓
17.21 Capture screenshot fallback
       ↓
17.22 Test screen-share environment
       ↓
17.23 Run browser/viewport matrix
       ↓
17.24 Run production smoke tests
       ↓
17.25 Run automated repeated E2E
       ↓
17.26 Run human rehearsals
       ↓
17.27 Run fallback drills
       ↓
17.28 Performance red-team
       ↓
17.29 Resolve demo blockers
       ↓
17.30 Generate release/performance report
       ↓
17.31 Freeze demo release candidate v1

17.77 Quantitative Gates
Requirement	GateP0 live LLM calls	0
P0 external DB calls	0
Runtime errors flagship path	0
Console errors flagship path	0
Benchmark mismatches	0
Cache validation failures	0
Warm critical navigation	<300 ms target perceived
Evidence after preload	<150 ms target
API P0 routes	within frozen performance budgets
LCP	<2.5 s target
CLS	<0.1 target
INP	<200 ms target
Automated consecutive E2E	≥50 clean target
Human rehearsals	≥10
Final consecutive human technical failures	0
Hosted→local drills	≥3 successful
Local→video availability	100%
Rehearsed demo	80–85 sec target; ≤90 sec hard gate

For web-performance metrics, treat them as optimization targets. The no-error, no-data-mismatch, and demo-time requirements are the hard gates.

17.78 Acceptance Gates
Gate A: Speed

The primary workflow feels immediate on the actual presentation environment.

PASS / FAIL

Gate B: Cold start

Cold-start behavior is measured and operationally mitigated.

PASS / FAIL

Gate C: Truth integrity

No performance optimization alters intelligence, evidence, priority, or benchmark data.

PASS / FAIL

Gate D: Dependency independence

Judge path remains independent of model and optional database services.

PASS / FAIL

Gate E: Deployment

Hosted production build passes smoke test.

PASS / FAIL

Gate F: Local redundancy

Identical benchmark-qualified experience works locally.

PASS / FAIL

Gate G: Recorded redundancy

A current release-matched backup video exists locally.

PASS / FAIL

Gate H: Presentation

Flagship UI remains readable through real screen sharing.

PASS / FAIL

Gate I: Repetition

Repeated E2E/judge runs have zero release-blocking failures.

PASS / FAIL

Gate J: Timing

Live story repeatedly completes within judging budget.

PASS / FAIL

All ten must pass.

17.79 Exit Report

Populate from real measurements:

CONTINUA PERFORMANCE & DEMO HARDENING

Release candidate:
continua-demo-release-candidate-v1

Git commit:
<sha>


WEB / UI

LCP:                           — ms
CLS:                           —
INP:                           — ms

Warm Today navigation:         — ms
Patient transition:            — ms
Evidence open:                 — ms
Evaluation transition:         — ms


API

Panel p50/p95:                 — / — ms
Queue p50/p95:                 — / — ms
Patient p50/p95:               — / — ms
Evidence p50/p95:              — / — ms


STARTUP

Local cold startup:            — ms
Hosted cold observed median:   — ms
Hosted cold max observed:      — ms
Warm readiness:                — ms


DEPENDENCIES

LLM required:                  NO
External DB required:          NO
External healthcare API:       NO


REHEARSALS

Automated E2E:                 XX/XX
Human full rehearsals:         XX
Human technical failures:       0

Median demo time:              — sec
Worst accepted time:           — sec


FALLBACK

Hosted build:                  PASS
Local build:                   PASS
Recorded demo:                 PASS
Screenshots:                   PASS

Hosted→local drills:           X/X

Console errors:                 0
Benchmark mismatches:            0
Safety regressions:              0

FINAL:
PASS / FAIL

17.80 Failure Conditions

Do not move forward if:

optimization changed any benchmark-qualified output;
Maria's displayed rank differs from API;
browser sometimes shows stale patient/evidence data;
cold hosted app unpredictably takes most of the demo window;
live LLM is accidentally invoked;
fallback build hasn't actually been tested;
fallback video shows an older metric/ranking;
benchmark data in video differs from current release;
evidence is unreadable during screen share;
console errors appear in flagship workflow;
repeated rehearsals still depend on refreshing/retrying;
typical run exceeds 90 seconds.
17.81 Handoff to Phase 18

At Phase 17 completion, we should have a system that is:

Correct
+
Safe
+
Reliable
+
Fast
+
Reproducible
+
Demo-resilient


Only now is it worth doing final visual polish.

Phase 18 receives:

frozen release candidate
actual supported viewports
stable benchmark numbers
frozen copy
canonical screenshots
performance budgets
reliable demo path

and focuses on:

Phase 18 — Product Polish & Visual Identity

That phase can safely improve:

visual hierarchy
spacing
typography
brand treatment
states
timeline styling
evidence presentation
queue polish
screenshot quality

without destabilizing product logic.

Phase 17 Definition of Done

Phase 17 is complete when we can walk into judging with:

Hosted URL
+
Local production build
+
Validated frozen cache
+
Current recorded demo
+
Canonical screenshots
+
One-command health check
+
One-command reset


and perform the flagship flow repeatedly with:

zero LLM waits, zero dependency surprises, zero data mismatches, zero runtime errors, and no need to improvise technical recovery.

The demo should now feel boring operationally.

That is exactly what we want.

CONTINUA PHASE 17: DEMO RELEASE CANDIDATE v1 FROZEN

Next: Phase 18 — Product Polish & Visual Identity.
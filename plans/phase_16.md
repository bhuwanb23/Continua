Continua Phase 16: Reliability & Failure Testing

Phase 15 established what Continua is allowed to do and how it must fail safely. Phase 16 now tries to break the entire system.

This is broader than testing whether the happy path works.

Phase 16 mission: Validate Continua across normal, adversarial, corrupted, degraded, boundary, and dependency-failure conditions so that every important failure is either recovered from safely or converted into an explicit, truthful failure state.

The principle is:

Correct input
→ Correct result

Bad input
→ Controlled rejection

Missing dependency
→ Graceful degradation

Corrupted trust state
→ Fail closed

Unexpected exception
→ No unsafe output

Official demo failure
→ Valid fallback

16.0 Phase North Star

We want to prove:

Continua is predictable when things go wrong.

The complete system under test:

Synthetic Records
        ↓
Extraction
        ↓
ClinicalEvent Validation
        ↓
Normalization / Reconciliation
        ↓
Gap Detection
        ↓
Evidence Verification
        ↓
Intervention Priority
        ↓
Demo Cache
        ↓
API
        ↓
Coordinator UX


Every boundary needs failure tests.

16.1 Inputs

Phase 16 receives frozen:

continua-synth-v1
continua-eval-v1
extractor-v1
clinical-event-v1
normalization-v1
gaps-v1
evidence-v1
priority-v1
continua-benchmark-v1
continua-demo-cache-v1
continua-api-v1
Coordinator UX v1
Oncology Flagship Experience v1
continua-safety-v1
Phase-15 safety cases
acceptance tests from all previous phases
16.2 Outputs

Phase 16 produces:

continua-reliability-v1

including:

system failure taxonomy
reliability test matrix
happy-path regression suite
boundary-condition suite
dependency-failure suite
corruption suite
partial-processing suite
API resiliency tests
UX degraded-state tests
cache-recovery tests
concurrency/idempotency tests
determinism tests
fault-injection system
soak/repeat-run suite
browser reliability suite
recovery runbook
reliability scorecard
blocker register
16.3 Non-Goals

Phase 16 does not:

add new care-gap types;
improve weak benchmark results by changing labels;
redesign product workflow;
introduce production distributed infrastructure;
implement multi-region failover;
claim hospital-grade availability;
claim HIPAA compliance;
create Kubernetes/Redis/Kafka for resilience theater;
hide failure using cached fake output.

Reliability must fit the actual hackathon architecture.

16.4 Reliability Definition

For this project:

Reliability = correct outcomes when possible, explicit safe degradation otherwise, and no silent corruption.

A failed request with a clear message is preferable to:

HTTP 200
+
wrong patient evidence


The latter is catastrophic even if "uptime" looks better.

16.5 Failure Priority Hierarchy

When tradeoffs exist:

1. Trust / Safety
2. Data Integrity
3. Correctness
4. Determinism
5. Availability
6. Performance
7. Visual polish


Example:

If evidence integrity cannot be guaranteed:

suppress gap


even if that reduces availability.

Never show unsupported clinical-like content to keep a screen populated.

16.6 Phase Structure
Subphase	Workstream	Result16.0	Reliability constitution	Rules frozen
16.1	Failure taxonomy	Unified errors
16.2	Critical-path map	Failure boundaries
16.3	Regression baseline	Happy path frozen
16.4	Input boundaries	Bad input tested
16.5	Extraction failures	AI/provider degradation
16.6	Event-store failures	Invalid events
16.7	Detector failures	Rules stressed
16.8	Evidence failures	Trust fail-closed
16.9	Priority failures	Ranking integrity
16.10	Cache corruption	Snapshot integrity
16.11	Repository failures	Persistence degradation
16.12	API failures	Stable error behavior
16.13	UX degraded states	Honest user experience
16.14	Dependency failures	External outages
16.15	Concurrency/idempotency	Repeat behavior
16.16	Determinism	Stable outputs
16.17	Performance degradation	Slow paths
16.18	Soak testing	Repeat stability
16.19	Browser/network	Client resilience
16.20	Demo recovery	Judging continuity
16.21	Fault injection	Automated breakage
16.22	Red-team	Unknown failure search
16.23	Reliability report	Results packaged
16.24	Release gate	continua-reliability-v1
16.7 Unified Failure Taxonomy

Use four high-level outcomes.

RECOVERED
DEGRADED
FAILED_SAFE
UNSAFE_FAILURE

RECOVERED

Transient failure handled transparently.

Example:

LLM request returns 429
→ retry succeeds

DEGRADED

System remains usable with reduced capability.

Example:

one patient extraction fails
→ patient = PARTIAL
→ rest of panel succeeds

FAILED_SAFE

Feature unavailable but no incorrect output.

Example:

cache hash mismatch
→ readiness 503

UNSAFE_FAILURE

Incorrect/untrusted output reaches user.

Example:

wrong-patient evidence displayed


Any UNSAFE_FAILURE is release blocking.

16.8 Severity Levels

Fuse reliability severity with Phase-15 safety severity.

R0 / BLOCKER

Can cause:

wrong-patient output
ungrounded gap
ground-truth leakage
silent corruption
real PHI exposure
autonomous clinical action
invalid benchmark claim

Release prohibited.

R1 / HIGH

Causes materially wrong workflow output:

incorrect queue ordering
stale VerifiedGap
incorrect due date
incomplete patient presented as complete

Release prohibited until resolved.

R2 / MEDIUM

Feature unavailable or degraded without unsafe data.

Example:

evaluation screen unavailable
filter malfunction
P1 action state lost

May be accepted with documented workaround.

R3 / LOW

Cosmetic/non-critical.

Example:

minor animation failure
secondary label wrap

Doesn't block unless it damages demo.

16.9 Critical-Path Map

Define the official P0 critical path:

App boot
    ↓
Cache initialization
    ↓
Readiness
    ↓
Today queue
    ↓
Patient workspace
    ↓
Timeline
    ↓
Verified gap
    ↓
Evidence
    ↓
Evaluation


Every stage requires independent failure injection.

16.10 Reliability Service-Level Objectives

We are not claiming production SLAs.

Use release criteria instead.

Critical demo path should achieve:

20 consecutive successful runs minimum


from Phase 17 master plan.

Phase 16 should prepare for a tougher internal target:

50 repeated automated E2E runs with zero R0/R1 failure.

If time permits, 100 is better.

16.11 Happy-Path Regression Baseline

Before injecting failures, freeze a golden run.

It must verify:

80 patients
exact queue ordering
actual Maria rank
Maria timeline
real verified gaps
evidence bundle
evaluation metrics
claim classifications
methodology
synthetic banner

Generate:

golden-regression.json


derived from official cache/API outputs.

Not manually typed.

16.12 Golden Snapshot Philosophy

Use snapshots carefully.

Good snapshot:

API DTO of queue
IDs/rank/scores


Bad snapshot:

entire HTML page


and blindly approving huge changes.

Semantic assertions matter more.

16.13 Dataset Input Failures

Test corrupted synthetic records.

DATA-01 Missing patient ID

Reject document.

DATA-02 Unknown provider

Accept safely as unknown where schema permits.

DATA-03 Invalid date

Reject affected event/document according to stage.

DATA-04 Duplicate document ID

Data validator fails.

DATA-05 Unsupported document type

Graceful handling.

DATA-06 Empty text

No fabricated events.

DATA-07 Extremely long record

Chunk safely or reject with controlled error.

DATA-08 Invalid encoding

Controlled failure.

DATA-09 synthetic=false

Public demo rejects dataset.

DATA-10 Wrong dataset version

Reject incompatible snapshot.

16.14 Missing Records

For patient with incomplete records:

Pipeline should represent:

PARTIAL


where appropriate.

Do not claim:

full review complete


UX copy:

Some available records could not be processed; results may be incomplete.

16.15 Extraction Dependency Failures

Even though judge demo is cached, live extraction must fail cleanly.

Inject:

401 invalid key
403 denied
429 rate limit
408 timeout
500 provider error
502
503
network disconnect
malformed JSON
empty response
truncated response
schema-invalid output

16.16 Retry Matrix

Freeze exactly which failures are retryable.

Failure	Retry429	Yes
timeout	Yes
transient 5xx	Yes
invalid JSON	bounded retry
invalid API key	No
provenance failure	No
patient ownership failure	No
unsupported schema field	generally no/validation path
missing document	No

Retries must be bounded.

Existing intended behavior:

initial attempt + max 2 retries


= 3 attempts maximum.

16.17 Retry Backoff

For external calls:

exponential backoff
+ bounded jitter if desired


But tests need deterministic clock/scheduler where possible.

Don't let retry tests actually wait 30 seconds.

Inject fake timers.

16.18 Retry Safety

Never retry a semantically failed request by loosening the prompt or schema.

Bad:

Attempt 1 provenance failed
→ attempt 2 "just guess the answer"


No.

Retries are transport/format recovery.

Trust constraints remain identical.

16.19 Partial Patient Processing

Suppose:

7 documents
6 succeed
1 fails


Output:

patient_processing_status = PARTIAL


Events from successful records may exist.

But downstream absence-based gaps become dangerous because a missing document might contain the absent event.

Critical recommendation

If a patient isn't fully processed:

Suppress absence-derived gaps unless completeness requirements are explicitly satisfied.

That includes:

missed follow-up
medication monitoring

This should be an R0/R1 reliability invariant.

16.20 Why Partial Data Matters

Positive fact:

CBC appears in a successfully processed document.

Fine.

Absence claim:

No oncology consult exists.

Not safe when one document failed processing.

Phase 16 should explicitly test this distinction.

16.21 Completeness Gate

Introduce or enforce:

PatientAnalysisCompleteness:
COMPLETE
PARTIAL
FAILED


Absence-based detectors/evidence verification require:

COMPLETE


for benchmark/demo pathways.

If not:

SUPPRESS absence-based candidate


This is an important hardening improvement.

16.22 ClinicalEvent Failure Tests

Inject:

wrong payload discriminator
missing source doc
wrong patient source
invalid confidence
impossible date
unsupported specialty
malformed normalized field
historical mention treated as occurrence
copied occurrence duplicated

Expected:

controlled rejection.

Never downstream silent acceptance.

16.23 Normalization Failures

Test:

known alias
unknown alias
upper/lower case
whitespace
punctuation
partial match
lookalike term


Unknown alias must not silently map to nearest-looking canonical concept unless explicitly supported.

16.24 Reconciliation Failures

Critical duplicate-test risks:

REC-01

One lab copied into two notes.

Must remain one occurrence.

REC-02

Two genuinely distinct CBCs mistakenly merged.

Must remain distinct.

REC-03

Historical mention becomes current occurrence.

Prevent.

REC-04

Same-day separate events ambiguous.

Handle according to frozen conservative policy.

16.25 Detector Failure Tests

For each deterministic rule test:

zero events
one event
many events
shuffled order
same-date events
boundary day
due date exactly
due date +1
invalid/stale context
unsupported policy

No crashes.

16.26 Follow-Up Boundary Tests

Example:

referral_date = 2026-04-18
window = 45 days


Test:

consult on due date        → resolved
consult one day before     → resolved
consult one day after      → behavior frozen/documented
no consult on due date     → state exact
no consult day after       → overdue


Off-by-one bugs are common.

16.27 Duplicate Window Boundaries

Given:

duplicate window = 14 days


test:

13 days
14 days
15 days


Expected behavior frozen.

Also:

date order reversed
identical date
month boundary
16.28 Monitoring Boundaries

Test:

monitoring on deadline
monitoring one day before
monitoring one day after
start + stop same day
stop before deadline
wrong monitoring target
target alias


No ambiguous behavior.

16.29 Evidence Failure Injection

This is R0 territory.

Inject:

EVID-01 Missing source

Suppress.

EVID-02 Wrong patient

Suppress.

EVID-03 Span altered

Suppress.

EVID-04 Fuzzy score below threshold

Suppress.

EVID-05 Policy missing

Suppress.

EVID-06 Event store changed

Suppress/stale.

EVID-07 Absence contradicted

Suppress.

EVID-08 Wrong evaluation date

Reject version/state.

No exceptions.

16.30 Stale Artifact Testing

Create deliberate combinations:

gaps-v1 + evidence-v2
priority-v1 + gaps-v2
cache built on older extractor version
wrong dataset hash
wrong evaluation date


Expected:

version incompatibility


not silent load.

16.31 Priority Failure Tests

Inject:

zero gaps
one gap
100 low gaps
tied patients
changed demographic attributes
stale gap set
negative raw score bug
NaN
Infinity
unknown severity
secondary bonus overflow

Output must be valid or fail controlled.

16.32 Priority Numerical Safety

Explicit validation:

Number.isFinite()
score >= 0
score <= 100


No:

NaN
Infinity
-1
101


can reach API.

16.33 Stable Tie Testing

Create 10 identical-priority patients.

Run ranking:

100 times


Expected identical order under deterministic tie-break.

This eliminates subtle nondeterminism.

16.34 Cache Reliability

Attack official snapshot.

CACHE-01 file missing

→ INVALID

CACHE-02 invalid JSON

→ INVALID

CACHE-03 bad hash

→ INVALID

CACHE-04 stale version

→ INVALID

CACHE-05 dangling patient

→ INVALID

CACHE-06 dangling evidence

→ INVALID

CACHE-07 manually changed queue

→ INVALID

CACHE-08 benchmark mismatch

→ INVALID

CACHE-09 unverified candidate injected

→ INVALID

CACHE-10 claim type missing

→ INVALID

16.35 Cache Atomicity

Cache builder must not leave:

half-written official release


Recommended:

build into temporary location
↓
validate all artifacts
↓
publish/swap as complete cache


In repository artifact terms, generate all outputs before replacing official manifest.

16.36 Cache Recovery

If official cache fails validation:

Do not attempt to rebuild from live LLM automatically.

Instead:

readiness = unavailable


and use:

previous known-good snapshot, if explicitly designed/versioned;
or demo fallback.

Automatic recomputation would break reproducibility.

16.37 Previous Known-Good Snapshot

Optional but useful:

continua-demo-cache-v1
continua-demo-cache-v1-prev


But avoid ambiguity.

Better:

keep immutable release versions and select one explicitly.

Example:

ACTIVE_DEMO_CACHE_VERSION


No silent fallback unless clearly logged/displayed.

16.38 Repository Failures

Simulate:

initialization failure
malformed index
nonexistent entity
duplicate key
unexpected repository exception

Service layer maps these correctly.

No raw filesystem exceptions in client.

16.39 API Failure Testing

Every P0 endpoint gets:

Valid
Bad input
Not found
Invalid state

409/500 depending frozen semantics.

Not ready
Internal failure

structured 500.

No route should return:

200 with partial malformed content


after integrity failure.

16.40 API Property Fuzzing

Generate malformed query values:

limit = ""
limit = -1
limit = NaN
limit = huge
k = null
gap_type = "cancer"
priority_band = "<script>"
patientId = long garbage


All should remain controlled.

16.41 Payload Size Testing

Evidence/document routes must not accidentally return massive corpus.

Set regression checks for response sizes.

Example:

queue response < reasonable threshold
patient detail < threshold
evidence excerpt bounded


Exact thresholds should be measured from actual cache, then set with headroom.

16.42 UX Failure States

Every P0 screen needs explicit behavior for:

loading
empty
not found
API failure
cache unavailable
partial analysis
evaluation not run


No white screen.

No endless spinner.

16.43 Infinite Loading Guard

Any asynchronous UI path should eventually become:

success
error


The frontend should not remain:

Loading...


forever if request fails.

Use request error handling/timeouts appropriately.

16.44 Stale Browser State

Test:

open patient
deploy new cache/API
return to old tab
navigate

The client should not mix incompatible versions unnoticed.

At minimum, reload/fetch new API state safely.

Because HTTP caching is conservative, this is manageable.

16.45 Evidence Drawer Failure

If evidence request fails:

Do not leave a gap looking "verified" with empty drawer and no explanation.

UI:

Evidence couldn't be loaded. Try again.

The underlying gap still came from validated cache, but the user cannot inspect it at the moment.

For official demo, this is still a usability failure requiring correction.

16.46 Dependency Failure Matrix

Official read path:

Dependency	Failure	P0 experienceLLM provider	Down	Works
Supabase	Down	Works
Healthcare API	Down	Not used
Internet to Vercel	Down	Local fallback
Vercel	Down	Local/video fallback
GitHub	Down	No runtime impact
Browser storage	unavailable	Read path works

This is a strong architecture result.

16.47 LLM Outage Test

Set model client:

throw Error on every call


Run official P0 E2E.

Expected:

PASS


Hard gate.

16.48 Database Outage Test

Unset all Supabase environment variables.

Run P0 E2E.

Expected:

PASS


If P1 action state fails:

it should degrade gracefully without affecting intelligence reads.

16.49 Hosted Network Failure

Test:

offline browser after app has/hasn't loaded
throttled network
high latency
dropped API request

We don't need full PWA offline support.

Goal:

no corrupt state
fallback path rehearsed.
16.50 Concurrency Tests

Even cached reads need basic concurrency confidence.

Simulate:

10
25
50


concurrent queue/patient/evidence requests.

Measure errors/latency.

This isn't capacity planning for a hospital.

It simply catches shared mutable-state bugs.

16.51 Read Immutability

Parallel GET requests must not mutate shared cached objects.

Defensive behavior:

freeze domain snapshots where useful
clone mutable responses if required
avoid sorting shared arrays in place

Classic bug:

queue.sort(...)


mutates cached shared queue.

Test it.

16.52 Idempotency

GET requests:

same request + same cache version → semantically same response, except request metadata like:

request_id


and perhaps timestamps.

P1 actions need separate semantics.

16.53 P1 Action Reliability

If action endpoint ships:

Test duplicate submissions.

Example:

contacted
contacted


Should not create confusing duplicate workflow records.

Use idempotent current-state semantics where reasonable.

16.54 Action Failure Must Not Affect Intelligence

If action persistence fails:

VerifiedGap remains
evidence remains
priority remains
benchmark remains

UI says:

Couldn't save workflow status.

No corruption.

16.55 Determinism Test

Run deterministic stack:

clinical events
→ gaps
→ evidence
→ priority


repeatedly.

Target:

100 runs
0 semantic differences


This is cheap because no LLM.

16.56 Extraction Reproducibility

Live LLM extraction may vary.

That's expected.

Test instead:

Fixture extractor

100% deterministic.

Frozen extraction cache

100% deterministic.

Live model

measure variance only if useful, but don't make byte-identical output a gate.

16.57 Soak Test

Run official cached demo sequence repeatedly for perhaps:

30–60 minutes


or hundreds of automated iterations.

Watch:

memory growth
unhandled promise rejections
cache mutation
failed requests
timing degradation

A lightweight soak is enough.

16.58 Memory Leak Check

With Next.js/Node process locally:

Observe memory across repeated:

queue
patient
evidence
evaluation


requests.

No need for deep profiler unless memory grows consistently.

16.59 Browser Soak

Automate:

Today
→ patient
→ evidence
→ close
→ All Patients
→ Today


perhaps 50–100 cycles.

Check:

drawer state
focus
URL
duplicate listeners
console errors
16.60 Console Error Gate

Official judge workflow:

0 uncaught exceptions
0 unhandled promise rejections
0 React key warnings
0 hydration errors


Warnings from known third-party internals should still be reviewed.

16.61 Browser Matrix

At minimum:

current Chrome
current Edge

Smoke:

Firefox
Safari if environment/device available

P0 functional path must not depend on a browser-specific API.

16.62 Viewport Matrix

Test:

1440×900
1280×720
1024×768
768×1024
390×844
320×568


The product remains functional.

Only the presentation-optimized demo may be designed primarily for laptop.

16.63 Screen Share Reliability

Run over:

Teams/Meet/Zoom-like compression if available
browser zoom 90/100/110%
lower resolution

Ensure evidence text stays readable.

This is operational reliability for a hackathon.

16.64 Performance Degradation

Artificially add:

100ms
500ms
1500ms


API latency.

Check:

loading state appears
no duplicate requests
user cannot cause race-condition corruption
drawers don't open with wrong patient's data
16.65 Race Condition: Rapid Patient Switching

Test:

Open Maria
immediately open Patient B
Maria request resolves late


UI must show Patient B.

Never stale Maria data.

Use aborting/request identity/state strategy.

This is a real UI reliability bug class.

16.66 Race Condition: Evidence Switching

Same:

Gap A evidence requested
Gap B clicked quickly
A resolves after B


Drawer must show Gap B.

Test.

16.67 Back/Forward Navigation

Browser back/forward should not:

show stale wrong patient
leave drawer attached to wrong URL/state
lose safety banner
crash demo flow
16.68 Fault Injection Framework

Don't manually edit dozens of files every time.

Build small injectors/stubs.

Possible flags in test only:

FAIL_LLM
FAIL_REPOSITORY
CORRUPT_CACHE_HASH
DROP_SOURCE_DOC
ALTER_SOURCE_SPAN
DELAY_API
FAIL_EVIDENCE_API
STALE_PRIORITY_VERSION


Never enable production fault flags publicly.

16.69 Fault Injection API Safety

Test-only dependency injection is better than public URL:

?failCache=true


Do not ship easy production failure toggles.

16.70 Chaos Testing Scope

Do not install a full chaos-engineering platform.

Simple controlled fault injection gives all needed value.

No Chaos Monkey-style infrastructure needed.

16.71 Recovery Time Measurement

For recoverable service failures:

Measure:

time from failure
→ application back to ready


Examples:

restart app
select known-good snapshot
retry transient model error in dev

Not a formal RTO claim, just operational data.

16.72 Demo Recovery Drill

Practice these.

Drill A: Hosted app fails before demo

Switch local in <10–15 seconds.

Drill B: Hosted app fails mid-demo

Switch recorded fallback or local based on context.

Drill C: Maria route fails

Backup flagship patient available.

Drill D: Evaluation page fails

Have canonical screenshot/backup artifact.

Drill E: screen-sharing browser crashes

Recorded video immediately available.

16.73 Demo Recovery Rule

Don't debug live.

After one retry at most:

switch fallback.

This is presentation reliability.

16.74 Data Backup

Because all important artifacts are synthetic and version-controlled:

Backup:

repo
frozen dataset
benchmark
demo cache
presentation/video

Have local copy.

Don't rely entirely on GitHub/Vercel at judging time.

16.75 Build Failure Tests

Fresh environment:

npm ci
npm run validate
npm run build
npm run start


must succeed.

Phase 19 handles full documentation/reproducibility, but Phase 16 catches failures now.

16.76 Clean Environment

Use:

fresh container
fresh local clone
clean temporary directory

No hidden:

global package
stale .next
uncommitted cache
secret local file

should be necessary.

16.77 Reliability Metrics

Core:

Critical-path success rate
R0 failures
R1 failures
R2 failures
Deterministic repeat differences
Cache-corruption detection
Dependency-outage survival
API contract success
Browser E2E success
Recovery drill success

16.78 Don't Claim "99.99% Uptime"

We do not have production operational history.

Our metric is:

automated/rehearsal reliability of the prototype.

Example:

"50/50 cached critical-path runs completed without failure."

That's valid.

16.79 P0 Reliability Gates

Hard targets:

Metric	GateR0 unresolved	0
R1 unresolved	0
Wrong-patient outputs	0
Ungrounded displayed gaps	0
Partial patient labeled complete	0
Cache corruption silently served	0
Deterministic semantic differences	0
P0 read dependence on LLM	0
P0 read dependence on DB	0
Unhandled official-flow exceptions	0
Console errors in flagship path	0
Critical E2E consecutive passes	50 target
Deterministic core repeated runs	100/100 target
Fault-injection cases handled	100% expected states
Demo fallback paths	3/3 operational
16.80 Failure Budget

For pre-release:

R0/R1

Budget:

0

R2

May ship only if:

documented
no critical path impact
workaround exists
explicitly accepted
R3

Can remain if cosmetic and non-demo-blocking.

16.81 Reliability Test Matrix

Create one master matrix.

Columns:

ID
Layer
Scenario
Severity
Injection
Expected behavior
Observed behavior
Status
Regression test
Owner


No oral-only bugs.

16.82 Example Matrix Rows
ID	Layer	Failure	ExpectedREL-001	LLM	429	bounded retry
REL-002	Evidence	wrong patient	suppress
REL-003	Cache	bad SHA	invalidate
REL-004	API	bad ID	404
REL-005	UI	evidence 500	error state
REL-006	Priority	NaN factor	reject
REL-007	Demo	Vercel down	local fallback
REL-008	Patient	partial extraction	no absence gap
16.83 Reliability Report

At completion generate:

continua-reliability-report.json
continua-reliability-report.md


Include:

run metadata
environment
scenarios
pass/fail
unresolved risks
performance
recovery drill results
accepted R2/R3 issues
16.84 Reliability Red-Team

Independent mindset.

Ask:

Can I create a false alert by deleting one document?

It should become incomplete/suppress unsafe absence reasoning.

Can I modify queue.json manually?

Cache validation catches it.

Can I make UI show Maria evidence under another patient?

Ownership/route tests block it.

Can I crash ranking with NaN?

Validation blocks it.

Can I make a late API response overwrite current patient?

UI race tests block it.

Can I make benchmark numbers disappear?

Evaluation should show unavailable, not fabricated.

Can I shut off LLM?

Judge path works.

Can I shut off Supabase?

Judge path works.

Can Vercel fail?

Fallback works.

Can I inject instructions into a record?

Extraction authority unchanged.

16.85 Files

Expected:

lib/reliability/
├── types.ts
├── severity.ts
├── fault-injection.ts
├── completeness.ts
├── retries.ts
├── recovery.ts
├── assertions.ts
└── version.ts

tests/reliability/
├── happy-path.test.ts
├── dataset-failures.test.ts
├── extraction-failures.test.ts
├── partial-patient.test.ts
├── event-store.test.ts
├── detectors.test.ts
├── evidence.test.ts
├── priority.test.ts
├── cache.test.ts
├── repository.test.ts
├── api.test.ts
├── dependency-outage.test.ts
├── determinism.test.ts
├── concurrency.test.ts
├── race-condition.test.ts
├── browser.test.ts
├── soak.test.ts
└── recovery.test.ts

tests/e2e/
├── coordinator-flow.spec.ts
├── maria-demo.spec.ts
├── offline-demo.spec.ts
├── degraded-states.spec.ts
└── fallback.spec.ts

scripts/
├── reliability-test.ts
├── reliability-soak.ts
├── reliability-faults.ts
├── reliability-demo-drill.ts
└── generate-reliability-report.ts

docs/reliability/
├── reliability-constitution.md
├── failure-taxonomy.md
├── reliability-matrix.md
├── retry-policy.md
├── partial-data-policy.md
├── recovery-runbook.md
├── demo-recovery.md
└── known-failures.md

artifacts/reliability/
├── report.json
├── report.md
├── fault-results.json
├── soak-results.json
├── browser-results.json
└── recovery-results.json

16.86 Execution Order

Follow this sequence:

16.0 Verify Phase-15 safety gate
       ↓
16.1 Freeze reliability constitution
       ↓
16.2 Freeze failure taxonomy/severity
       ↓
16.3 Map critical system path
       ↓
16.4 Capture golden regression baseline
       ↓
16.5 Implement fault-injection framework
       ↓
16.6 Test source/data failures
       ↓
16.7 Test extraction/provider failures
       ↓
16.8 Implement/test completeness gate
       ↓
16.9 Test canonical-event failures
       ↓
16.10 Test detector boundaries
       ↓
16.11 Test evidence fail-closed behavior
       ↓
16.12 Test priority numerical/stale-state failures
       ↓
16.13 Test cache corruption/invalidation
       ↓
16.14 Test repository failures
       ↓
16.15 Test API failures/fuzzing
       ↓
16.16 Test UI degraded states
       ↓
16.17 Test dependency outages
       ↓
16.18 Run deterministic-repeat suite
       ↓
16.19 Run concurrency/idempotency tests
       ↓
16.20 Run UI race-condition tests
       ↓
16.21 Run browser/viewport matrix
       ↓
16.22 Run performance-degradation tests
       ↓
16.23 Run soak test
       ↓
16.24 Run clean-environment build
       ↓
16.25 Run demo recovery drills
       ↓
16.26 Execute full reliability matrix
       ↓
16.27 Resolve R0/R1 failures
       ↓
16.28 Independent red-team
       ↓
16.29 50-run flagship regression
       ↓
16.30 Generate reliability report
       ↓
16.31 Freeze continua-reliability-v1

16.87 Acceptance Gates
Gate A: Safety under failure

No injected failure causes unsupported/wrong-patient clinical output.

PASS / FAIL

Gate B: Partial-data integrity

Incomplete processing cannot create trusted absence claims.

PASS / FAIL

Gate C: Determinism

Repeated deterministic stack execution is semantically identical.

PASS / FAIL

Gate D: Cache

All tested corruption/staleness cases fail closed.

PASS / FAIL

Gate E: API

All invalid/error scenarios preserve frozen error contracts.

PASS / FAIL

Gate F: UX

Every critical degraded state has a truthful usable representation.

PASS / FAIL

Gate G: Dependencies

LLM and database outages do not break P0 judge read path.

PASS / FAIL

Gate H: Race safety

Rapid navigation cannot display stale patient/evidence state.

PASS / FAIL

Gate I: Demo

Hosted/local/video fallback drills succeed.

PASS / FAIL

Gate J: Reproducibility

Clean build and runtime succeed without hidden machine state.

PASS / FAIL

Gate K: Failure budget

R0 = 0 and R1 = 0.

PASS / FAIL

All eleven must pass.

16.88 Exit Report

Populate from real testing:

CONTINUA RELIABILITY V1

Version:
continua-reliability-v1

Total failure scenarios:          XXX
Passed:                           XXX
Failed:                           XXX

R0 unresolved:                      0
R1 unresolved:                      0
R2 accepted:                       XX
R3 accepted:                       XX


CRITICAL INTEGRITY

Wrong-patient outputs:              0
Ungrounded gaps displayed:          0
Partial analyses shown complete:    0
Corrupt caches served:              0
Stale rankings served:              0


DETERMINISM

Core repeat runs:               100
Semantic differences:              0

Top-5 repeat differences:           0


DEPENDENCIES

LLM outage P0:
PASS

Database outage P0:
PASS

Hosted-demo fallback:
PASS

Local fallback:
PASS

Recorded fallback:
PASS


API

Contract scenarios:              XXX
Unexpected 5xx:                   XX
Raw exception leaks:               0


CLIENT

Chrome:                         PASS
Edge:                           PASS
Firefox smoke:                  PASS / N/A
Safari smoke:                   PASS / N/A

UI race failures:                  0
Flagship console errors:            0


SOAK

Duration:                         XX min
Requests/interactions:            XXX
Unhandled errors:                   0
Material memory growth:          NONE / REVIEW


FLAGSHIP

Consecutive E2E passes:          50/50
Median runtime:                   XX sec
Worst successful runtime:         XX sec

Overall:
PASS / FAIL

16.89 Phase Failure Conditions

Do not move to hardening/polish if:

partial inputs can produce trusted absence claims;
wrong-patient evidence can appear through an error path;
corrupt cache silently serves;
queue order changes nondeterministically;
NaN/Infinity can reach UI/API;
P0 flow breaks when LLM is disabled;
P0 flow breaks when Supabase is disabled;
stale request can overwrite current patient view;
repeated flagship runs intermittently fail;
official demo has no tested fallback;
clean clone/build still depends on hidden local files;
R0 or R1 failures remain.

Phase 17 should optimize a stable system, not conceal an unstable one.

16.90 Handoff to Phase 17

After Phase 16, Continua should reliably:

start
↓
validate its snapshot
↓
serve its API
↓
render its queue
↓
open patients
↓
show source evidence
↓
show benchmark proof


and fail predictably when those assumptions are violated.

Phase 17 receives:

stable system
reliability report
measured critical-path latencies
failure/recovery data
tested fallbacks
clean P0 regression suite

and focuses specifically on:

Phase 17 — Performance & Demo Hardening

That phase will optimize startup, bundle/runtime performance, request latency, route preloading, page stability, deployment behavior, cold starts, judge-machine preparation, hosted/local/video redundancy, and repeated 20+ live rehearsal reliability, without altering clinical intelligence.

Phase 16 Definition of Done

This phase is complete when we can deliberately:

kill the LLM,
remove Supabase,
corrupt a cache file,
delete a source document,
return malformed extraction,
make a patient analysis partial,
inject wrong-patient evidence,
create a priority tie,
delay requests,
rapidly switch patients,
restart the application,
lose the hosted demo,

and in every case Continua either:

returns the correct result, degrades transparently, fails closed, or moves to a rehearsed fallback.

Never silently wrong.

Then stamp:

CONTINUA PHASE 16: continua-reliability-v1 FROZEN

Next: Phase 17 — Performance & Demo Hardening.
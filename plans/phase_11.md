Continua Phase 11: Backend / API Layer

Phase 10 gave Continua a benchmark-qualified, deterministic, offline-capable intelligence snapshot. Phase 11 turns that snapshot into a stable application boundary that the UX can depend on without knowing whether its data came from JSON cache, optional persistence, or eventually a production healthcare integration.

Phase 11 mission: Expose Continua's verified intelligence through a versioned, typed, secure, deterministic API that preserves trust metadata, rejects invalid state, never leaks hidden benchmark truth, and remains independent of the underlying storage implementation.

11.0 North Star
     Benchmark-qualified artifacts
                ↓
       Repository Interfaces
                ↓
        Application Services
                ↓
        Validation / Safety
                ↓
          API Route Layer
                ↓
        Stable API Contract
                ↓
     Coordinator UX — Phase 12


The frontend should be able to ask:

Who needs attention?
Why?
What happened?
What evidence supports this?
What is the suggested coordinator action?
How was the priority calculated?
How well did the system benchmark?


without knowing anything about:

JSON files
filesystem paths
model providers
detector internals
ground truth
benchmark labels
Supabase
cache implementation
11.1 Hard Architectural Rules

These are non-negotiable.

Rule 1

API returns only trusted domain objects.

VerifiedGap ✓
CandidateGap ✗

Rule 2

No API endpoint exposes benchmark ground truth.

Rule 3

No route directly reads JSON files.

Routes call application services/repositories.

Rule 4

Clinical GET endpoints require no LLM call.

Rule 5

P0 read endpoints require no external database.

Rule 6

Every clinical response includes synthetic-data disclosure.

Rule 7

Storage implementation never leaks into the API schema.

Rule 8

Any inconsistent/cache-invalid state fails closed.

Rule 9

Scores are explicitly typed:

patient_priority_score
gap_priority_score


Never generic priority_score.

Rule 10

The API uses coordination terminology, never clinical-risk language.

11.2 Phase Inputs

Phase 11 consumes:

continua-demo-cache-v1
API Contract v1
VerifiedGap v1
ClinicalEvent v1
EvidenceBundle
priority-v1
continua-benchmark-v1
Impact classification model
Repository interfaces
JsonDemoRepository


and the frozen safety/runtime schemas.

11.3 Phase Outputs

Phase 11 produces:

continua-api-v1

including:

stable route contracts
application-service layer
runtime validation
repository integration
error mapping
request IDs
safety middleware/helpers
filtering/pagination
health/readiness endpoints
OpenAPI-compatible documentation if practical
API contract tests
cross-endpoint consistency tests
performance results
security tests
11.4 Phase Structure
Subphase	Workstream	Result11.0	Handoff validation	P10 artifacts accepted
11.1	API constitution	Boundary rules frozen
11.2	API versioning	Stable v1 semantics
11.3	Service layer	Business-query orchestration
11.4	Response schemas	Domain DTOs
11.5	Panel API	Panel overview
11.6	Patient API	Patient list/details
11.7	Timeline API	Longitudinal events
11.8	Gap API	Verified gaps only
11.9	Evidence API	Trust deep-dive
11.10	Queue API	Top-K intervention queue
11.11	Metrics API	Impact categories
11.12	Evaluation API	Benchmark results
11.13	Action API	Optional workflow state
11.14	Error model	Failures standardized
11.15	Validation	Input/output enforcement
11.16	Observability	Request diagnostics
11.17	Security	Exposure controls
11.18	Performance	Judge-path latency
11.19	Contract tests	API frozen behavior
11.20	Integration/E2E	Complete read path
11.21	Red-team	API attacks
11.22	Freeze	continua-api-v1
11.5 API Surface

For the MVP, keep the surface intentionally small.

P0 routes
GET  /api/v1/panels/{panelId}

GET  /api/v1/panels/{panelId}/patients

GET  /api/v1/panels/{panelId}/queue

GET  /api/v1/patients/{patientId}

GET  /api/v1/patients/{patientId}/timeline

GET  /api/v1/patients/{patientId}/gaps

GET  /api/v1/evidence/{gapId}

GET  /api/v1/metrics?panelId=demo

GET  /api/v1/evaluation

GET  /api/v1/health

GET  /api/v1/readiness

P1
POST /api/v1/gaps/{gapId}/actions


That's enough.

Do not create 40 endpoints.

11.6 Why Explicit /v1

Earlier drafts used:

/api/panels/...


I recommend one controlled contract amendment:

/api/v1/...


Why?

We have invested heavily in versioned:

events
gaps
evidence
priority
cache

The API should follow the same discipline.

If you don't want URL versioning, version through headers/contracts. But for a hackathon:

/api/v1 is simpler and obvious.

11.7 Application-Service Layer

Routes should remain thin.

Bad:

route.ts
→ loads queue.json
→ filters
→ joins patient
→ formats response


Good:

route.ts
     ↓
QueueService
     ↓
PriorityRepository
PatientRepository
VerifiedGapRepository


The service owns query semantics.

11.8 Service Structure

Suggested:

lib/services/
├── panel-service.ts
├── patient-service.ts
├── timeline-service.ts
├── gap-service.ts
├── evidence-service.ts
├── queue-service.ts
├── metrics-service.ts
├── evaluation-service.ts
└── action-service.ts


No React.

No filesystem assumptions.

No LLM clients.

11.9 DTO Boundary

Domain objects and API objects don't have to be identical.

Use explicit response DTOs.

Why?

Because the API shouldn't accidentally expose new internal fields merely because someone adds them to VerifiedGap.

Example:

VerifiedGap
↓
GapResponseDTO


This is an important safety boundary.

11.10 Common Response Metadata

Every clinical response should contain:

{
  "meta": {
    "api_version": "v1",
    "synthetic": true,
    "evaluation_as_of_date": "2026-06-05",
    "request_id": "..."
  },
  "disclaimer": "Synthetic demo data. For coordinator verification only. Not medical advice."
}


Avoid repeating pipeline version details everywhere unless helpful.

Detailed internals can be available on methodology/evaluation endpoints.

11.11 GET Panel
GET /api/v1/panels/demo


Purpose:

Dashboard shell.

Response:

{
  "panel": {
    "panel_id": "demo",
    "name": "Oncology Continuity Demo",
    "patient_count": 80,
    "patients_with_verified_gaps": 0,
    "verified_gap_counts": {
      "missed_followup": 0,
      "duplicate_test": 0,
      "med_monitoring": 0
    }
  },
  "meta": {},
  "disclaimer": "..."
}


Use actual cache-derived counts.

11.12 Panel Integrity

The endpoint must not recompute clinical logic.

It reads validated aggregates.

Cross-check in tests that:

panel gap counts
=
verified-gap repository counts

11.13 GET Patient List
GET /api/v1/panels/demo/patients


Supported query parameters:

query
gap_type
priority_band
limit
offset


Potential:

sort


but keep allowed fields explicitly enumerated.

11.14 Search Behavior

For MVP:

query


performs case-insensitive synthetic display-name search.

No fuzzy AI search.

No vector database.

No reason.

11.15 Filter Validation

Allowed gap types:

missed_followup
duplicate_test
med_monitoring


Anything else:

400 invalid_query


Allowed priority bands use the final Phase-8 contract.

If amended to:

P1/P2/P3/P4/NONE


use those consistently.

11.16 Pagination

Clamp:

limit default = 50
limit min = 1
limit max = 100

offset min = 0


Never allow:

limit=-500
limit=1000000000


Even with 80 synthetic patients, build the boundary correctly.

11.17 Patient-List Response

Each item only needs:

patient_id
display_name
age
sex
primary_condition
last_contact_date
verified_gap_count
patient_priority_score
priority_band
top_gap_type


Do not ship timeline/evidence in list responses.

11.18 GET Patient
GET /api/v1/patients/{patientId}


Return summary:

{
  "patient": {
    "patient_id": "...",
    "display_name": "Maria Chen",
    "age": 54,
    "sex": "F",
    "primary_condition": "...",
    "last_contact_date": "...",

    "patient_priority_score": 72,
    "priority_band": "P2",

    "verified_gap_count": 3
  }
}


Example score is illustrative only. Actual Phase-8 artifact wins.

11.19 No risk_level

This is a regression gate.

Search API DTOs for:

risk_level
risk_score
clinical_risk


Expected:

0


except documentation explicitly rejecting those concepts.

11.20 Priority Breakdown

Patient response may include:

{
  "priority_breakdown": {
    "top_gap_raw_score": 1.3,
    "secondary_gap_count": 2,
    "secondary_bonus": 0.08,
    "patient_raw_score": 1.38
  }
}


But we don't necessarily need it on every list response.

Detailed patient page is the right location.

11.21 GET Timeline
GET /api/v1/patients/{patientId}/timeline


Return canonical events only.

Response includes:

event_id
date
date_precision
event_type
description
provider display
provider type
source_doc_id
typed display-safe fields

11.22 Timeline Safety

Do not expose internal fields such as:

raw model prompt
hidden extraction debug
benchmark label
scenario ID

Provenance details used by evidence can remain behind evidence endpoint.

11.23 Timeline Sorting

API guarantees:

ascending canonical date
+
frozen tie-breaking


Frontend does not reimplement temporal ordering.

One canonical order.

11.24 GET Gaps
GET /api/v1/patients/{patientId}/gaps


Verified gaps only.

Response:

{
  "patient_id": "...",
  "gaps": [
    {
      "gap_id": "...",
      "gap_type": "missed_followup",

      "title": "Oncology follow-up unresolved",

      "workflow_severity": "high",

      "gap_priority_score": 87,
      "priority_band": "P1",

      "summary": "No completed oncology consultation was found in the available synthetic records by the expected follow-up date.",

      "recommended_coordinator_action": "Verify referral status and coordinate follow-up.",

      "evidence_status": "verified",
      "evidence_count": 2
    }
  ]
}


Actual values come from artifacts.

11.25 Avoid Overclaiming in Gap Copy

API must avoid:

"Maria never saw oncology."

Prefer:

"No completed oncology consultation was found in available records within the expected window."

Avoid:

"Duplicate unnecessary CBC."

Prefer:

"Possible repeat CBC identified within the configured interval."

Avoid:

"Patient failed monitoring."

Prefer:

"No qualifying monitoring result was found in available records by the benchmark due date."

11.26 Gap Titles

Keep short:

Follow-up unresolved
Possible repeat test
Monitoring unresolved


If specialty/test identity useful:

Oncology follow-up unresolved
Possible repeat CBC
Monitoring unresolved


No sensational language.

11.27 GET Evidence
GET /api/v1/evidence/{gapId}


This is one of the most important routes.

Return:

structured claims
positive sources
absence checks
policy checks
verification metadata

11.28 Evidence Response

Conceptually:

{
  "gap_id": "...",
  "verification_status": "verified",

  "claims": [
    {
      "claim": "referral_exists",
      "status": "verified",
      "evidence_ids": ["..."]
    }
  ],

  "sources": [
    {
      "document_id": "...",
      "document_type": "referral",
      "provider": "...",
      "date": "2026-04-18",
      "quoted_span": "...",
      "source_excerpt": "...",
      "verification_method": "exact"
    }
  ],

  "absence_checks": [
    {
      "description": "Completed oncology consult in follow-up window",
      "window_start": "...",
      "window_end": "...",
      "matching_event_count": 0,
      "status": "verified"
    }
  ],

  "policy_checks": []
}


This is the core trust interface.

11.29 Evidence 404 Semantics

If:

gap ID does not exist


→ 404 gap_not_found.

You should never have:

existing user-facing gap but evidence missing


because such a gap should not have become a VerifiedGap.

If internal corruption causes that:

500 data_integrity_error


rather than pretending it is merely a normal missing result.

11.30 GET Queue
GET /api/v1/panels/demo/queue?k=5


Default:

k = 5


Clamp:

1 <= k <= 80


Response follows frozen Phase-8 ordering.

11.31 Queue Response

Each item:

rank
patient_id
display_name
patient_priority_score
priority_band
verified_gap_count
top_gap_id
top_gap_type
top_gap_priority_score
headline
recommended_coordinator_action


No re-ranking in the route.

11.32 Queue Integrity

API integration test recomputes order from cached priorities and verifies:

response queue == priority repository ordering


If mismatch:

hard fail.

11.33 GET Metrics
GET /api/v1/metrics?panelId=demo


This endpoint must preserve claim classification.

Response:

{
  "measured": {},
  "modeled": {},
  "scenario_assumptions": {},
  "external_research": {}
}


Do not flatten:

time saved = X


without indicating what kind of claim it is.

11.34 Example Claim Object
{
  "metric": "manual_review_minutes_per_patient",
  "value": 12,
  "unit": "minutes",
  "classification": "SCENARIO_ASSUMPTION"
}


Measured:

{
  "metric": "cached_queue_server_latency",
  "value": 21,
  "unit": "ms",
  "classification": "MEASURED"
}

11.35 External Research Metrics

If served through API:

include:

source title
publisher
publication date
retrieval date


Later Phase 20 should verify any external figure still used in submission.

11.36 GET Evaluation
GET /api/v1/evaluation


Returns the frozen valid final Phase-9 benchmark artifact.

No calculations in route.

No manually typed F1.

11.37 Evaluation Response

Expose judge-relevant fields:

benchmark version
partition
gap metrics
hard-negative pass
grounding
Top-5 metrics
latency
limitations


Not every debugging artifact.

11.38 Benchmark Status

If Phase-9 final run unavailable:

return:

status = not_run
metrics = null


Never fake numbers.

11.39 Health Endpoint
GET /api/v1/health


Answer:

Is application process alive?

Example:

{
  "status": "ok",
  "api_version": "v1"
}


Do not run expensive checks.

11.40 Readiness Endpoint
GET /api/v1/readiness


Answer:

Can Continua serve valid demo data?

Check:

demo cache ready
manifest valid
repository initialized
compatibility valid

Example:

{
  "status": "ready",
  "cache_version": "continua-demo-cache-v1"
}


If invalid:

503

11.41 Optional Action Endpoint

P1 only:

POST /api/v1/gaps/{gapId}/actions


Allowed action enum:

acknowledged
contacted
reviewed


Potential addition:

coordinating_followup


only if necessary.

11.42 Action Semantics

Action endpoint records workflow state.

It does not change:

detector output
evidence
benchmark
priority history
medical state

If Sarah marks:

contacted


that doesn't retroactively change:

continua-benchmark-v1


Immutable intelligence and mutable workflow remain separated.

11.43 API Error Envelope

Freeze:

{
  "error": {
    "code": "patient_not_found",
    "message": "Patient not found.",
    "request_id": "..."
  }
}


No raw stack trace.

No filesystem path.

No secrets.

No model prompts.

11.44 Canonical Error Codes

At least:

invalid_request
invalid_query
panel_not_found
patient_not_found
gap_not_found
evidence_not_found
unsupported_action
demo_cache_not_ready
cache_version_mismatch
data_integrity_error
repository_error
internal_error


pipeline_error exists only for actual live-processing/developer paths.

Cached reads shouldn't return model pipeline errors.

11.45 HTTP Status Mapping

Suggested:

400 invalid_request/query
404 entity not found
409 incompatible/stale state where appropriate
422 structurally valid but unsupported action
500 internal/data integrity
503 cache not ready/service unavailable


Keep mapping consistent.

11.46 Request Validation

Route params and query strings arrive as untrusted input.

Use runtime schemas.

Validate:

UUID/allowed IDs
panel IDs
K
limit
offset
priority bands
gap types
action body

No direct use of arbitrary query strings.

11.47 Response Validation

This is worthwhile for the hackathon because contracts matter heavily.

Application service builds DTO.

Before response:

ResponseSchema.parse()


at least in test/development mode.

This catches accidental breaking changes.

11.48 Request IDs

Every request gets:

request_id


Generated independently of clinical IDs.

Include in:

logs
error response
optional metadata

Useful for demo debugging.

11.49 Structured Logs

Example:

timestamp
level
request_id
route
status
duration_ms
repository_operation
result_count


Avoid:

patient record contents
source spans
API keys


in ordinary logs.

11.50 API Safety Headers

For Next.js/Vercel deployment, configure reasonable baseline headers where compatible:

X-Content-Type-Options: nosniff
frame policy/CSP strategy as appropriate
referrer policy
cache policy

Don't claim this makes the app HIPAA compliant.

It doesn't.

11.51 Browser Caching Strategy

Synthetic demo data is non-sensitive, but stale-version behavior matters.

For dynamic API responses, use conservative caching unless intentional.

Possible:

Cache-Control: no-store


initially.

Since server itself has fast local cache, browser HTTP caching isn't required.

This prevents stale UI after deployment.

11.52 CORS

If frontend and API are same Next.js deployment:

keep same-origin.

Do not enable:

Access-Control-Allow-Origin: *


needlessly.

Future APIs can revisit it.

11.53 Authentication

P0 official demo:

probably public read-only application.

Do not add an authentication project unless hackathon case study requires it.

However:

mutating routes should be constrained appropriately;
developer recompute routes must never be publicly exposed by accident.
11.54 Developer Routes

If live recompute/debug endpoints exist:

gate them behind:

NODE_ENV !== production


or explicit secret/admin control.

Best:

Don't ship them in public production.

A public endpoint that triggers expensive LLM calls is a cost/security risk.

11.55 Hidden Benchmark Protection

Runtime API must not expose:

/api/ground-truth
/api/negative-manifest
/api/truth-events


Hard static/integration test.

11.56 Benchmark Aggregate vs Hidden Labels

/evaluation can expose aggregate benchmark results.

That's fine.

It must not expose patient-level ground-truth labels used to score the system.

Otherwise someone inspecting the demo could confuse benchmark truth with system predictions.

11.57 API Version Metadata

All responses can include:

api_version = v1


Evaluation/methodology route may expose component versions.

Standard patient responses don't need 10 version strings cluttering output.

11.58 OpenAPI

Should we generate OpenAPI?

Yes, if straightforward.

Benefits:

makes backend look production-minded
documents request/response
useful for README
makes contract drift visible

But:

Do not spend an entire day building Swagger UI.

A generated/static openapi.json is enough.

11.59 API Documentation

For each route document:

path
method
purpose
parameters
response schema
errors
example
safety behavior

This will help Phase 19 documentation.

11.60 Contract Testing

For each P0 route:

Success

Expected status and response shape.

Not found

Correct structured error.

Invalid parameter
Repository failure

safe 500.

Cache unavailable

503 where appropriate.

Disclaimer

present on clinical routes.

11.61 Cross-Endpoint Consistency Tests

These are particularly strong.

CT-01

Panel patient count:

/panel.patient_count
==
patient list total

CT-02

Panel gap counts:

==
sum of VerifiedGap repository

CT-03

Patient verified gap count:

==
/patients/{id}/gaps length

CT-04

Queue priority score:

==
patient-detail priority score

CT-05

Gap evidence status:

verified


and evidence route exists.

CT-06

Queue gap IDs exist in gaps endpoint.

CT-07

Evaluation API values:

==
Phase-9 final report

CT-08

Metric classification preserved.

These catch subtle data drift.

11.62 Maria API Regression

Run full Maria API path:

GET panel
↓
GET queue
↓
find Maria's actual rank
↓
GET Maria
↓
GET timeline
↓
GET gaps
↓
GET flagship evidence
↓
GET metrics
↓
GET evaluation


Everything must agree.

Do not assert Maria rank #1 unless Phase 8 actually produced rank #1.

11.63 Golden Judge API Flow

The 90-second UI will mostly rely on:

queue
patient
timeline
gaps
evidence
metrics/evaluation


Load-test this sequence as the critical API pathway.

11.64 Performance Targets

Cached API path should be fast.

Engineering targets:

Route	Server processing targetPanel	<50 ms
Queue	<50 ms
Patients	<75 ms
Patient	<75 ms
Timeline	<100 ms
Gaps	<75 ms
Evidence	<100 ms
Metrics	<50 ms
Evaluation	<50 ms

Don't advertise these until measured.

Network/render latency is separate.

11.65 API Performance Benchmark

Measure:

cold request
warm request
p50
p95


Enough repetitions to make percentile statistics meaningful.

No external LLM.

No external DB for P0.

11.66 Payload Size

Track large routes.

Especially:

timeline
evidence


Don't return full patient record corpus from either.

Evidence should return only relevant excerpt(s).

This improves speed and clarity.

11.67 N+1 Problems

With 80 patients and JSON memory repositories, not a huge concern.

Still avoid:

queue → 5 separate patient file scans → each gap file scan


Use Phase-10 indexes.

Service should make O(1)-ish ID lookups where practical.

11.68 API-Level LLM Independence Test

Stub LLM provider to throw on every invocation.

Exercise every P0 GET route.

Expected:

all success


This proves routes aren't accidentally wired to live AI.

11.69 External Database Independence

Disable Supabase configuration.

P0 GET routes still succeed.

If P1 action route depends on Supabase:

it can be disabled or use local persistence.

But read experience remains intact.

11.70 Security Red-Team

Test:

A Path traversal

IDs such as:

../../ground_truth.json


must never become filesystem paths.

Repositories use indexed IDs, not path concatenation.

B Oversized query

Clamp.

C Unknown enum

Reject.

D Invalid JSON body
E Script text in query/name

React escapes output; API returns JSON safely.

F Hidden benchmark access

No route.

G Developer route production access

Unavailable.

H Secret leakage

Errors never expose environment.

I Cache-invalid state

Fail closed.

J Other-patient evidence

Evidence ownership invariant preserved.

11.71 Error Injection

Simulate:

repository throws
cache not ready
missing patient
missing evidence
malformed cached object
incompatible schema

Each gets deterministic response.

Do not let raw exception bubble to client.

11.72 Accessibility-Ready API

While accessibility is mostly UI, API can help by returning clear labels rather than only colors/codes.

For example:

{
  "priority_band": "P1",
  "priority_label": "Act first"
}


Phase 12 doesn't need to infer human-readable semantics.

11.73 Localization

MVP remains English-only per scope.

Don't add i18n now.

11.74 API Data Minimization

Even synthetic demos should follow sensible boundaries.

Patient list doesn't need:

all notes
all source evidence
all extraction metadata

Return only what the screen needs.

This models responsible healthcare-system design.

11.75 Auditability

For evidence/priority objects, API may expose:

methodology IDs/version


on detailed/methodology endpoints.

Standard UX doesn't need every internal identifier.

Balance transparency with readability.

11.76 Phase-11 Failure Taxonomy

Freeze:

API-001

Invalid input accepted.

API-002

Incorrect HTTP status.

API-003

Response schema mismatch.

API-004

Candidate gap exposed.

API-005

Hidden truth exposed.

API-006

Score semantic mismatch.

API-007

Cross-endpoint data inconsistency.

API-008

Clinical disclaimer missing.

API-009

Raw exception leaked.

API-010

External service accidentally required.

API-011

Stale cache served.

API-012

Evidence ownership broken.

API-013

Ground-truth endpoint exposure.

API-014

Manual benchmark value mismatch.

API-015

Unsafe action accepted.

11.77 Observability Report

For route testing:

route
requests
successes
client errors
server errors
p50
p95
largest payload
external dependency calls


Goal:

external AI calls = 0
external DB calls = 0


for P0 read route suite.

11.78 Expected File Structure
app/api/v1/
├── panels/
│   └── [panelId]/
│       ├── route.ts
│       ├── patients/route.ts
│       └── queue/route.ts
│
├── patients/
│   └── [patientId]/
│       ├── route.ts
│       ├── timeline/route.ts
│       └── gaps/route.ts
│
├── evidence/
│   └── [gapId]/route.ts
│
├── gaps/
│   └── [gapId]/
│       └── actions/route.ts
│
├── metrics/route.ts
├── evaluation/route.ts
├── health/route.ts
└── readiness/route.ts

lib/services/
├── panel-service.ts
├── patient-service.ts
├── timeline-service.ts
├── gap-service.ts
├── evidence-service.ts
├── queue-service.ts
├── metrics-service.ts
├── evaluation-service.ts
└── action-service.ts

lib/api/
├── dto/
├── schemas/
├── errors.ts
├── responses.ts
├── request-id.ts
├── metadata.ts
└── version.ts

tests/api/
├── panel.test.ts
├── patients.test.ts
├── timeline.test.ts
├── gaps.test.ts
├── evidence.test.ts
├── queue.test.ts
├── metrics.test.ts
├── evaluation.test.ts
├── errors.test.ts
├── consistency.test.ts
├── security.test.ts
├── independence.test.ts
└── maria.test.ts

docs/api/
├── api-v1.md
├── errors.md
├── examples.md
└── openapi.json

11.79 Execution Order

Work in this order:

11.0 Validate Phase-10 cache
       ↓
11.1 Freeze API constitution
       ↓
11.2 Apply/freeze /api/v1 contract
       ↓
11.3 Define response DTOs
       ↓
11.4 Define request/query schemas
       ↓
11.5 Build common API response/error helpers
       ↓
11.6 Implement application services
       ↓
11.7 Implement health/readiness
       ↓
11.8 Implement panel endpoint
       ↓
11.9 Implement patient list/detail
       ↓
11.10 Implement timeline
       ↓
11.11 Implement verified gaps
       ↓
11.12 Implement evidence
       ↓
11.13 Implement queue
       ↓
11.14 Implement metrics
       ↓
11.15 Implement evaluation
       ↓
11.16 Optional coordinator actions
       ↓
11.17 Add request IDs/logging
       ↓
11.18 Add safety metadata
       ↓
11.19 Contract tests
       ↓
11.20 Cross-endpoint consistency
       ↓
11.21 External-dependency independence test
       ↓
11.22 Performance benchmark
       ↓
11.23 Security red-team
       ↓
11.24 Maria API regression
       ↓
11.25 Generate API docs/OpenAPI
       ↓
11.26 Freeze continua-api-v1

11.80 Quantitative Gates
Requirement	GateP0 endpoint contract failures	0
Candidate gaps exposed	0
Ground-truth labels exposed	0
Generic ambiguous priority fields	0
Risk-score terminology	0
Clinical responses missing disclaimer	0
Cross-endpoint inconsistencies	0
Raw exception leaks	0
P0 GET LLM calls	0
P0 GET external DB calls	0
Cache-version bypasses	0
Wrong-patient evidence exposures	0
Evaluation-report mismatches	0
Unclassified impact metrics	0
Security red-team blockers	0
Production build failures	0
11.81 Acceptance Gates
Gate A: Contract

Every P0 endpoint matches continua-api-v1.

PASS / FAIL

Gate B: Trust Boundary

Only verified clinical intelligence is exposed.

PASS / FAIL

Gate C: Storage Independence

Frontend contract doesn't depend on JSON/Supabase implementation.

PASS / FAIL

Gate D: Offline Read Path

No LLM/external DB required.

PASS / FAIL

Gate E: Consistency

Panel, patient, gaps, queue, evidence and benchmark views agree.

PASS / FAIL

Gate F: Validation

Malformed input cannot escape schemas.

PASS / FAIL

Gate G: Error Safety

Failures are structured and non-sensitive.

PASS / FAIL

Gate H: Benchmark Integrity

Evaluation API matches Phase-9 frozen report exactly.

PASS / FAIL

Gate I: Performance

Judge-critical P0 paths meet accepted latency limits.

PASS / FAIL

Gate J: Security

No benchmark leakage, route traversal, debug-route exposure or secret leakage.

PASS / FAIL

Gate K: Maria

Full flagship API path is coherent.

PASS / FAIL

All 11 must pass.

11.82 Exit Report

Populate with measured values only:

CONTINUA API V1

API:
continua-api-v1

Cache:
continua-demo-cache-v1

P0 routes:
XX

P1 routes:
XX


CONTRACT

Schema failures:                  0
Cross-endpoint inconsistencies:   0
Candidate gaps exposed:           0
Hidden benchmark labels exposed:  0


DEPENDENCIES

LLM calls on P0 GET suite:        0
External DB calls on P0 GET:      0


PERFORMANCE

Panel p50/p95:                    — / — ms
Queue p50/p95:                    — / — ms
Patient p50/p95:                  — / — ms
Timeline p50/p95:                 — / — ms
Evidence p50/p95:                 — / — ms


SAFETY

Disclaimer coverage:              100%
Risk-score terminology:           0
Raw error leaks:                  0
Wrong-patient evidence:           0

Security red-team:
PASS / FAIL

Maria API regression:
PASS / FAIL

Production build:
PASS / FAIL

11.83 Failure Conditions

Do not proceed if:

frontend needs to understand cache file layout;
route reads ground truth;
/evaluation contains hand-entered metrics;
candidate gaps appear in regular API output;
priority semantics differ between queue/patient routes;
evidence route returns another patient's record;
routes silently recalculate clinical logic differently from frozen artifacts;
P0 reads require an LLM;
P0 reads require Supabase;
invalid cache still produces HTTP 200;
debug/recompute route is exposed publicly;
API throws raw stack traces.
11.84 Handoff to Phase 12

After Phase 11, every product-critical query has a stable contract.

Phase 12 can therefore focus entirely on the experience:

continua-api-v1
       ↓
Coordinator UX
       ↓
80 patients
       ↓
Top-5 verified interventions
       ↓
Patient journey
       ↓
Why?
       ↓
Exact evidence
       ↓
Next coordinator action


No UI component should implement clinical reasoning.

No UI component should calculate priority.

No UI component should manually enter benchmark results.

Phase 11 Definition of Done

We can freeze Phase 11 when an entirely separate frontend developer, knowing only continua-api-v1, can build the complete judge experience without knowing:

where data is stored,
which LLM was used,
how detector rules are implemented,
where benchmark labels live,
how queue rankings were calculated internally.

And when we can disable:

LLM credentials
Supabase
external healthcare services


and every official read endpoint still works.

Only then stamp:

CONTINUA PHASE 11: continua-api-v1 FROZEN

Next: Phase 12 — Coordinator UX / Judge-Facing Product Experience, where the engineering work finally becomes the polished operations workbench the judges will see.
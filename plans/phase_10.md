Continua Phase 10: Persistence & Demo Cache

Phases 2–9 created and benchmarked the intelligence core. Phase 10 now addresses a different failure mode:

A correct system that fails during judging still loses.

The official demo must not depend on an LLM provider responding quickly, an API key remaining valid, external rate limits, or a 60-second live panel-processing job completing perfectly.

Phase 10 mission: Build a versioned persistence and immutable demo-cache layer that stores benchmark-qualified Continua artifacts, detects stale or corrupted data, supports fast API reads, and lets the complete judge path operate without live AI or external services.

10.0 North Star Architecture

Separate computation from presentation:

             OFFLINE / BUILD PATH

Synthetic Records
      ↓
extractor-v1
      ↓
ClinicalEvent v1
      ↓
gaps-v1
      ↓
evidence-v1
      ↓
priority-v1
      ↓
continua-benchmark-v1
      ↓
QUALIFIED ARTIFACTS
      ↓
Demo Cache Builder
      ↓
Validate + Hash + Freeze
      ↓
┌───────────────────────────────┐
│ continua-demo-cache-v1        │
└───────────────────────────────┘


              JUDGE PATH

continua-demo-cache-v1
      ↓
Repository Layer
      ↓
API
      ↓
Coordinator UI
      ↓
90-second Demo

Non-negotiable

The judge path should work with:

LLM_API_KEY = absent
Supabase = unavailable
external network = unavailable


for all precomputed demo intelligence.

10.1 Inputs

Phase 10 consumes only benchmark-qualified/frozen artifacts:

continua-synth-v1
continua-eval-v1
clinical-event-v1
extractor-v1
gaps-v1
evidence-v1
priority-v1
continua-benchmark-v1
frozen patient panel
frozen records
canonical timelines
VerifiedGap objects
ranked panel
Top-5 queue
impact classifications
evaluation report
Maria demo artifacts
all version/hash metadata
10.2 Outputs

Phase 10 produces:

continua-demo-cache-v1

and a persistence layer supporting:

panels
patients
records
timelines
verified gaps
evidence bundles
patient priorities
queue snapshots
benchmark/evaluation output
impact metrics
metadata/versioning
optional coordinator actions
10.3 Phase 10 Non-Goals

Do not turn this into a database-engineering project.

Phase 10 does not need:

distributed caching
Redis
Kafka
Kubernetes
multi-region replication
high-availability clusters
event sourcing
real-time healthcare streaming
multi-hospital tenancy
production EHR persistence
real PHI encryption/compliance claims
vector database
authentication platform

For the hackathon:

A validated JSON-backed immutable cache is completely legitimate.

Use Supabase/PostgreSQL later only where persistence materially improves the product.

10.4 Phase Structure
Subphase	Workstream	Outcome10.0	Handoff validation	Qualified artifacts confirmed
10.1	Persistence contract	Storage semantics frozen
10.2	Cache manifest	Artifact identity
10.3	Artifact schemas	Typed cache files
10.4	Cache builder	Pipeline output → cache
10.5	Integrity hashing	Corruption detectable
10.6	Version compatibility	Staleness detectable
10.7	Repository implementation	Typed read access
10.8	Patient persistence	Core patient data
10.9	Timeline persistence	Canonical journey data
10.10	Gap/evidence persistence	Trust preserved
10.11	Priority persistence	Queue reproducible
10.12	Benchmark persistence	Metrics available
10.13	Impact persistence	Claims classified
10.14	Maria fixture	Flagship path locked
10.15	Optional database adapter	Supabase if useful
10.16	Cache invalidation	Wrong versions rejected
10.17	Offline mode	No external dependency
10.18	Runtime performance	Judge path fast
10.19	Failure recovery	Cache problems graceful
10.20	Verification tests	Full artifact integrity
10.21	Red-team	Cache tampering/failure
10.22	Freeze	continua-demo-cache-v1
10.5 Persistence Principle: Store Derived Truth, Not Hidden Truth

We need a critical separation.

Demo cache MAY contain:
synthetic patient records
extracted events
VerifiedGap objects
evidence bundles
priority outputs
measured benchmark report
Runtime demo cache MUST NOT use:
ground_truth.json
planted scenario answers
negative manifest labels
truth events as shortcuts

The outputs were produced by our frozen pipeline.

They were not copied from benchmark labels.

10.6 Two Storage Classes

Separate storage into:

A. Source artifacts

Things the pipeline consumes:

patients
providers
records

B. Derived artifacts

Things the pipeline produces:

canonical events
verified gaps
priority
queue
benchmark results


This makes provenance clear.

10.7 Cache Manifest

Every official cache needs one root manifest.

Example:

{
  "cache_version": "continua-demo-cache-v1",

  "dataset_version": "continua-synth-v1",
  "eval_version": "continua-eval-v1",
  "clinical_event_schema": "clinical-event-v1",
  "extractor_version": "extractor-v1",
  "normalization_version": "normalization-v1",
  "detector_version": "gaps-v1",
  "gap_policy_version": "gap-policy-v1",
  "evidence_version": "evidence-v1",
  "priority_version": "priority-v1",
  "benchmark_version": "continua-benchmark-v1",

  "evaluation_as_of_date": "2026-06-05",

  "patient_count": 80,

  "generated_at": "...",
  "git_commit": "...",

  "artifacts": {},
  "manifest_sha256": "..."
}


Every file becomes traceable to the intelligence versions that created it.

10.8 Cache Artifact Inventory

Freeze the official cache as something like:

data/demo-cache/continua-demo-cache-v1/
│
├── manifest.json
├── panel.json
├── patients.json
├── records.json
├── timelines.json
├── verified-gaps.json
├── evidence.json
├── priorities.json
├── queue.json
├── impact.json
├── evaluation.json
└── maria.json


This is deliberately boring.

Boring is good.

10.9 Panel Artifact

panel.json:

{
  "panel_id": "demo",
  "name": "Oncology Continuity Demo",
  "patient_count": 80,

  "flagged_patient_count": 0,

  "verified_gap_counts": {
    "missed_followup": 0,
    "duplicate_test": 0,
    "med_monitoring": 0
  },

  "top_patient_ids": [],

  "generated_at": "...",

  "synthetic": true
}


Populate actual counts from frozen outputs.

Never manually type them.

10.10 Patients Artifact

Store UI/API-required summaries only.

Example:

{
  "patient_id": "...",
  "fixture_key": "P-001-maria",
  "display_name": "Maria Chen",
  "age": 54,
  "sex": "F",
  "primary_condition": "...",
  "last_contact_date": "...",
  "verified_gap_count": 3,
  "patient_priority_score": 0,
  "priority_band": "P?"
}


The priority values come from Phase 8.

10.11 Records Artifact

Preserve synthetic raw records because evidence deep-dive requires them.

Every record includes:

document ID
patient ID
document type
date
provider
source text
synthetic flag
dataset version
content hash


No real PHI.

10.12 Timeline Artifact

Store canonical events grouped by patient.

Example:

{
  "patient_id": "...",
  "events": [],
  "event_store_hash": "...",
  "clinical_event_schema": "clinical-event-v1",
  "extractor_version": "extractor-v1"
}


Do not regenerate timeline from raw text during judge demo.

It's already benchmark-qualified.

10.13 Verified Gaps Artifact

Only:

VerifiedGap v1


objects belong here.

Never candidate gaps.

Example root:

{
  "patient_id": "...",
  "verified_gaps": []
}


Phase 12 UI cannot accidentally render a suppressed candidate if the demo cache never contains it.

That's a useful safety property.

10.14 Evidence Artifact

Store complete EvidenceBundles:

positive sources
absence checks
policy checks
exact spans
offsets
verification method
verification results
structured claims
evidence version

This powers instantaneous evidence drawers.

10.15 Priority Artifact

Store both gap-level and patient-level priority.

Never overload score names.

{
  "patient_id": "...",

  "patient_priority_score": 82,
  "priority_band": "P1",

  "top_gap_id": "...",

  "breakdown": {
    "top_gap_raw": 1.30,
    "secondary_bonus": 0.08,
    "patient_raw_score": 1.38
  },

  "priority_version": "priority-v1"
}


Use actual frozen Phase-8 output.

10.16 Queue Artifact

This should be extremely cheap to read during the demo.

{
  "panel_id": "demo",
  "k": 5,
  "items": [],
  "priority_version": "priority-v1",
  "verified_gap_set_hash": "...",
  "generated_at": "..."
}

Critical

Do not manually make Maria rank #1 in this file.

Queue is generated from Phase 8 ordering.

If Maria is #3:

she is #3.

10.17 Evaluation Artifact

Cache the latest valid frozen Phase-9 final report.

This gives the evaluation screen instant loading.

Example:

{
  "benchmark_run_id": "...",
  "status": "completed",

  "gap_detection": {},
  "grounding": {},
  "hard_negatives": {},
  "priority": {},
  "latency": {},

  "benchmark_version": "continua-benchmark-v1"
}


Do not hardcode benchmark numbers into UI source.

The UI must read this artifact.

10.18 Impact Artifact

This needs claim-classification discipline from Phase 0.

Store metrics like:

{
  "measured": {},
  "modeled": {},
  "scenario_assumptions": {},
  "external_research": {}
}


Example:

{
  "measured": {
    "panel_processing_latency_sec": 8.4
  },

  "scenario_assumptions": {
    "manual_review_minutes_per_patient": 12
  },

  "modeled": {
    "potential_hours_redirected": 15.2
  }
}


Those are illustrative fields. Actual values come from real measurements.

10.19 External Research Statistics

Do not bake outdated research values indiscriminately into cache.

If business-statistic claims are included:

source
title
publication date
retrieval date
metric


must exist.

Because submission is in late 2026, any externally cited healthcare statistic should eventually be source-verified again before final publication.

But this phase is cache architecture, not new literature review.

10.20 Maria Artifact

Create one convenience artifact:

maria.json


It may contain IDs linking the demo sequence:

{
  "patient_id": "...",
  "fixture_key": "P-001-maria",
  "queue_rank": 3,

  "flagship_gap_id": "...",

  "demo_path": {
    "timeline_event_ids": [],
    "gap_ids": [],
    "flagship_evidence_id": "..."
  }
}


This is navigation metadata, not clinical special-casing.

It must not alter:

ranking
gap outputs
evidence
scores

It merely makes automated demo regression easier.

10.21 Maria Special-Case Boundary

Allowed:

demo script knows which patient to click


Forbidden:

pipeline logic changes because patient == Maria


That's the distinction.

10.22 Artifact Hashing

Every artifact gets SHA-256.

Manifest:

{
  "artifacts": {
    "patients.json": {
      "sha256": "...",
      "bytes": 12345
    }
  }
}


Loader checks hashes.

A corrupted cache should never silently render.

10.23 Manifest Hash Problem

A manifest cannot naïvely contain its own hash inside the hashed content without a defined convention.

Freeze one method.

For example:

generate manifest excluding manifest_sha256;
canonicalize JSON;
hash;
append hash.

Validator repeats the same process.

Document it.

10.24 Canonical JSON

For deterministic hashes:

stable key ordering
stable array ordering
stable whitespace/serialization
no non-deterministic timestamps inside content used for semantic reproducibility unless frozen
UTF-8

Use one canonical serialization helper.

10.25 Generated Timestamp

generated_at changes across rebuilds.

That can break byte-identical output even if content hasn't changed.

Two options:

Semantic reproducibility

Exclude volatile metadata from semantic content hash.

Full artifact reproducibility

Feed a fixed build timestamp when regenerating an official release.

I recommend both:

content_sha256
artifact_sha256


But only if this doesn't overcomplicate implementation.

At minimum:

Clearly define what the hash covers.

10.26 Version Compatibility Matrix

Loader checks:

cache v1 expects:
clinical-event-v1
gaps-v1
evidence-v1
priority-v1


If artifact says:

priority-v2


while runtime expects priority-v1:

CACHE_VERSION_MISMATCH


Do not quietly load it.

10.27 Cache Staleness

Cache is stale if any material input changes:

dataset version
extractor version
prompt version if relevant to event store
normalization version
detector version
policy version
evidence version
priority version
evaluation date
benchmark-qualified commit

Staleness must be detectable automatically.

10.28 Cache Builder Pipeline

Implement:

Validate frozen benchmark
       ↓
Load source artifacts
       ↓
Load benchmark-qualified derived artifacts
       ↓
Validate schemas
       ↓
Cross-check IDs
       ↓
Generate API-oriented aggregates
       ↓
Generate queue
       ↓
Generate evidence index
       ↓
Generate impact/eval artifacts
       ↓
Canonicalize
       ↓
Hash
       ↓
Write manifest
       ↓
Re-open output
       ↓
Revalidate everything
       ↓
Freeze


That final self-load validation matters.

10.29 No Live Pipeline While Building Cache

The cache build for official release should consume the frozen Phase-9 artifacts.

Don't rerun the LLM silently as part of the cache build.

Otherwise:

benchmark report


could describe one extraction output while:

demo cache


contains another.

They must refer to the same qualified artifact set.

10.30 Cache Provenance Chain

For a displayed gap, we should theoretically trace:

UI gap
↓
verified-gaps.json
↓
evidence.json
↓
timelines.json
↓
records.json
↓
continua-synth-v1


with version/hash relationships intact.

Excellent for auditability.

10.31 Repository Interfaces

Phase 1 defined abstractions.

Now implement the demo repository.

Potential interfaces:

PanelRepository
PatientRepository
RecordRepository
TimelineRepository
VerifiedGapRepository
EvidenceRepository
PriorityRepository
EvaluationRepository
ImpactRepository


Implementation:

JsonDemoRepository

10.32 JSON Repository Advantages

For this project:

deterministic
no DB dependency
zero network
easily inspectable
easy to Git-version
fantastic for demo
fast
portable

That is the default I'd choose.

10.33 Do We Need Supabase?

Probably not for P0 demo reads.

We may use Supabase for:

P1 local coordinator action persistence
custom uploaded synthetic panels
future multi-user extension

But don't make the judge demo depend on it.

10.34 Persistence Strategy

Thus:

P0
JSON Demo Repository

P1

Optional:

Supabase action state

Future
PostgreSQL production persistence


This is pragmatic.

10.35 Coordinator Action State

Phase-0 API had P1:

POST /api/gaps/{gapId}/action


Actions:

acknowledged
contacted
reviewed

We need to decide storage.

For demo:

Option 1

Browser/local state.

Simplest.

Option 2

Supabase.

Persistent across browsers, but external dependency.

Recommendation

P1 only.

Do not let this block Phase 10.

10.36 Immutable Intelligence + Mutable Workflow

Important architecture:

Verified Gap:
immutable demo artifact

Coordinator action:
mutable workflow state


Never mutate:

verified-gaps.json


because Sarah clicked "contacted."

Instead action state references:

gap_id


This preserves benchmark integrity.

10.37 Repository Read Path

Example queue request:

GET /api/panels/demo/queue?k=5
       ↓
PriorityRepository
       ↓
queue.json
       ↓
runtime validation
       ↓
API response


No LLM.

No detector.

No evidence recomputation.

Fast.

10.38 Patient Detail Read Path
GET patient
   ├── PatientRepository
   ├── TimelineRepository
   ├── VerifiedGapRepository
   └── PriorityRepository


All locally available.

10.39 Evidence Read Path
GET /api/evidence/{gapId}
       ↓
EvidenceRepository
       ↓
evidence.json
       ↓
linked record lookup
       ↓
return source excerpt/claims


Again:

zero AI.

10.40 Repository Indexes

Don't scan 500 documents on every request.

At server startup/build time create maps:

patientById
recordsByPatient
timelineByPatient
gapsByPatient
gapById
evidenceByGap
priorityByPatient


80 patients is tiny.

In-memory indexing is perfect.

10.41 Startup Validation

When application starts in demo mode:

read manifest;
validate cache version;
validate artifact schemas;
optionally validate hashes according to performance strategy;
build indexes;
mark cache ready.

If failure:

DEMO_CACHE_INVALID


Do not partially serve inconsistent data.

10.42 Hash Validation Strategy

Full hashes at every web request are unnecessary.

Recommended:

Build/CI

Verify all hashes.

App startup

Verify manifest/version and optionally file hashes once.

Request

Use already validated in-memory repository.

10.43 Cache Readiness State

Expose internally:

UNINITIALIZED
VALIDATING
READY
INVALID


API requests made while invalid return a structured error rather than fake/partial data.

10.44 Demo Offline Mode

Create:

CONTINUA_DEMO_MODE=true


When true:

demo JSON repository required;
LLM not required;
Supabase not required;
network mutations disabled unless explicitly configured.

This should be the default official demo configuration.

10.45 Offline Acceptance Test

Literal test:

remove LLM key;
remove Supabase config;
block provider client;
start app;
load dashboard;
open Maria;
open evidence;
view impact;
view evaluation.

Everything must work.

10.46 True Offline Caveat

A deployed Vercel URL inherently requires network access from the judge's browser.

"Offline demo mode" here means:

No external data/AI services beyond serving the app itself.

For true backup reliability, also maintain a locally runnable version.

10.47 Demo Backup Strategy

We should eventually have three layers:

A

Hosted Vercel demo.

B

Local npm run dev/start cached demo.

C

1–2 minute recorded demo video.

If Vercel/network fails live:

the video still proves functionality.

Phase 17 hardens this later.

10.48 Cache Performance Targets

Since data is small, be ambitious but realistic.

Targets:

Repository index startup:
< 500 ms locally, preferably much lower

Queue read:
< 50 ms server computation

Patient read:
< 100 ms server computation

Evidence read:
< 100 ms

No LLM/network service calls
during read path


Browser/render latency is measured separately.

These are engineering targets, not promises until measured.

10.49 API Performance

Don't optimize a fake /api/load animation to take 8 seconds.

If cache is ready:

show the product immediately.

The "8 seconds" historical demo claim should only be used if it was truly measured and correctly classified.

Never intentionally slow down the demo to make AI look like it's running.

10.50 Live Recompute Route

Do we need one?

Potentially later, for judges wanting proof that AI actually runs.

But it should be separate:

/api/dev/recompute


or a developer-only script.

Not the default demonstration.

Official judge flow

Cached.

Technical backup

Show benchmark + architecture + optional live single-patient recompute.

10.51 Avoid Fake AI Theater

Do not display:

Analyzing...
Reasoning...
Checking 80 patients...


if data is merely loading from cache.

That is misleading.

Instead:

Demo data loaded
Benchmark-qualified snapshot


Transparency increases credibility.

10.52 Optional “Recompute” Demonstration

If later useful:

Recompute one synthetic patient


can run:

raw records
→ extractor
→ deterministic pipeline


then compare:

live result
vs cached benchmark snapshot.


That's technically impressive.

But P1/Nice-to-have.

Do not risk official demo reliability.

10.53 Cache Integrity Tests
C-01

Missing artifact file.

→ invalid.

C-02

Changed file without updated hash.

→ invalid.

C-03

Wrong priority version.

→ invalid.

C-04

Wrong evaluation date.

→ invalid.

C-05

Gap references missing patient.

→ invalid.

C-06

Evidence references missing gap.

→ invalid.

C-07

Queue references suppressed candidate.

→ invalid.

C-08

Queue score doesn't match priority artifact.

→ invalid.

C-09

Evaluation numbers don't match Phase-9 artifact.

→ invalid.

C-10

Maria navigation metadata affects ranking.

→ fail regression.

10.54 Cross-Artifact Integrity

Validate:

all patient IDs resolve
all record patient IDs resolve
all timeline patient IDs resolve
all event source docs resolve
all gaps resolve to patient/events
all evidence resolves to gap/docs
all priority objects resolve to gaps
all queue items resolve to priority


Nothing dangling.

10.55 Queue Integrity

Recompute Top-5 from stored priorities during cache validation and compare to:

queue.json


Expected:

identical


This prevents hand-edited queue files.

10.56 Benchmark Integrity

Check evaluation.json against immutable final Phase-9 result hash.

The UI can't carry a hand-improved F1 accidentally.

10.57 Impact Integrity

All impact metrics require classification:

MEASURED
MODELED
SCENARIO_ASSUMPTION
EXTERNAL_RESEARCH


Validation fails if an impact metric has no class.

Great protection against accidental overclaiming.

10.58 Demo Disclosure

Every cached clinical API response continues to include:

Synthetic demo data. For coordinator verification only. Not medical advice.

UI global banner remains.

Cache does not bypass safety semantics.

10.59 Error Handling

If cache invalid:

UI:

Demo data couldn't be validated. Reload the application or use the packaged demo snapshot.

Not:

Something went wrong.

Developer logs include actual cause.

No raw stack trace to user.

10.60 Cache Rebuild Command

Create one canonical command:

npm run build:demo-cache


It should:

validate source artifacts;
build cache;
validate output;
compute hashes;
print summary.

No manual copy/paste.

10.61 Cache Validation Command
npm run validate:demo-cache


Output:

Cache: continua-demo-cache-v1
Patients: 80
Artifacts: XX
Schema validation: PASS
Cross references: PASS
Hashes: PASS
Queue integrity: PASS
Benchmark integrity: PASS
Safety classification: PASS

10.62 Cache Diff Command

Highly useful:

npm run diff:demo-cache -- previous latest


Show changes in:

gap counts
rankings
Maria rank
benchmark metrics
impact metrics

This helps catch unintended changes after upstream version updates.

10.63 CI Integration

CI must:

Validate cache
↓
Verify hashes
↓
Verify versions
↓
Run API repository tests
↓
Build Next.js


If committed frozen artifacts change unexpectedly:

review required.

10.64 Cache Size

With:

80 patients
400–600 text records

the total JSON payload should still be manageable.

Don't prematurely optimize into binary formats.

If raw records make client bundle large:

keep cache server-side and expose API responses.

Do not ship all 500 raw records to browser at startup.

10.65 Server-Side Cache

For Next.js:

Read/in-memory index on server.

Client fetches:

queue
selected patient
selected evidence


not the full corpus.

This keeps interaction fast.

10.66 Supabase Adapter

If implemented, use the repository interfaces.

Concept:

JsonDemoRepository
SupabaseRepository


Same domain outputs.

UI/API should not know storage backend.

This is exactly why Phase 1 created repository abstraction.

10.67 Suggested Future Database Tables

Only if P1 implemented:

panels
patients
records
clinical_events
verified_gaps
evidence_items
priorities
coordinator_actions
benchmark_runs


But P0 does not require migrations.

Don't build tables just because they look professional.

10.68 Persistence Safety

Even with synthetic data:

no secrets inside JSON cache
no API keys
no provider credentials
no environment config
no benchmark hidden labels
no stack traces
no raw LLM prompts if unnecessary

The demo cache should be safe to commit publicly with repository.

10.69 Ground Truth Leakage Audit

This is a hard Phase-10 gate.

Search cache for:

truth_gap_id
scenario_id
expected_result
ground_truth
negative_manifest
difficulty


These should not appear in the runtime cache unless a specific benchmark/evaluation artifact intentionally exposes aggregate methodology, not patient-level shortcuts.

10.70 Cache Tampering Red-Team

Attack:

A

Change Maria priority manually.

Validation should fail against priority artifact/recomputed queue.

B

Change F1 number.

Benchmark hash mismatch.

C

Delete source document.

Cross-reference validation fails.

D

Insert unverified candidate gap.

Schema/domain validation should reject because cache expects VerifiedGap.

E

Swap evidence to another patient.

Ownership validation fails.

F

Change evaluation date.

Version/manifest mismatch.

G

Remove LLM API key.

Judge path still works.

H

Kill Supabase.

P0 judge path still works.

I

Corrupt one byte in records.

Hash failure.

J

Use stale cache from different detector version.

Compatibility check fails.

10.71 Reproducibility Test

From frozen Phase-9 artifacts:

build demo cache A
build demo cache B


Semantic artifacts should match according to frozen canonicalization rules.

If volatile timestamps differ, semantic hashes should still match under the documented hashing policy.

10.72 Performance Benchmark

Measure:

Operation	TargetCache initialize	<500 ms target
Queue repository read	<50 ms
Patient composite read	<100 ms
Evidence read	<100 ms
Evaluation report read	<50 ms
External AI calls	0
External DB calls in P0	0

Again, report actual measurements later.

10.73 Demo Warm/Cold Run

Test both:

Cold

Application process starts and validates cache.

Warm

Cache already indexed.

The judge experience should be acceptable in both.

If cold startup is unexpectedly slow, pre-initialize at application boot/deployment rather than first click.

10.74 Phase 10 Observability

Startup logs:

cache_version
patient_count
artifact_count
validation_duration
hash_validation
index_build_duration
status


Request logs:

repository
operation
duration_ms
result_count


Never log entire raw records during normal use.

10.75 Phase Quantitative Gates
Requirement	GatePatient count	80
Broken cache references	0
Hash mismatches	0
Version mismatches	0
Candidate/unverified gaps in cache	0
Queue inconsistencies	0
Benchmark/report mismatches	0
Impact metrics without classification	0
Ground-truth label leakage	0
LLM dependency for P0 demo	0
External DB dependency for P0 demo	0
Maria pipeline special-casing	0
Cache validation test failures	0
Demo read-path external AI calls	0
P0 demo path available without keys	100%
10.76 Deliverables
lib/cache/
├── manifest.ts
├── schemas.ts
├── canonical-json.ts
├── hashes.ts
├── compatibility.ts
├── builder.ts
├── validate.ts
├── indexes.ts
├── errors.ts
└── version.ts

lib/repositories/
├── panel-repository.ts
├── patient-repository.ts
├── record-repository.ts
├── timeline-repository.ts
├── verified-gap-repository.ts
├── evidence-repository.ts
├── priority-repository.ts
├── evaluation-repository.ts
├── impact-repository.ts
└── json-demo-repository.ts

data/demo-cache/
└── continua-demo-cache-v1/
    ├── manifest.json
    ├── panel.json
    ├── patients.json
    ├── records.json
    ├── timelines.json
    ├── verified-gaps.json
    ├── evidence.json
    ├── priorities.json
    ├── queue.json
    ├── impact.json
    ├── evaluation.json
    └── maria.json

scripts/
├── build-demo-cache.ts
├── validate-demo-cache.ts
├── diff-demo-cache.ts
└── inspect-demo-cache.ts

tests/cache/
├── manifest.test.ts
├── hashing.test.ts
├── compatibility.test.ts
├── cross-reference.test.ts
├── queue-integrity.test.ts
├── benchmark-integrity.test.ts
├── leakage.test.ts
├── offline.test.ts
├── tampering.test.ts
└── maria.test.ts

docs/cache/
├── persistence-design.md
├── demo-cache-contract.md
├── hash-policy.md
├── invalidation-policy.md
├── offline-demo.md
└── recovery.md

10.77 Execution Order

Follow exactly:

10.0 Validate Phase-9 frozen artifacts
        ↓
10.1 Freeze persistence semantics
        ↓
10.2 Freeze demo-cache manifest
        ↓
10.3 Define artifact schemas
        ↓
10.4 Define canonical serialization/hash rules
        ↓
10.5 Implement cache compatibility matrix
        ↓
10.6 Implement JSON demo repositories
        ↓
10.7 Implement source artifact persistence
        ↓
10.8 Implement timeline cache
        ↓
10.9 Implement VerifiedGap cache
        ↓
10.10 Implement evidence cache
        ↓
10.11 Implement priority cache
        ↓
10.12 Derive queue snapshot
        ↓
10.13 Persist benchmark report
        ↓
10.14 Persist classified impact data
        ↓
10.15 Build Maria navigation artifact
        ↓
10.16 Build cross-artifact indexes
        ↓
10.17 Implement cache builder
        ↓
10.18 Implement cache validator
        ↓
10.19 Implement leakage audit
        ↓
10.20 Implement offline mode
        ↓
10.21 API/repository performance tests
        ↓
10.22 Tampering/red-team suite
        ↓
10.23 Reproducibility rebuild
        ↓
10.24 CI integration
        ↓
10.25 Freeze continua-demo-cache-v1

10.78 Acceptance Gates
Gate A: Provenance

Every cached derived object links to frozen upstream versions.

PASS / FAIL

Gate B: Integrity

All schemas, hashes and cross-references validate.

PASS / FAIL

Gate C: Trust

Only VerifiedGap reaches cache/API.

PASS / FAIL

Gate D: Queue

Cached queue is exactly reproducible from frozen priority objects.

PASS / FAIL

Gate E: Benchmark

Evaluation UI data exactly matches frozen Phase-9 results.

PASS / FAIL

Gate F: Claim classification

Measured, modeled, assumptions and external research never mix silently.

PASS / FAIL

Gate G: Offline intelligence

Official demo works without LLM/provider credentials.

PASS / FAIL

Gate H: Database independence

Official demo works without Supabase.

PASS / FAIL

Gate I: Leakage

No patient-level ground-truth shortcut enters runtime cache.

PASS / FAIL

Gate J: Tampering

Modified artifacts are reliably detected.

PASS / FAIL

Gate K: Performance

P0 reads satisfy judge-demo latency requirements.

PASS / FAIL

Gate L: Reproducibility

Rebuilding from identical frozen artifacts yields the same semantic cache.

PASS / FAIL

All 12 pass.

10.79 Exit Report

Actual values only:

CONTINUA DEMO CACHE V1

Cache:
continua-demo-cache-v1

Upstream benchmark:
continua-benchmark-v1

Patients:
80

Artifacts:
XX

CACHE INTEGRITY

Schema failures:               0
Broken references:             0
Hash failures:                 0
Version incompatibilities:     0
Unverified-gap entries:        0
Truth-label leakage:           0

DEMO INDEPENDENCE

LLM API required:              NO
External database required:    NO
Live healthcare system:        NO

PERFORMANCE

Cold initialization:           — ms
Queue read p50:                — ms
Patient read p50:              — ms
Evidence read p50:             — ms

REPRODUCIBILITY

Semantic cache hashes match:   PASS
Queue reproducibility:         PASS
Benchmark report match:        PASS

TAMPER TESTS

Scenarios tested:              XX
Detected:                      XX/XX

Maria demo artifact:
VALID

Overall:
PASS / FAIL

10.80 Failure Conditions

Do not move forward if:

cache contains benchmark labels as shortcuts;
queue is manually curated;
Maria is forced to rank first;
UI metrics differ from Phase-9 results;
modified cache files load silently;
old detector output works with new priority version unnoticed;
official demo requires an LLM API;
Supabase downtime breaks P0;
modeled savings are labeled measured;
candidate gaps enter runtime output;
cached data and benchmark data aren't traceably from the same pipeline run.

These are release blockers.

10.81 Handoff to Phase 11

At this point we have:

Validated Intelligence
+
Immutable Benchmark Snapshot
+
Fast Read Path
+
Evidence
+
Ranked Queue
+
Evaluation Results


Phase 11 receives:

continua-demo-cache-v1
repository interfaces/implementation
panel/patient/timeline artifacts
VerifiedGap cache
evidence cache
priorities
queue
evaluation
impact data

Its job becomes:

Phase 11 — Backend & API Integration

Specifically:

Expose Continua's frozen intelligence through stable, typed, validated API contracts without leaking storage details, hidden benchmark data, or unsafe intermediate states.

Phase 10 Definition of Done

Before freezing Phase 10, perform the harshest practical demonstration:

Remove LLM keys
Disable model client
Disable Supabase
Start Continua
Open panel
Open Top-5 queue
Open a patient
Inspect timeline
Inspect verified gap
Open exact source evidence
Inspect priority reasoning
Open evaluation screen
Open impact screen


If the entire judge-facing intelligence experience still works, then destroy one cache artifact.

The application should refuse to silently serve corrupted data.

If both tests pass, stamp:

CONTINUA PHASE 10: continua-demo-cache-v1 FROZEN

Next: Phase 11 — Backend & API Integration, where this benchmark-qualified snapshot becomes a stable application service boundary for the coordinator UX.
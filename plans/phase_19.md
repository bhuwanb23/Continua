Continua Phase 19: Documentation & Reproducibility

Phase 18 freezes the product experience. Phase 19 ensures that Continua is understandable and independently reproducible without us standing beside the evaluator explaining it.

A beautiful demo with an incomprehensible repository still looks like a hackathon prototype. A repository where the architecture, data, evaluation, safety boundaries, results, and reproduction steps are obvious looks like engineering work.

Phase 19 mission: Package Continua into an evaluator-ready technical artifact that a new developer can clone, run, test, benchmark, inspect, and understand from first principles.

19.0 Phase North Star

An evaluator should be able to follow:

Repository
    ↓
README
    ↓
Understand product in <2 min
    ↓
Run cached demo in <10 min
    ↓
Understand architecture
    ↓
Inspect synthetic dataset
    ↓
Understand benchmark
    ↓
Reproduce deterministic evaluation
    ↓
Understand safety boundaries
    ↓
Inspect results


without needing:

our chat history
oral explanations
private files
knowledge of generator internals
uncommitted environment state

19.1 Inputs

Phase 19 consumes all frozen artifacts:

SPEC v1.x
continua-synth-v1
continua-eval-v1
clinical-event-v1
normalization-v1
extractor-v1
gaps-v1
gap-policy-v1
evidence-v1
VerifiedGap v1
priority-v1
continua-benchmark-v1
continua-demo-cache-v1
continua-api-v1
Coordinator UX v1
Oncology Flagship Experience v1
Proof & Impact Experience v1
continua-safety-v1
continua-reliability-v1
demo release candidate
Visual System v1


No documentation should invent a capability absent from these artifacts.

19.2 Phase Outputs

Phase 19 produces:

Continua Technical Documentation Package v1

and:

Continua Reproducibility Package v1

including:

evaluator README
five-minute quick start
complete setup guide
repository map
architecture package
pipeline documentation
dataset card
benchmark card
evaluation reproduction guide
API reference
safety/Responsible-AI documentation
model system card
limitations
troubleshooting
developer workflow
demo guide
clean-environment validation
documentation link checker
documentation claim audit
reproducibility manifest
19.3 Phase Structure
Subphase	Workstream	Outcome19.0	Documentation freeze	Scope/version selected
19.1	Information architecture	Docs hierarchy
19.2	Evaluator README	Repository front door
19.3	Quick start	Fast demo launch
19.4	Installation	Full environment setup
19.5	Repository guide	Code discoverability
19.6	Architecture	System understandable
19.7	Data documentation	Dataset transparent
19.8	Event/extraction docs	AI boundary documented
19.9	Detector docs	Rules transparent
19.10	Trust docs	Evidence architecture
19.11	Priority docs	Ranking explained
19.12	Benchmark docs	Evaluation reproducible
19.13	API docs	Integration surface
19.14	Safety docs	Responsible-AI package
19.15	Results docs	Claims synchronized
19.16	Demo docs	Judge flow reproducible
19.17	Troubleshooting	Failures recoverable
19.18	Clean clone	Independence tested
19.19	Benchmark reproduction	Metrics regenerated
19.20	Documentation QA	Links/claims/code checked
19.21	Evaluator usability	Stranger test
19.22	Freeze	Documentation Package v1
19.4 Documentation Constitution

Freeze these rules.

Rule 1: README is a map, not a textbook

It should take ~2–4 minutes to understand.

Detailed material belongs under /docs.

Rule 2: One canonical fact

Don't rewrite benchmark results manually across ten documents.

Use exported Phase-14 approved claims.

Rule 3: Commands must actually run

Every command shown in documentation is tested.

Rule 4: Documentation follows the product

Documentation does not redefine behavior.

Rule 5: Limitations are first-class

Not buried.

Rule 6: Separate built vs future

Especially:

EHR integration
real PHI
clinical validation
production deployment
Rule 7: No architecture theater

Document what exists.

Don't add hypothetical:

Kafka
Kubernetes
vector DB
microservices


to architecture diagrams because they look sophisticated.

19.5 Documentation Hierarchy

Recommended structure:

README.md

docs/
├── getting-started/
├── architecture/
├── data/
├── evaluation/
├── api/
├── safety/
├── demo/
├── development/
├── decisions/
└── troubleshooting/


Use one obvious place for each concept.

19.6 README Mission

If a CodeForDFW evaluator opens GitHub, the README should answer immediately:

What is Continua?
Who uses it?
What problem does it solve?
What makes it technically different?
What can I see in the demo?
What did you actually measure?
How do I run it?
Where do I go deeper?
19.7 README Opening

Recommend something close to:

Continua

Continuity intelligence for care coordinators.

Continua reconstructs fragmented synthetic patient records into a longitudinal journey, detects three continuity issues with deterministic rules, verifies every displayed issue against source evidence, and ranks verified coordination work for human review.

Then concise badges/status.

Avoid 12 marketing badges.

19.8 README Hero

Include one canonical current screenshot:

Today / Review First.

Under it:

80 synthetic patients
→ verified continuity issues
→ prioritized review queue
→ source-linked evidence


Use actual values where numerical.

19.9 README Key Differentiator

Make this prominent:

AI extracts facts. Deterministic rules detect gaps.

Then:

Records
→ Structured AI extraction
→ Typed clinical events
→ Deterministic rules
→ Evidence verification
→ Workflow priority


This is the architectural thesis.

19.10 README "Why Not an LLM Wrapper?"

A short section:

AI is used for
structured extraction from messy synthetic documents
AI is not used for
deciding whether a gap exists
verifying evidence
assigning workflow priority
diagnosis
treatment

This instantly answers one of the most likely judge objections.

19.11 README Supported Continuity Issues

Exactly three:

1. Missed specialist follow-up
2. Possible duplicate diagnostic testing
3. Medication-monitoring gap


User-facing wording remains cautious.

No fourth future feature sneaks into present tense.

19.12 README Evaluation Snapshot

Use final Phase-14 approved claims.

Perhaps four values:

Held-out Macro F1
Hard-negative pass rate
Displayed-gap grounding
Top-5 truth precision


Each labeled:

Synthetic benchmark.

No manually typed figures if an export can populate them.

19.13 README Limitations

Visible near evaluation, not at bottom.

Use:

Current scope

synthetic data only
three gap types
no real-EHR integration
no clinical validation
no patient-outcome claims
workflow priority is not clinical risk

Strong.

19.14 README Quick Start

Keep simple:

git clone <repository>
cd continua
npm ci
cp .env.example .env.local
npm run validate
npm run dev


But only if those are the actual tested commands.

If demo mode needs no .env.local, even better.

Don't force users to create empty config unnecessarily.

19.15 Two Run Modes

Document explicitly.

Demo mode
Frozen benchmark-qualified cache
No LLM required
No Supabase required


This is the recommended evaluator path.

Development/live extraction mode

If supported:

requires model API credentials


and clearly isn't required to inspect the product.

19.16 Five-Minute Evaluator Quick Start

Create:

docs/getting-started/evaluator-quickstart.md


Goal:

New evaluator can:

install
run
open Today
open flagship patient
inspect evidence
open Evaluation


within roughly 5–10 minutes depending on package installation.

19.17 Expected Quick-Start Flow
1. Requirements
2. Install
3. Start
4. Open URL
5. Judge path
6. Optional test command


Nothing else.

Do not force architecture reading before running the product.

19.18 System Requirements

Document exact supported development environment.

Include:

Node version
package manager/version
OS assumptions
disk requirement if meaningful
supported browser


Use the versions frozen in Phase 1/release candidate.

Do not say:

Node 18+ probably works

unless tested.

19.19 Environment Variable Documentation

Create table:

Variable	Required in demo	Required live	Secret	PurposeCONTINUA_DEMO_MODE	Yes/default	No	No	Cached demo path
LLM key	No	Yes	Yes	Structured extraction
Supabase variables	No	Optional	Depends	P1 actions

Use actual variable names from implementation.

19.20 .env.example

Must include:

every supported variable
explanatory comment
no secret value
sensible demo defaults

CI should verify docs and environment schema agree.

19.21 Repository Guide

Create:

docs/development/repository-map.md


Show:

app/             Next.js routes/pages
components/      UX
lib/extraction/  structured AI extraction
lib/detectors/   deterministic rules
lib/evidence/    verification
lib/priority/    workflow priority
lib/cache/       demo snapshot
lib/services/    application service layer
data/            synthetic/evaluation/cache
tests/           test suites
scripts/         reproducibility tooling
docs/            technical documentation


One sentence each.

19.22 New Developer Path

Document:

If changing X, go here.

Examples:

Change extraction

lib/extraction/

Add normalization alias

lib/normalization/

Change follow-up detector

lib/detectors/followup/

Investigate evidence

lib/evidence/

Change UI

components/

Rerun benchmark

scripts/benchmark-final...

This dramatically lowers repository friction.

19.23 Architecture Overview

Create:

docs/architecture/system-overview.md


Explain:

Source Records
    ↓
Extraction
    ↓
Canonical Events
    ↓
Detectors
    ↓
Evidence
    ↓
Priority
    ↓
Demo Cache
    ↓
API
    ↓
UX


Each stage links to deeper documentation.

19.24 Architecture Dependency Rule

Document the frozen direction:

raw records
→ extraction
→ normalization
→ detectors
→ evidence
→ priority
→ service/API
→ UI


Forbidden reverse dependencies should also be named.

Example:

detector → raw documents
priority → LLM
UI → benchmark ground truth


None allowed.

19.25 Architecture Decision Records

Phase 1 started ADRs.

By Phase 19, consolidate all material decisions.

Recommended final ADR inventory:

ADR-001 Hybrid AI + deterministic reasoning
ADR-002 Synthetic-only MVP
ADR-003 Fixed benchmark clock
ADR-004 Deterministic demo cache
ADR-005 Workflow priority, not clinical risk
ADR-006 No EHR integration in MVP
ADR-007 Extraction model/provider selection
ADR-008 VerifiedGap trust boundary
ADR-009 JSON demo repository
ADR-010 Cached judge path
ADR-011 API v1 boundary
ADR-012 Public arbitrary upload disabled


Add only decisions actually made.

19.26 Dataset Card

Phase 2 started this.

Final dataset card should capture:

Name

continua-synth-v1

Size

Actual:

patients
documents
providers
cohorts
Construction
scenario-first
event-first
template-rendered
controlled messiness

Supported gap distributions

Actual final counts.

Synthetic status

100%.

Intended use

Continua development/evaluation.

Prohibited interpretation

Not representative epidemiology.

19.27 Dataset Provenance

Document:

seed
generator version
evaluation date
hashes


and command to validate/regenerate if regeneration is supported.

19.28 Dataset Limitations

Explicit:

templated documents
artificial prevalences
limited specialties
controlled alias vocabulary
no real PHI
no claim of real-EHR distribution matching

This becomes part of evaluation credibility.

19.29 Benchmark Card

Create/finalize:

docs/evaluation/benchmark-card.md


Include:

continua-eval-v1

Evaluates
extraction
three gap types
hard negatives
grounding
workflow ranking
Does not evaluate
clinical outcomes
diagnosis
real-world efficacy
real EHR interoperability
population fairness
19.30 Benchmark Partitions

Document actual:

development patient count
held-out patient count
overlap = 0


and stratification approach.

Do not publish hidden final labels unnecessarily.

19.31 Benchmark Freeze Policy

Explain:

Once continua-eval-v1 was frozen, labels/partition/matching semantics no longer changed without requiring a benchmark-version increment.

This strengthens credibility enormously.

19.32 Extraction Documentation

Create/finalize:

docs/architecture/extraction.md


Cover:

document-level extraction
structured schema
prompt contract
provenance
retries
rejection
model/version
extraction metrics

Do not reproduce private API keys/provider secrets.

19.33 Prompt Documentation

We don't need to publish hidden reasoning or system instructions if there's a reason not to.

But technical docs should explain extraction contract:

extract only supported facts cite source span no gap decisions no treatment schema constrained

If repository includes prompt source code anyway, point to it.

19.34 Canonical Event Documentation

Document all 8 types:

referral
consult
followup
lab_result
imaging
medication_start
medication_stop
surgery


For each:

purpose
typed fields
normalization
provenance
example
19.35 Detector Documentation

One page per detector.

Follow-up

Include:

trigger
matching
window
completion
cancellation
temporal boundary
hard negatives
limitations
Duplicate diagnostic
occurrence identity
window
copied record distinction
explicit-series safeguard
Medication monitoring
benchmark-policy registry
start/stop logic
completion
limitation that mappings are benchmark policies
19.36 Detector Pseudocode

Useful.

Short, language-neutral pseudocode is enough.

Example:

for active referral:
    find matching completed specialty event
    within frozen window

    if none and due_date < as_of:
        emit candidate gap


This makes architecture understandable without reading Typescript.

19.37 Evidence Documentation

This deserves excellent docs.

Explain three evidence classes:

Positive source evidence
Absence evidence
Policy evidence


Especially:

Absence evidence means "not found in the available records," not proof an event never happened.

This should appear in docs and product copy.

19.38 VerifiedGap Boundary

Document explicitly:

CandidateGap
      ↓
Evidence verification
      ↓
VerifiedGap


Then:

Only VerifiedGap can enter priority/API/UI.

This is probably the most important safety architecture diagram after the whole pipeline.

19.39 Priority Documentation

Explain:

not clinical risk
permitted factors
excluded factors
deterministic formula
secondary cap
theoretical normalization
priority-band semantics
demographic invariance test

No need for 15 pages.

Formula + rationale + limitations.

19.40 Priority Limitations

Say:

priority-v1 is a prototype workflow heuristic, not clinically validated prioritization.

This protects against misinterpretation.

19.41 Evaluation Results Document

Create:

docs/evaluation/results.md


Generated partly from approved claims.

Include:

extraction
oracle
E2E
hard negatives
grounding
Top-K
baselines
latency
failure categories

Actual values only.

19.42 Evaluation Reproduction Guide

This is essential.

docs/evaluation/reproduce.md


Answer:

How do I regenerate the deterministic evaluation report?

Example flow:

npm ci
npm run validate
npm run validate:benchmark
npm run benchmark:reproduce


Use actual command names.

19.43 Reproduction Levels

Define three tiers.

Tier 1: Product reproduction

Run cached app.

No credentials.

Tier 2: Deterministic benchmark reproduction

Use frozen extraction artifacts.

No model credential.

Expected identical downstream results.

Tier 3: Live extraction reproduction

Rerun external model.

Requires credential.

May not be byte-identical due to hosted-model behavior.

This distinction is critical.

19.44 Expected Deterministic Reproduction

Tier 2 should reproduce:

gap predictions
verified gaps
priority scores
queue
benchmark metrics


exactly or semantically exactly under documented volatile-metadata exclusions.

19.45 Live Extraction Reproduction

Document honestly:

Live hosted-model output may vary.

So users should not expect the same hash.

Instead they can:

run extraction
generate new extractor artifact
evaluate it against frozen benchmark
compare results

Very professional.

19.46 Reproducibility Manifest

Create:

{
  "release": "...",
  "git_commit": "...",
  "node_version": "...",
  "package_manager": "...",
  "lockfile_sha256": "...",

  "spec_version": "...",
  "dataset_version": "...",
  "dataset_sha256": "...",
  "eval_version": "...",
  "eval_sha256": "...",
  "cache_version": "...",
  "cache_sha256": "...",
  "benchmark_run_id": "...",
  "benchmark_sha256": "..."
}


Now the whole submission has identity.

19.47 Reproducibility Command

One command:

npm run reproduce


Ideally performs:

environment validation
↓
artifact validation
↓
deterministic benchmark
↓
compare expected report
↓
production build


Don't include expensive live LLM use.

19.48 Reproduction Output

Example:

Continua Reproduction

Environment             PASS
Dataset                  PASS
Benchmark                PASS
Demo cache               PASS
Gap engine               PASS
Evidence                 PASS
Priority                 PASS
Final metrics match      PASS
Production build         PASS

REPRODUCIBLE


This is fantastic for judges/reviewers.

19.49 Clean-Environment Reproduction

This is the real gate.

Use a fresh environment with:

no node_modules
no .next
no private local files
no model key
no Supabase


Then:

clone/copy clean repo
install exact dependencies
run reproduce
run app


Everything P0 should work.

19.50 Test on Second Machine if Possible

Ideal:

primary development machine
second machine/container

If only one physical machine exists:

fresh container/environment provides good evidence.

No hidden global dependencies.

19.51 Offline Reproduction

After dependencies are installed, P0 clinical intelligence should not need external AI/database services.

Packaging Phase 15+17 established that.

Document clearly.

Don't claim npm install itself works offline unless dependencies are locally cached.

19.52 API Documentation

Final:

docs/api/api-v1.md


Each route:

method
path
purpose
request
response
errors
example


List the synthetic disclaimer contract.

19.53 OpenAPI

If generated:

docs/api/openapi.json


Run validation.

Do not maintain entirely separate hand-written route definitions that drift.

19.54 API Example Consistency

Examples must use:

patient_priority_score
gap_priority_score
workflow priority


No old:

risk_level
priority_score
CRITICAL


if those were replaced.

This is exactly the sort of stale documentation Phase 19 must eliminate.

19.55 Safety Documentation

Package Phase 15 cleanly.

Create a concise starting document:

docs/safety/README.md


Answer:

What is intended use?
What is prohibited?
What can the LLM do?
What can't it do?
How is evidence enforced?
Does it process real PHI?
Is it clinically validated?
What are residual risks?

Then link deep documents.

19.56 Responsible-AI Summary

One page:

AI role
Deterministic-control role
Human role
Evidence discipline
Synthetic-data boundary
Evaluation
Limitations


Mention the framework mapping where actually documented, without implying certification.

19.57 Model/System Card

Create:

docs/safety/system-card.md


Prefer system card over a pure model card because Continua is a hybrid system.

Sections:

system purpose
release version
data
AI component
deterministic components
metrics
intended users
intended use
prohibited use
limitations
failure modes
human oversight
safety controls
19.58 Troubleshooting Guide

Organize by symptom.

Examples:

App won't start

Check Node version/env.

Cache invalid

Run cache validation.

Evaluation shows unavailable

Check frozen report/cache.

Model extraction fails

Only relevant to live development mode.

Demo has no data

Check active cache version.

Local demo works, deployment doesn't

Check Vercel runtime/build/environment variables.

No generic:

reinstall everything.

Give specific routing.

19.59 Troubleshooting Error Codes

Use actual codes:

demo_cache_not_ready
cache_version_mismatch
data_integrity_error
pipeline_error


For each:

meaning
likely cause
safe recovery

19.60 Demo Documentation

Create:

docs/demo/quick-demo.md


for evaluators.

Not the speaker script.

Example:

1. Open Today
2. Review top queue
3. Open Maria/flagship patient
4. Select oncology follow-up issue
5. View evidence
6. Open Evaluation


This helps asynchronous reviewers.

19.61 Separate Presenter Script

Keep:

docs/demo/90-second-script.md


for team.

Don't make README reader consume stage directions.

19.62 Documentation Diagrams

We need a concise set.

Diagram 1

System architecture.

Diagram 2

Trust boundary:

CandidateGap → VerifiedGap

Diagram 3

Evaluation architecture:

Synthetic data → runtime
Ground truth → independent evaluator

Diagram 4

Demo-cache architecture.

Diagram 5

Possible future production path.

Five is enough.

No 22-box spaghetti architecture.

19.63 Diagram Format

Prefer maintainable text/diagram source in repo if it renders reliably, or exported lightweight assets.

Avoid diagrams only stored in a private design tool.

The technical docs must be self-contained.

19.64 Source-Code Links

Architecture docs should link to actual modules.

Example:

Detector interface: lib/detectors/detector.ts

This makes documentation verifiable.

But avoid line-number links that immediately go stale unless tooling keeps them updated.

19.65 Documentation Version

Introduce:

DOCS_VERSION = continua-docs-v1


Final documentation identifies:

release candidate
Git SHA
benchmark run


No ambiguity about which product version docs describe.

19.66 Documentation Header

Deep technical docs can begin:

Applies to:
Continua demo release v1

Last validated:
YYYY-MM-DD


No need on every README fragment, but useful for key specs.

19.67 Documentation Testing

Automate what we can.

Check:

broken internal links
missing referenced files
invalid code-path references
commands exist in package.json
environment variables exist
stale version strings
prohibited claims
old endpoint paths
old priority terminology
19.68 Critical Stale-Term Search

Specifically scan docs for old concepts:

risk_level
risk score
priority_score
45 days overdue
HIPAA compliant
Epic connected
clinically validated
80 ground truth gaps


Every match reviewed.

Historical ADR/spec references can be allowed intentionally.

19.69 Documentation Claim Audit

Every public metric should map to Phase-14:

approved-claims.json


If README says:

Macro F1 0.84


validation checks against canonical output.

19.70 Documentation Link Checker

All:

README → docs
docs → docs
docs → artifacts


must resolve.

No embarrassing:

404 architecture.md


in submission repo.

19.71 Command Verification

Extract documented:

npm run ...


commands.

Check scripts exist.

At minimum:

validate
build
start/dev
demo check
benchmark reproduce
safety tests

must match implementation.

19.72 Code Example Verification

Don't write pseudocode that looks executable unless marked as pseudocode.

Examples of JSON responses should validate against API response schemas when feasible.

Excellent contract discipline.

19.73 README Length

Aim around:

1,500–2,500 words maximum

depending on final repository needs.

Enough to explain.

Not 15,000 words.

Everything else lives behind links.

19.74 First-Screen README Test

Without scrolling far, evaluator should see:

Name
one-line value proposition
screenshot
core differentiation
quick links


Don't begin with installation prerequisites.

Sell the project first.

19.75 README Suggested Structure
# Continua

One-line product statement

[Hero screenshot]

## The problem

## What Continua does

## Demo

## How it works

## Why the architecture is different

## Evaluation

## Safety & limitations

## Quick start

## Repository guide

## Documentation

## Team / acknowledgments


Clean.

19.76 No Huge Competitor Analysis in README

Our research informed the product.

It doesn't belong in the main repository front door.

If useful:

docs/product/positioning.md


But likely unnecessary for judges.

19.77 Evaluator Usability Test

Give repository to someone unfamiliar.

Allow:

10 minutes


No spoken help.

Ask them to:

explain product
run demo
find architecture
find benchmark results
determine whether data are real
determine whether system is clinically validated
identify AI's role
19.78 Passing Answers

They should conclude:

Product

Continuity workbench for coordinators.

Data

Synthetic.

AI

Structured extraction.

Gap decisions

Deterministic.

Trust

Evidence verified.

Priority

Workflow priority.

Validation

Synthetic benchmark, not clinical validation.

If those aren't obvious:

documentation isn't done.

19.79 Reproducibility Drill

Run actual fresh reproduction and record:

environment
start time
install time
validation time
benchmark reproduction time
build time
issues


We don't need speed competition.

We need success.

19.80 Reproduction Failure Classification
REP-001

dependency installation failure

REP-002

environment variable undocumented

REP-003

missing artifact

REP-004

hash mismatch

REP-005

benchmark mismatch

REP-006

build failure

REP-007

demo startup failure

REP-008

undocumented global dependency

REP-009

documentation command wrong

REP-010

platform-specific behavior undocumented

All R0/R1 equivalents fixed.

19.81 Windows Consideration

Because you may develop/use the project on Windows at some point, avoid assuming only bash-specific developer workflows unless documented.

npm run scripts should ideally remain cross-platform.

If shell scripts are necessary:

provide a PowerShell or Node-based alternative where practical.

A Node/TypeScript script is often better for cross-platform reproducibility.

19.82 Paths

Use platform-safe path utilities in scripts.

Never document fragile absolute paths.

Expected:

relative to repository root

19.83 Line Endings

Avoid dataset hash failures caused purely by Windows CRLF vs Linux LF.

Canonical JSON generation should define line endings.

Hash canonical serialized data, not arbitrary editor formatting.

This is a genuine reproducibility detail.

19.84 Locale/Timezone

The benchmark uses:

evaluation_as_of_date = 2026-06-05


Date calculations must remain timezone-independent.

Reproduction in Chennai, Dallas, UTC, etc. must not change results.

Test with at least two timezone environments if practical.

19.85 Randomness

All synthetic generation:

seeded


No machine-specific source.

Dataset regeneration:

same inputs → same semantic dataset.

Document seed.

19.86 Package Lock

Committed.

Reproduction command uses exact-install path appropriate to selected package manager, e.g.:

npm ci


not:

npm install


for evaluator reproducibility, assuming npm remained the frozen package manager.

19.87 Containerized Reproducibility

Optional but strong:

Provide a lightweight container configuration if it does not consume disproportionate time.

For example:

Dockerfile


could give:

docker build
docker run


But this is nice-to-have, not P0.

A clean Node reproduction is enough.

Do not create Docker/Kubernetes theater.

19.88 CI as Reproducibility Proof

CI should execute:

npm ci
npm run validate
npm run reproduce
npm run build


where runtime makes sense.

A green main branch is ongoing evidence that documentation claims aren't stale.

19.89 Artifact Publishing

If benchmark artifacts are large but still manageable:

commit them.

If not:

provide deterministic generation/retrieval within submission constraints.

Given 80 patients and few hundred documents, committing the synthetic artifacts is likely simplest.

No external data download dependency preferred.

19.90 License

Choose an appropriate project license if permitted.

For hackathon/open-source:

common choice may be:

MIT
Apache-2.0


depending on intended future.

Don't put one in automatically without the team deciding.

But absence should be deliberate.

19.91 Third-Party Notices

Document key libraries/services.

Examples may include:

Next.js
Tailwind CSS
selected LLM provider/model
Supabase if P1 used
Vercel

Respect relevant license/attribution requirements.

19.92 Model Service Documentation

Record:

provider
model identifier
purpose
benchmark version
fallback


Do not expose key.

If provider/model changes:

extractor version changes.

19.93 Architecture Reproduction

A technical evaluator should be able to run deterministic modules independently.

For example:

run detectors on canonical fixtures
run evidence verifier
run priority
run benchmark evaluator


Document relevant commands where implemented.

19.94 Maria Golden Case Documentation

Maintain one maria-golden-case.md.

It must reflect current corrected truth.

Remove all stale references to:

45 days overdue if incorrect
invalid tamoxifen monitoring gap
forced rank #1
old priority CRITICAL

This is one of the biggest stale-doc risks.

19.95 Maria Document Content

Include:

synthetic disclaimer
final record sequence
final ground truth
final detected/verified gaps
actual rank
flagship evidence
what the system does not claim

Excellent evaluator case study.

19.96 Documentation Red-Team

Ask:

Could evaluator think data are real?

If yes, fix.

Could evaluator think benchmark = clinical validation?

Fix.

Could evaluator think LLM determines gaps?

Fix.

Could evaluator think priority = patient risk?

Fix.

Could evaluator follow README and hit a broken command?

Fix.

Could evaluator reproduce different metrics because docs refer to wrong snapshot?

Fix.

Could evaluator find old architecture contradicting new architecture?

Delete/archive clearly.

Could evaluator see old Maria numbers?

Search all files.

19.97 Archive Policy

Old design docs are dangerous.

Options:

Delete if obsolete and useless.

Or:

docs/archive/


with obvious header:

Superseded. Not current system documentation.

Current docs must never link obsolete architecture as authoritative.

19.98 Documentation File Package

Target:

README.md
LICENSE?
CONTRIBUTING.md

docs/
├── getting-started/
│   ├── evaluator-quickstart.md
│   ├── installation.md
│   └── run-modes.md
│
├── architecture/
│   ├── system-overview.md
│   ├── clinical-event-model.md
│   ├── extraction.md
│   ├── detectors.md
│   ├── evidence.md
│   ├── priority.md
│   ├── cache.md
│   └── architecture-diagrams.md
│
├── data/
│   ├── dataset-card.md
│   ├── generation.md
│   └── maria-golden-case.md
│
├── evaluation/
│   ├── benchmark-card.md
│   ├── methodology.md
│   ├── results.md
│   ├── reproduce.md
│   ├── baselines.md
│   └── limitations.md
│
├── api/
│   ├── api-v1.md
│   ├── errors.md
│   └── openapi.json
│
├── safety/
│   ├── README.md
│   ├── system-card.md
│   ├── intended-use.md
│   ├── threat-model.md
│   ├── responsible-ai.md
│   └── residual-risks.md
│
├── demo/
│   ├── quick-demo.md
│   ├── 90-second-script.md
│   ├── q-and-a.md
│   └── fallback.md
│
├── development/
│   ├── repository-map.md
│   ├── testing.md
│   ├── commands.md
│   └── releases.md
│
├── troubleshooting/
│   └── README.md
│
└── decisions/
    └── ADR-*.md

19.99 Reproducibility Files

Expected:

artifacts/reproducibility/
├── manifest.json
├── expected-results.json
├── latest-run.json
└── clean-environment-report.md

scripts/
├── reproduce.ts
├── validate-docs.ts
├── validate-links.ts
├── verify-claims.ts
└── verify-reproducibility.ts

tests/documentation/
├── commands.test.ts
├── links.test.ts
├── claims.test.ts
├── versions.test.ts
├── api-examples.test.ts
└── stale-terms.test.ts

19.100 Execution Order

Follow strictly:

19.0 Freeze documentation target release
       ↓
19.1 Inventory existing documentation
       ↓
19.2 Mark stale/superseded docs
       ↓
19.3 Create final information architecture
       ↓
19.4 Write evaluator README
       ↓
19.5 Build five-minute quick start
       ↓
19.6 Finalize installation/run modes
       ↓
19.7 Document repository map
       ↓
19.8 Finalize system architecture
       ↓
19.9 Finalize dataset card
       ↓
19.10 Correct Maria golden-case docs
       ↓
19.11 Document extraction/event model
       ↓
19.12 Document three detectors
       ↓
19.13 Document evidence/trust layer
       ↓
19.14 Document priority model
       ↓
19.15 Finalize benchmark card
       ↓
19.16 Generate results documentation
       ↓
19.17 Write reproduction procedure
       ↓
19.18 Finalize API reference
       ↓
19.19 Finalize safety/system card
       ↓
19.20 Write troubleshooting guide
       ↓
19.21 Finalize demo/judge guides
       ↓
19.22 Generate reproducibility manifest
       ↓
19.23 Implement documentation checks
       ↓
19.24 Run claim/version/stale-term audit
       ↓
19.25 Run clean environment #1
       ↓
19.26 Run clean environment #2/container
       ↓
19.27 Run deterministic benchmark reproduction
       ↓
19.28 Run evaluator usability test
       ↓
19.29 Fix all documentation/reproduction blockers
       ↓
19.30 Run final docs red-team
       ↓
19.31 Freeze Documentation Package v1

19.101 Quantitative Gates
Requirement	GateBroken documentation links	0
Documented commands that fail	0
Missing required env vars	0
Undocumented required secrets	0
Stale benchmark values	0
Stale Maria values	0
Old risk-score terminology in current docs	0
Current docs claiming Epic integration	0
Clinical-validation claims	0
README benchmark values differing from approved claims	0
API examples failing schemas	0
Dataset hashes undocumented	0
Benchmark version ambiguous	0
Clean-environment P0 reproduction	100%
Deterministic benchmark reproduction	100%
Hidden local dependencies	0
Evaluator requiring oral intervention	0 target
19.102 Acceptance Gates
Gate A: Discoverability

A new evaluator understands Continua and knows where to go next from README.

PASS / FAIL

Gate B: Installation

Documented setup succeeds from a clean environment.

PASS / FAIL

Gate C: Product reproduction

Cached P0 application runs without hidden credentials.

PASS / FAIL

Gate D: Benchmark reproduction

Frozen deterministic benchmark results reproduce.

PASS / FAIL

Gate E: Architecture clarity

Technical evaluator can describe AI vs deterministic boundaries accurately.

PASS / FAIL

Gate F: Data transparency

Dataset creation, synthetic nature, distributions, and limitations are documented.

PASS / FAIL

Gate G: Evaluation transparency

Benchmark construction, splits, matching and limitations are documented.

PASS / FAIL

Gate H: Safety transparency

Intended use, prohibited use, human oversight and residual risk are obvious.

PASS / FAIL

Gate I: Claim consistency

All published results agree with canonical approved claims.

PASS / FAIL

Gate J: Cross-platform reproducibility

Supported environment assumptions, especially Windows/Linux differences, are handled/documented.

PASS / FAIL

Gate K: Documentation freshness

No authoritative current document contradicts the release.

PASS / FAIL

All eleven must pass.

19.103 Exit Report

Fill with actual results:

CONTINUA DOCUMENTATION & REPRODUCIBILITY v1

Documentation version:
continua-docs-v1

Release:
<release>

Git commit:
<sha>


DOCUMENTATION

README:                          PASS
Quick start:                     PASS
Architecture package:            PASS
Dataset card:                    PASS
Benchmark card:                  PASS
API reference:                   PASS
Safety/system card:              PASS
Troubleshooting:                 PASS
Demo guide:                      PASS

Broken internal links:              0
Broken documented commands:         0
Stale metric references:            0
Stale Maria references:             0
Unsupported claims:                 0


REPRODUCIBILITY

Clean environment #1:            PASS
Clean environment #2:            PASS

Dataset validation:              PASS
Benchmark validation:            PASS
Cache validation:                PASS

Deterministic metrics match:     PASS
Queue match:                     PASS
Priority match:                  PASS

Production build:                PASS
Cached demo startup:             PASS


ENVIRONMENT

Required demo secrets:              0
LLM required for cached demo:      NO
External DB required:              NO

Hidden machine dependencies:        0


EVALUATOR TEST

Participants:                      X
Ran app without assistance:      X/X
Correct architecture summary:    X/X
Correct synthetic-data answer:   X/X
Correct validation answer:       X/X

Overall:
PASS / FAIL

19.104 Failure Conditions

Do not proceed if:

README commands fail;
a fresh clone can't start;
benchmark instructions produce different deterministic results;
evaluator needs undocumented .env values;
old Maria assumptions remain anywhere authoritative;
docs still say "45 days overdue" when final arithmetic doesn't;
old invalid monitoring scenario resurfaces;
README implies Maria is rank #1 when she isn't;
architecture diagram implies LLM detects gaps;
safety docs suggest HIPAA compliance;
benchmark figures differ across README/UI/report;
current docs and source code disagree about API routes;
Windows/Linux differences can alter benchmark hashes;
hidden local files are required.

These are release blockers.

19.105 Handoff to Phase 20

After Phase 19, the technical project should be independently understandable and reproducible.

Now we transition from:

building Continua

to:

packaging Continua for submission.

Phase 20 receives:

release-quality application
canonical screenshots
reproducible repository
approved claims
benchmark artifacts
system card
architecture diagrams
live demo
fallback demo
90-second story

and creates:

Phase 20 — Submission Package & Compliance

That phase will handle:

official CodeForDFW requirements
submission-field inventory
Devpost/project page
GitHub release
demo URL
repository permissions
video requirements
screenshots
credits
licenses
sponsor/track requirements
external-source verification
team information
final submission checklist
timestamp/evidence that every required field was submitted

so we do not lose after building a strong product because of an avoidable submission mistake.

Phase 19 Definition of Done

Phase 19 is complete when we can send the repository to someone who has never spoken to us and they can independently determine:

What is Continua?

A continuity-intelligence workbench for care coordinators.

What does the AI do?

Structured factual extraction.

What decides the gaps?

Deterministic rules.

Why can a coordinator trust a displayed gap?

It has passed independent evidence verification.

Is the workflow score clinical risk?

No.

Are the patients real?

No, synthetic.

Is the system clinically validated?

No.

Can they run it without an LLM key?

Yes, through the frozen demo snapshot.

Can they reproduce the deterministic evaluation?

Yes.

Can they see exactly what remains unproven?

Yes.

When all ten answers are obvious from the repository itself:

CONTINUA PHASE 19: TECHNICAL DOCUMENTATION + REPRODUCIBILITY PACKAGE v1 FROZEN

Next: Phase 20 — Submission Package & Compliance.
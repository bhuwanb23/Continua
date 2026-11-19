Continua Phase 6: Deterministic Gap Engine

Phase 5 gives Continua a trusted canonical event store. Phase 6 is where those facts become continuity intelligence, but without giving the LLM authority to decide what constitutes a gap.

Phase 6 mission: Build three deterministic, independently testable, evidence-preserving engines that convert canonical clinical events into candidate continuity gaps with zero LLM involvement in the decision itself.

This is one of the most important phases in the entire project.

6.0 North Star

Input:

Canonical Clinical Events


Output:

Candidate Continuity Gaps


Exactly three engines:

1. Missed Specialist Follow-Up
2. Duplicate Diagnostic Testing
3. Medication Monitoring


Architecture:

ClinicalEvent Store
        │
        ├─────────────┐
        │             │
        ▼             ▼
Referral Engine   Duplicate Engine
        │             │
        └──────┬──────┘
               │
               ▼
        Monitoring Engine
               │
               ▼
         Candidate Gaps
               │
               ▼
     Phase 7 Evidence Layer

Hard architectural rule
Phase 6:
NO LLM CALLS


If OPENAI_API_KEY, ANTHROPIC_API_KEY, or any other model credential disappears, Phase 6 must behave identically on the same canonical event store.

6.1 Phase Inputs

Required frozen artifacts:

continua-synth-v1
continua-eval-v1
clinical-event-v1
normalization-v1
extractor-v1
canonical event stores
benchmark-policy definitions
golden Maria canonical events
negative manifest
evaluation matching semantics
fixed evaluation date

Frozen evaluation clock:

2026-06-05


for continua-eval-v1.

6.2 Phase Outputs

Phase 6 should produce:

gaps-v1

containing:

referral/follow-up detector
diagnostic-duplication detector
medication-monitoring detector
common candidate-gap contract
temporal utilities
detector policies
deterministic IDs
detector-level tests
adversarial tests
metamorphic tests
benchmark predictions
measured detector metrics
detector error report
6.3 What Phase 6 Does NOT Do

Phase 6 does not:

diagnose disease
judge whether treatment is medically correct
prescribe anything
determine patient clinical risk
generate natural-language medical advice
prioritize the coordinator queue
calculate business savings
decide whether evidence is safe enough to show
call an LLM
read raw clinical documents
use ground-truth labels at runtime

Especially:

No detector may reopen raw note text.

If a detector needs something that isn't available in canonical events or frozen policy, we fix the representation upstream.

6.4 Phase Structure
Subphase	Workstream	Result6.0	Contract validation	Inputs frozen
6.1	Candidate-gap model	Detector output contract
6.2	Detector framework	Shared pure-function interface
6.3	Temporal engine	Consistent timing
6.4	Referral policy	Follow-up semantics
6.5	Referral detector	Gap engine #1
6.6	Diagnostic identity	Repeat-test semantics
6.7	Duplicate detector	Gap engine #2
6.8	Monitoring policy	Medication-monitoring semantics
6.9	Monitoring detector	Gap engine #3
6.10	Gap deduplication	One issue, one candidate
6.11	Stable identities	Deterministic gap IDs
6.12	Explanations	Structured rationale
6.13	Negative safeguards	Adversarial suppression
6.14	Unit tests	Rule correctness
6.15	Metamorphic tests	Behavioral invariants
6.16	Benchmark run	Measured detector quality
6.17	Failure analysis	False-positive/negative taxonomy
6.18	Red-team	Attempt to break rules
6.19	Maria regression	Golden-case validation
6.20	Freeze	gaps-v1
6.5 Candidate Gap Contract

Phase 6 produces candidate gaps, not final displayed gaps.

Why?

Phase 7 still needs to verify their evidence.

Recommended common envelope:

type CandidateGap = {
  schema_version: "candidate-gap-v1";

  gap_id: string;
  patient_id: string;

  gap_type:
    | "missed_followup"
    | "duplicate_test"
    | "med_monitoring";

  detector_version: "gaps-v1";

  severity:
    | "high"
    | "medium"
    | "low";

  trigger_event_ids: string[];

  evidence_refs: EvidenceRef[];

  temporal_state?: TemporalState;

  metadata: GapMetadata;

  rationale: GapRationale;

  recommended_coordinator_action: CoordinatorAction;
};

6.6 Evidence Reference

Phase 6 does not re-extract evidence.

It inherits provenance from Phase 5.

type EvidenceRef = {
  event_id: string;
  source_doc_id: string;
  source_span: string;
};


Phase 7 verifies these independently.

6.7 Gap-Specific Metadata

Don't force all three gap types into identical fields.

Use a discriminated union.

MissedFollowupMetadata
{
  specialty: string;

  referral_event_id: string;

  referral_date: string;

  expected_window_days: number;

  due_date: string;

  evaluation_as_of_date: string;

  overdue_days: number;

  referral_status: string;
}

DuplicateTestMetadata
{
  diagnostic_kind: "lab" | "imaging";

  normalized_identity: string;

  first_event_id: string;
  second_event_id: string;

  first_date: string;
  second_date: string;

  days_between: number;

  occurrence_count: number;
}

MedicationMonitoringMetadata
{
  medication: string;

  medication_start_event_id: string;

  medication_start_date: string;

  monitoring_target: string;

  monitoring_window_days: number;

  due_date: string;

  evaluation_as_of_date: string;

  overdue_days: number;
}


No ambiguous overdue_days on duplicate-test gaps.

6.8 Temporal-State Contract

Freeze:

OPEN
DUE_SOON
OVERDUE
RESOLVED


However, only states allowed by each detector can become candidate gaps.

For example:

RESOLVED


must never become a displayed missed-follow-up candidate.

6.9 Temporal Engine

Create centralized helpers.

Conceptually:

computeDueDate(triggerDate, windowDays)

computeOverdueDays(
  dueDate,
  evaluationAsOfDate
)

classifyTemporalState(...)


No detector implements its own date arithmetic.

6.10 Fixed Clock Rule

For evaluation:

evaluation_as_of_date = 2026-06-05


Detector accepts clock explicitly:

detectMissedFollowups(
  events,
  asOfDate
)


Forbidden:

new Date()


inside detector code.

This prevents the benchmark from changing over time.

6.11 Exact Date Arithmetic

Freeze a single date library/implementation and unit semantics.

Important:

date + 45 calendar days


must have one definition everywhere.

Tests should include:

month boundary
leap year
end of February
30/31-day months

We need to eliminate off-by-one bugs.

6.12 Detector Interface

Every detector should look conceptually like:

interface GapDetector {
  detect(
    events: ClinicalEvent[],
    context: DetectionContext
  ): CandidateGap[];
}


DetectionContext may include:

evaluation_as_of_date
policy_version
detector_version


It must not include labels.

6.13 Purity Requirement

Given:

same canonical events
+
same policies
+
same as-of date


the detector must produce:

byte-equivalent canonical output


No network.

No randomness.

No wall clock.

No model.

6.14 Engine 1: Missed Specialist Follow-Up

This engine asks exactly one question:

Was an active specialist referral followed by an accepted completion event within the required window?

Nothing more.

6.15 Referral Eligibility

A referral can trigger evaluation if:

event_type = referral


and status is:

placed
unknown


depending on policy.

Do not evaluate:

completed
cancelled


as unresolved referrals.

6.16 Referral Specialty Matching

Normalized specialty is mandatory.

Example:

Medical Oncology
Med Onc
Oncology


all become:

oncology


Matching happens on normalized value.

Not string substring.

6.17 Completion Events

Potential completion events:

consult
followup


But they only count when:

same patient,
matching normalized specialty,
accepted completion status,
date within permitted window.
Accepted consult modes
in-person
telehealth
phone

if Phase 0/4 contract says phone consult qualifies.

Freeze it.

Don't leave this ambiguous.

6.18 Scheduled ≠ Completed

Important:

followup.status = scheduled


does NOT automatically satisfy a referral.

Otherwise:

appointment scheduled
patient never attends


would incorrectly close the loop.

Completion requires:

completed


unless an explicit benchmark policy says otherwise.

6.19 Referral Window

Order of authority:

1

Document-stated:

expected_window_days
window_source = document

2

Frozen benchmark fallback.

Never:

LLM guessed it.

6.20 Missed Follow-Up State Machine

Conceptually:

Referral
   ↓
Cancelled? ─────────────→ RESOLVED/INACTIVE
   │
   No
   ↓
Qualifying completion?
   │
   ├── Yes, within window → RESOLVED
   │
   └── No
        ↓
As-of before due date?
        │
        ├── Far from due → OPEN
        ├── Near due     → DUE_SOON
        └── Past due     → OVERDUE


Only whatever Phase 0 allows as actionable candidates should be emitted.

For hackathon clarity, I recommend:

OVERDUE → actual gap
DUE_SOON → optional workflow warning, not counted as benchmark gap
OPEN → no gap

This prevents future-due events from contaminating gap metrics.

6.21 Referral Severity

Severity is coordinator-workflow severity, not clinical risk.

Freeze explicit logic.

Example benchmark rule:

OVERDUE + oncology/cardiology
→ HIGH

OVERDUE other supported specialty
→ MEDIUM

DUE_SOON warning
→ LOW


But be careful.

Specialty-based weighting should be justified as benchmark/workflow policy, not medical necessity.

6.22 Multiple Referrals

Problem:

Referral oncology 01/01
Referral oncology 01/20
No consult


Should we produce two cards?

Probably not.

Define a consolidation rule.

Recommended:

Group overlapping unresolved referrals by:

patient
specialty
episode window


Keep:

earliest unresolved referral as trigger;
supporting referral event IDs attached.

But if referrals are clearly separate episodes months apart, they may be separate gaps.

Freeze occurrence logic before coding.

6.23 Referral Hard Negatives

Mandatory tests:

R-N1

Correct specialist inside window.

→ no gap

R-N2

Wrong specialty visit.

→ gap remains

R-N3

Referral not due.

→ no benchmark gap

R-N4

Telehealth specialist consult.

→ no gap

R-N5

Referral cancelled.

→ no gap

R-N6

Consult before referral.

→ does not satisfy

R-N7

Scheduled but not completed.

→ does not satisfy

R-N8

Copied note mentions prior consult.

→ must not create new completion occurrence unless canonical reconciliation already established it.

6.24 Maria Follow-Up Case

After Phase-0 correction:

Referral: 2026-04-18
Window: 45 days
Due: ~2026-06-02
As-of: 2026-06-05
Overdue: ~3 days
No qualifying oncology consult


Expected:

missed_followup = TRUE


Not:

45 days overdue.

Demo copy must reflect the corrected semantics.

6.25 Engine 2: Duplicate Diagnostic Testing

This is the detector most likely to produce embarrassing false positives.

Naive rule:

same test twice = duplicate


is unacceptable.

Our question is narrower:

Does the synthetic benchmark contain two distinct diagnostic occurrences considered redundant under the frozen benchmark policy?

This is not a universal medical-necessity judgment.

6.26 Diagnostic Occurrence

Before comparison, ensure we have distinct canonical occurrences.

If the same CBC is:

in a lab report;
mentioned in a PCP note;

that is one clinical occurrence.

Phase 5 reconciliation should have resolved it.

The duplicate detector consumes occurrence-level events.

6.27 Lab Duplicate Identity

Labs compare on:

test_code_normalized


Example:

Complete Blood Count
CBC
CBC w/ diff


if benchmark normalization explicitly declares them equivalent:

cbc


Again, only according to our frozen synthetic benchmark policy.

6.28 Imaging Duplicate Identity

Imaging compares on:

modality_normalized
+
body_region_normalized


Example:

MRI brain
MRI knee


are not duplicates.

6.29 Duplicate Window

Freeze:

default duplicate window = 14 days


if that remains the Phase-0 spec.

Do not dynamically derive N from data.

6.30 Duplicate Rule

For each canonical diagnostic identity:

sort distinct occurrences by date;
compare events inside the duplicate window;
apply exclusion rules;
group repeated occurrences;
emit candidate only if benchmark policy considers it duplicate.
6.31 Series Protection

If either relevant event is explicitly part of:

series_status = explicit_series


the pair should normally be suppressed under our current benchmark.

But only because the source explicitly establishes planned serial monitoring.

Unknown does not mean serial.

6.32 Duplicate Document Protection

If two source documents resolve to the same canonical occurrence:

NO duplicate-test gap


This must be tested aggressively.

This distinction is central to our differentiation:

duplicate records ≠ duplicate care.

6.33 Same-Day Handling

Same test, same provider, same date may be:

duplicate interface artifact;
repeated component result;
same order rendered more than once.

By default:

Treat as same occurrence unless canonical event model establishes distinct independent procedures.

Conservative suppression is better than inventing duplicate care.

6.34 Three-or-More Repeats

Example:

CBC Day 0
CBC Day 5
CBC Day 9


Don't produce:

3 pair alerts


for one obvious episode.

Group into one duplicate-test candidate:

occurrence_count = 3


with relevant event IDs.

One issue, one coordinator card.

6.35 Duplicate Severity

Workflow severity, not clinical severity.

Example frozen policy:

Imaging duplicate → HIGH/MEDIUM depending defined benchmark policy
3+ repeated occurrences → HIGH
2 occurrences <=7d → MEDIUM
2 occurrences 8–14d → LOW


Yet I would keep this simple.

Complex severity formulas increase attack surface without buying much demo value.

6.36 Duplicate Hard Negatives

Required:

D-N1

Explicit weekly CBC.

→ no gap

D-N2

CBCs 21 days apart.

→ no gap

D-N3

MRI brain + MRI knee.

→ no gap

D-N4

Same CBC copied into two documents.

→ no gap

D-N5

Same-day same occurrence.

→ no gap

D-N6

CBC alias pair inside window with no series context.

→ eligible gap

D-N7

3 repeated tests.

→ one grouped candidate

D-N8

Unknown provider.

→ detector still deterministic; provider identity alone cannot determine duplication.

6.37 Maria Duplicate Case

Maria should contain two distinct canonical CBC occurrences, e.g.:

04/20 CBC
04/28 CBC


8 days apart.

The duplicate label must arise from Phase 2's explicit scenario policy, not from a generic claim that any two CBCs within 14 days are clinically unnecessary.

Expected:

duplicate_test = TRUE


with:

days_between = 8
occurrence_count = 2

6.38 Engine 3: Medication Monitoring

This engine requires the most caution because it can look like medical advice.

Our implementation must be framed as:

A synthetic benchmark-policy checker, not a universal medical-guideline engine.

6.39 Monitoring Policy Registry

Keep separate:

lib/policies/monitoring-policy.ts


Example conceptual entry:

{
  medication: "benchmark_medication_x",
  target: "a1c",
  window_days: 90,
  policy_source: "continua-synth-v1 benchmark policy"
}


For medically recognizable drugs, do not imply that these rules are exhaustive or clinically validated.

6.40 Avoid Weak Clinical Mappings

The earlier drafts included questionable examples such as equating:

tamoxifen → annual oncology follow-up


with a medication-monitoring gap.

We already corrected this.

Phase 6 should contain only:

Phase-0-approved mappings,
temporally testable monitoring expectations,
documentation explaining they're benchmark policies.

No spontaneous expansion.

6.41 Monitoring Trigger

A medication_start event triggers evaluation only if:

drug_normalized


exists in the frozen monitoring registry.

Other medications:

ignored by this detector


No inference.

6.42 Medication Stop Protection

If the medication has a matching stop event before the monitoring due date:

NO overdue monitoring gap


according to the frozen benchmark policy.

Matching requires the same normalized medication.

6.43 Monitoring Satisfaction

For each required target:

Find qualifying canonical event within:

[start_date, due_date]


Example target types may be:

lab
consult


depending on Phase 0's corrected policy contract.

Do not overload one lookup path for both.

6.44 Pending Versus Completed

If a note says:

Lab ordered.

but no lab_result exists:

under the current canonical vocabulary, that is not a completed monitoring result.

Do not count planning as completion unless benchmark policy explicitly defines it.

6.45 Monitoring Temporal State

Conceptually:

Medication start
      ↓
Medication supported?
      └─ No → Ignore
      ↓
Stopped before due?
      └─ Yes → No gap
      ↓
Monitoring completed in window?
      └─ Yes → No gap
      ↓
As-of past due?
      ├─ Yes → OVERDUE candidate
      └─ No  → Not a benchmark gap


This fixes the previous "not yet due but still labeled a gap" mistake.

6.46 Monitoring Severity

Again, avoid pretending it's clinical risk.

Possible benchmark workflow logic:

0–30d overdue → LOW
31–90d → MEDIUM
>90d → HIGH


But only if Phase 0 froze comparable thresholds.

If not, use a simpler policy derived solely from overdue proportion/window.

No medication-specific "high-risk" labeling unless explicitly part of frozen benchmark policy.

6.47 Monitoring Hard Negatives

Mandatory:

M-N1

Monitor completed inside window.

→ no gap

M-N2

Alias result.

HbA1c normalized to expected target.

→ no gap

M-N3

Medication stopped before due.

→ no gap

M-N4

Monitoring one day before deadline.

→ no gap

M-N5

Monitoring one day after deadline.

Behavior according to frozen as-of and gap rule.

M-N6

Medication not in registry.

→ ignored

M-N7

Wrong lab exists.

→ gap remains

M-N8

Medication explicitly not started.

No start event should exist after Phase 5, therefore detector has nothing to evaluate.

6.48 Candidate Gap Rationale

Phase 6 needs a structured rationale without using an LLM.

Example:

{
  "rule": "referral_without_matching_completion",
  "facts": {
    "specialty": "oncology",
    "referral_date": "2026-04-18",
    "due_date": "2026-06-02",
    "evaluation_as_of_date": "2026-06-05",
    "qualifying_completion_count": 0
  }
}


Then Phase 11/12 can render:

Oncology referral due June 2; no completed oncology consultation was found by June 5.

Much stronger than an opaque generated explanation.

6.49 Don't Use LLM Explanations Yet

We don't need an LLM to turn:

3 days overdue


into:

3 days overdue.

Use deterministic templates.

LLM narration can be considered later for presentation if useful, but the core explanation should remain reproducible.

6.50 Coordinator Actions

Freeze a mapping by gap type.

Missed follow-up
Verify referral status and coordinate follow-up.

Duplicate test
Review repeat test history and confirm whether the repeat was intended.

Monitoring
Verify monitoring status and coordinate follow-up if unresolved.


These are workflow actions, not treatment instructions.

6.51 Forbidden Action Language

Unit-test against:

diagnose
treat
prescribe
discontinue
administer
medically necessary
clinically indicated

and unapproved order formulations.

Use:

verify
review
contact
coordinate
confirm
reconcile
6.52 Gap IDs

Deterministic.

Suggested identity inputs:

Follow-up
patient
gap type
referral occurrence
specialty

Duplicate
patient
gap type
diagnostic identity
group occurrence

Monitoring
patient
gap type
medication-start occurrence
monitoring target


Same inputs → same gap_id.

6.53 Gap Deduplication

Detector outputs should be consolidated before Phase 7.

Rules:

one unresolved referral episode → one candidate;
one repeated diagnostic episode → one candidate;
one medication/monitoring target pair → one candidate.

Do not overwhelm the coordinator with one card per event pair.

6.54 Cross-Detector Separation

Do not merge different gap types.

Example:

missed follow-up + monitoring gap


can both exist for same patient.

They represent different coordination issues.

Phase 8 handles patient-level aggregation.

6.55 Pure Detector Unit Tests

Each detector needs direct canonical-event fixtures.

No extractor.

No database.

No network.

Example:

events fixture
+
fixed context
↓
detector
↓
expected candidate gaps


These should be exceptionally fast.

6.56 Mutation Tests

Very important.

Referral mutation

Original:

No oncology consult
→ GAP


Add qualifying consult:

→ NO GAP

Specialty mutation

Change consult:

oncology → cardiology


Gap should return.

Duplicate mutation

Move second CBC:

Day 8 → Day 20


Gap disappears.

Series mutation

Change:

unknown → explicit_series


Duplicate gap disappears.

Monitoring mutation

Add required monitoring result inside window.

Gap disappears.

Stop mutation

Add medication stop before due date.

Monitoring gap disappears.

These prove causal rule behavior.

6.57 Metamorphic Tests

These test relationships rather than exact output.

MR-01

Adding irrelevant unrelated event must not change existing gaps.

MR-02

Reordering input events must not change output.

MR-03

Duplicating the same canonical source occurrence must not create a duplicate-test gap.

MR-04

Moving qualifying follow-up earlier inside window cannot turn a resolved referral into unresolved.

MR-05

Increasing overdue duration cannot turn an overdue case into non-overdue.

MR-06

Adding valid monitoring cannot create a monitoring gap.

MR-07

Changing provider display formatting must not change detection after normalization.

MR-08

Changing fixture aliases must not affect rules.

This is excellent engineering evidence.

6.58 Property-Based Testing

If the TypeScript stack supports it conveniently, consider a property-testing library such as fast-check.

Useful properties:

detector output deterministic
gap IDs unique
no NaN
no Infinity
overdue_days >= 0
days_between >= 0
evidence ref IDs exist


But don't introduce a heavy dependency if ordinary parameterized tests suffice.

6.59 Benchmark Evaluation Modes

Phase 6 needs two separate runs.

Mode A: Oracle-event evaluation

Use Phase 3 canonical/gold events rather than LLM-extracted events.

Purpose:

Test rule engines themselves.

If rule F1 is poor here, Phase 6 is wrong.

Mode B: Extracted-event evaluation

Use Phase 5 extractor-v1 event store.

Purpose:

Test real pipeline behavior through extraction + detection.

This distinction is worth a lot.

6.60 Why Oracle Evaluation Matters

Suppose:

Oracle-event detector F1 = 0.97
Extracted-event pipeline F1 = 0.82


Then bottleneck is likely extraction.

But if:

Oracle = 0.78
Extracted = 0.76


the problem is detector policy/rules.

Without oracle evaluation, we'd guess.

6.61 Primary Phase 6 Metrics

For each detector:

TP
FP
FN
precision
recall
F1

Aggregate:

Macro F1
Micro F1
Hard-negative pass rate

Report for:

Oracle events
Extracted events

separately.

6.62 Additional Metrics

Also record:

Candidate gaps per patient

Watch for alert explosion.

Duplicate candidate rate

How many detector outputs are consolidated?

Temporal-error count

Off-by-one/window issues.

Determinism

Repeated run comparison.

6.63 Phase 6 Targets

Targets are not claims.

Oracle-event target

Because rules operate on perfect canonical truth, aim high:

Metric	TargetPrecision/type	≥0.95
Recall/type	≥0.95
Macro F1	≥0.95
Hard-negative pass	≥0.95

If oracle performance is substantially below that, our rules or benchmark semantics are inconsistent.

Extracted-event pipeline target

Maintain master targets:

Metric	TargetPrecision/type	≥0.80
Recall/type	≥0.70
Macro F1	≥0.75
Hard-negative pass	≥0.90

Again, actual measured result gets reported.

6.64 Phase 6 Error Taxonomy

Expand Phase 3 categories.

Follow-up
FU-FP-01

Scheduled counted as completed.

FU-FP-02

Wrong specialty counted.

FU-FP-03

Cancelled referral counted.

FU-FN-01

Unresolved referral missed.

FU-FN-02

Window date calculated incorrectly.

Duplicate
DU-FP-01

Explicit serial monitoring flagged.

DU-FP-02

Copied document treated as second occurrence.

DU-FP-03

Different imaging region merged.

DU-FN-01

Alias normalization failed.

DU-FN-02

Repeated episode grouped incorrectly.

Monitoring
MM-FP-01

Medication stopped but still flagged.

MM-FP-02

Monitoring result present but missed.

MM-FP-03

Not-yet-due case flagged.

MM-FN-01

True overdue monitoring missed.

MM-FN-02

Monitoring-target normalization failed.

6.65 Error Analysis Procedure

For every FP/FN:

Prediction error
      ↓
Oracle or extracted mode?
      ↓
Canonical event correct?
      ↓
Policy/rule correct?
      ↓
Temporal calculation?
      ↓
Normalization?
      ↓
Dedup/reconciliation?
      ↓
Root cause code


This prevents blind patching.

6.66 No Patient-Specific Exceptions

Code review/static checks should look for:

P-001-maria
Maria
fixture_key


inside detector implementation.

Expected:

0


Tests may reference Maria.

Production detector code may not.

6.67 No Label Imports

Detector package must not import:

ground_truth.json
negative_manifest.json
truth-events


Evaluation scripts can.

Runtime cannot.

Hard gate.

6.68 Phase 6 Red-Team

Attack aggressively.

Attack A

Referral followed by wrong specialist.

Does system incorrectly close it?

Attack B

Referral scheduled but not completed.

Attack C

Referral 1 day before due.

No overdue gap.

Attack D

Referral 1 day after due.

Correct overdue logic.

Attack E

Repeated CBC labeled weekly monitoring.

No duplicate.

Attack F

Same test copied into three documents.

No duplicate care.

Attack G

MRI brain / MRI knee.

No duplicate.

Attack H

Medication stopped before due.

No monitoring gap.

Attack I

Required lab exists using alias.

No gap.

Attack J

Input event order randomly shuffled 100 times.

Same output.

Attack K

LLM API disabled.

Same output.

Attack L

Clock changed in system OS.

Evaluation result stays identical because fixed as-of date is injected.

6.69 Performance Benchmark

Phase 6 is local deterministic computation and should be fast.

Measure:

single patient detector latency
80-patient panel latency
memory usage


No need to chase microseconds.

Requirement:

Gap engines must be negligible relative to extraction latency.

If detection takes seconds for 80 patients, something is architecturally wrong.

6.70 Observability

Every detector run can report:

patients processed
events inspected
referrals evaluated
diagnostics grouped
medications evaluated
candidate gaps emitted
candidates consolidated
runtime_ms
policy_version
detector_version
as_of_date


No raw clinical text in regular logs.

6.71 Detector Versioning

Freeze:

DETECTOR_VERSION = gaps-v1


Individual internal labels:

followup-v1
duplicate-v1
monitoring-v1


This lets error reports identify exactly which rule produced an output.

6.72 Policy Versioning

Introduce:

GAP_POLICY_VERSION = gap-policy-v1


This is distinct from detector code version.

Why?

The implementation may remain identical while benchmark policy thresholds change in a future version.

For continua-eval-v1, policy must remain frozen.

6.73 Expected File Structure
lib/detectors/
├── detector.ts
├── types.ts
├── context.ts
├── common/
│   ├── dates.ts
│   ├── evidence.ts
│   ├── ids.ts
│   └── dedupe.ts
│
├── followup/
│   ├── detector.ts
│   ├── matching.ts
│   ├── consolidation.ts
│   └── policy.ts
│
├── duplicate/
│   ├── detector.ts
│   ├── identity.ts
│   ├── grouping.ts
│   ├── exclusions.ts
│   └── policy.ts
│
└── monitoring/
    ├── detector.ts
    ├── registry.ts
    ├── completion.ts
    └── policy.ts

lib/domain/
├── candidate-gap.ts
└── gap-metadata.ts

tests/detectors/
├── followup.test.ts
├── duplicate.test.ts
├── monitoring.test.ts
├── temporal.test.ts
├── identifiers.test.ts
├── consolidation.test.ts
├── metamorphic.test.ts
├── adversarial.test.ts
├── leakage.test.ts
└── maria.test.ts

scripts/
├── run-detectors.ts
├── eval-detectors.ts
├── inspect-gap-errors.ts
└── benchmark-detectors.ts

docs/detectors/
├── detector-design.md
├── followup-policy.md
├── duplicate-policy.md
├── monitoring-policy.md
├── severity-policy.md
├── benchmark-results.md
└── limitations.md

artifacts/detectors/
└── <run-id>/
    ├── metadata.json
    ├── candidates.json
    ├── oracle-results.json
    ├── extracted-results.json
    ├── negatives.json
    └── error-cases.json

6.74 Phase 6 Execution Order

Execute in this exact sequence:

6.0 Validate Phase-5 handoff
       ↓
6.1 Freeze CandidateGap v1
       ↓
6.2 Build shared temporal utilities
       ↓
6.3 Build stable gap identifiers
       ↓
6.4 Implement detector interface
       ↓
6.5 Implement follow-up engine
       ↓
6.6 Unit-test follow-up engine
       ↓
6.7 Implement diagnostic identity/grouping
       ↓
6.8 Implement duplicate engine
       ↓
6.9 Unit-test duplicate engine
       ↓
6.10 Freeze monitoring registry
       ↓
6.11 Implement monitoring engine
       ↓
6.12 Unit-test monitoring engine
       ↓
6.13 Candidate consolidation
       ↓
6.14 Deterministic rationale templates
       ↓
6.15 Coordinator action templates
       ↓
6.16 Cross-detector integration tests
       ↓
6.17 Hard-negative suite
       ↓
6.18 Mutation/metamorphic suite
       ↓
6.19 Maria regression
       ↓
6.20 Oracle-event benchmark
       ↓
6.21 Error analysis
       ↓
6.22 Fix systemic detector issues
       ↓
6.23 Freeze gaps-v1
       ↓
6.24 Extracted-event benchmark
       ↓
6.25 Red-team
       ↓
6.26 Publish Phase-6 report

6.75 Phase 6 Acceptance Gates
Gate A: Determinism

Same canonical input + context → identical gaps.

PASS / FAIL

Gate B: LLM Independence

All detectors run with no LLM/provider credentials.

PASS / FAIL

Gate C: Raw-Text Independence

No detector opens raw record text.

PASS / FAIL

Gate D: Follow-Up Engine

Positive and adversarial referral scenarios pass.

PASS / FAIL

Gate E: Duplicate Engine

Distinct clinical occurrences and copied records are correctly separated.

PASS / FAIL

Gate F: Monitoring Engine

Only frozen benchmark-policy mappings are evaluated, with correct temporal logic.

PASS / FAIL

Gate G: Negative Performance

Hard-negative safeguards meet the frozen acceptance threshold.

PASS / FAIL

Gate H: Oracle Benchmark

Rule performance meets release expectations or failures are explicitly accepted/documented.

PASS / FAIL

Gate I: Evidence Carry-Through

Every candidate gap preserves valid event/source references for Phase 7.

PASS / FAIL

Gate J: Safety

No clinical risk, diagnosis, treatment, or unsupervised action claims.

PASS / FAIL

Gate K: Leakage

No ground-truth/patient-specific runtime shortcuts.

PASS / FAIL

Gate L: Maria

Corrected golden case produces exactly the expected three candidate types before Phase 7 verification.

PASS / FAIL

All 12 must pass.

6.76 Phase 6 Benchmark Report

Do not fill these values until measured.

CONTINUA GAP ENGINE V1

Detector:
gaps-v1

Policy:
gap-policy-v1

Evaluation:
continua-eval-v1

As-of:
2026-06-05


ORACLE EVENT BENCHMARK

                    Precision   Recall   F1
Missed follow-up       —          —      —
Duplicate testing      —          —      —
Medication monitoring  —          —      —

Macro F1:              —
Micro F1:              —
Hard-negative pass:    —


EXTRACTOR-V1 PIPELINE

                    Precision   Recall   F1
Missed follow-up       —          —      —
Duplicate testing      —          —      —
Medication monitoring  —          —      —

Macro F1:              —
Micro F1:              —
Hard-negative pass:    —


FAILURES

Follow-up FP:           —
Follow-up FN:           —
Duplicate FP:           —
Duplicate FN:           —
Monitoring FP:          —
Monitoring FN:          —


PERFORMANCE

Single patient p50:    — ms
Panel latency:         — ms

LLM calls during gap detection:
0


That final line is worth showing judges.

6.77 Phase 6 Failure Conditions

Do not proceed if:

oracle-event F1 is poor because detector semantics are still ambiguous;
same dataset produces different outputs;
a detector requires raw-note inspection;
a detector calls an LLM;
future-due monitoring gets labeled overdue;
copied documents generate duplicate-test alerts;
completed referrals generate missed-follow-up alerts;
patient-specific exceptions exist;
candidate gaps cannot trace back to source events;
actions drift into clinical treatment advice;
Maria's result requires special-casing.

Any of those indicate architectural failure, not cosmetic bugs.

6.78 What Success Looks Like

At the end of Phase 6, we should be able to take:

Maria's canonical events


and, without an LLM, without raw notes, and without knowing she's Maria, produce:

Candidate #1
Missed specialist follow-up
Trigger: oncology referral
Status: overdue
Evidence ref: referral event

Candidate #2
Duplicate diagnostic test
Identity: CBC
Occurrences: 2
Interval: 8 days
Evidence refs: lab events

Candidate #3
Medication monitoring
Trigger: corrected eligible medication start
Monitoring target: frozen benchmark target
Status: overdue
Evidence ref: medication/lab event(s)


and then perform the same reasoning across all 80 patients.

That is the first moment Continua truly becomes an intelligence system rather than an extraction demo.

6.79 Handoff to Phase 7

Phase 7 receives:

gaps-v1
gap-policy-v1
deterministic candidate gaps
trigger event IDs
inherited source-document references
structured rationales
coordinator-action templates
oracle benchmark results
extracted-pipeline benchmark results
hard-negative results
Phase 6 error taxonomy
Maria's three candidate gaps

Phase 7's job is not to decide whether the rules were clinically right.

Its job is:

Prove that every surfaced gap is supported by valid, inspectable evidence, suppress anything that cannot be grounded, and create the trust contract between Continua's reasoning engine and the coordinator.

Phase 6 Definition of Done

Phase 6 is finished only when these questions all have unambiguous answers:

Does the LLM decide whether a care gap exists?

No.

Can the gap engines run completely offline once canonical events exist?

Yes.

Are all three gap types defined mathematically and temporally?

Yes.

Can copied records be distinguished from duplicate care?

Yes.

Are not-yet-due events prevented from becoming overdue gaps?

Yes.

Are completed/cancelled referrals handled correctly?

Yes.

Can every candidate gap identify which canonical events caused it?

Yes.

Have both perfect-event and real-extractor pipelines been benchmarked?

Yes.

Are hard negatives explicitly tested?

Yes.

Does Maria work without any Maria-specific logic?

Yes.

Only then stamp:

CONTINUA PHASE 6: gaps-v1 + gap-policy-v1 FROZEN

Next master-plan phase: Phase 7 — Evidence & Trust Layer, where candidate gaps become verified, inspectable claims suitable for a coordinator-facing product.
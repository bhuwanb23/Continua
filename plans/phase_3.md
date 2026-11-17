Continua Phase 3: Ground Truth & Benchmark Construction

Phase 2 freezes the synthetic world. Phase 3 now freezes the truth about that world and the rules for measuring Continua against it.

This phase is critical because later we want to say:

“Continua achieved X precision, Y recall, Z F1, and 100% evidence-grounding accuracy on continua-eval-v1.”

For that sentence to mean anything, the benchmark must be locked before we optimize the extraction/detection pipeline against it.

3.0 Phase Mission

Build a rigorous, reproducible evaluation system containing:

frozen ground-truth gaps,
frozen non-gap/adversarial cases,
extraction gold labels,
benchmark partitions,
exact prediction-to-truth matching,
scoring metrics,
temporal semantics,
grounding evaluation,
error taxonomy,
leakage controls,
benchmark integrity hashes,
machine-readable evaluation contracts.
Input

Phase 2 outputs:

continua-synth-v1
continua-eval-v1
80 patients
400–600 documents
truth-event manifest
positive gap manifest
negative manifest
12-patient extraction-gold subset
Maria golden case
dataset hashes

Output

CONTINUA-EVAL-V1: FROZEN BENCHMARK

Phase 4+ may consume it.

They may not silently change it.

3.1 Why Phase 3 Is Separate From Phase 2

This separation matters.

Phase 2 answers:

What happened in our synthetic healthcare world?

Phase 3 answers:

How exactly will we determine whether Continua understood that world correctly?

Those must not be the same process.

Otherwise:

Generator
→ Ground truth
→ Detector logic


can accidentally share assumptions and inflate performance.

We want:

Synthetic World
        │
        ├──────────→ Ground Truth
        │
        └──────────→ Continua
                         ↓
                    Predictions

Ground Truth
        +
Predictions
        ↓
Independent Evaluator
        ↓
Metrics

3.2 Phase 3 Subphase Map
Subphase	Workstream	Outcome3.0	Handoff validation	Phase 2 input verified
3.1	Benchmark constitution	Evaluation rules frozen
3.2	Gap truth schema	Canonical gap labels
3.3	Negative truth schema	Explicit non-gap labels
3.4	Event extraction gold	Extraction benchmark
3.5	Temporal truth model	Exact timing semantics
3.6	Gap identity	Unique occurrence matching
3.7	Benchmark partitions	Dev/test boundaries
3.8	Matching algorithm	Prediction↔truth evaluator
3.9	Detection metrics	P/R/F1 etc.
3.10	Extraction metrics	Event accuracy
3.11	Grounding metrics	Citation correctness
3.12	Priority evaluation	Ranking-quality tests
3.13	Latency evaluation	Performance measurement
3.14	Failure taxonomy	Every error classified
3.15	Leakage controls	Benchmark independence
3.16	Statistical reporting	Honest interpretation
3.17	Benchmark runner	Deterministic evaluator
3.18	Integrity/hashing	Frozen version
3.19	Red-team	Benchmark attacked
3.20	Release gate	continua-eval-v1 frozen
3.3 Phase 3 Ground Rules

Five rules are absolute.

Rule 1: Labels don't move to make metrics improve

If Continua gets:

F1 = 0.68


we fix Continua.

We don't redefine the answer until it becomes:

F1 = 0.85

Rule 2: Ground truth never comes from pipeline output

Forbidden:

Run Continua
↓
Inspect outputs
↓
Create labels matching those outputs


Labels derive from Phase 2's scenario truth.

Rule 3: Detection and extraction are scored separately

Bad extraction can cause a missed gap.

We must know whether failure happened in:

document comprehension


or:

gap reasoning


So we evaluate both.

Rule 4: Hard negatives matter as much as positives

A detector that flags everything may have incredible recall and disastrous precision.

Therefore:

True negative scenarios are first-class benchmark assets.

Rule 5: Benchmark results always identify their version

Never report:

F1 = 0.84.

Report:

F1 = 0.84 on continua-eval-v1 using extractor-vX, gaps-vY.

3.4 Ground-Truth Gap Contract

Phase 2's manifest should become a strict Phase 3 contract.

Recommended:

{
  "truth_gap_id": "deterministic-uuid",
  "patient_id": "uuid",
  "patient_fixture_key": "P-001-maria",

  "gap_type": "missed_followup",

  "trigger": {
    "event_id": "uuid",
    "event_type": "referral",
    "date": "2026-04-18"
  },

  "identity": {
    "specialty": "oncology"
  },

  "temporal": {
    "window_days": 45,
    "due_date": "2026-06-02",
    "evaluation_as_of_date": "2026-06-05",
    "overdue_days": 3
  },

  "required_evidence_doc_ids": ["uuid"],
  "acceptable_evidence_doc_ids": ["uuid"],

  "scenario_id": "T02",
  "difficulty": "MEDIUM",

  "rationale": "Oncology referral was placed and no qualifying oncology consultation occurred within the 45-day window.",

  "dataset_version": "continua-synth-v1",
  "eval_version": "continua-eval-v1"
}


Notice an important correction:

Maria is not 45 days overdue.

Her referral window is 45 days.

Given:

Referral: 2026-04-18
Window:   45 days
Due:      approximately 2026-06-02
As-of:    2026-06-05


she is roughly 3 days overdue, according to the exact arithmetic frozen in Phase 0.

That distinction must survive forever.

3.5 Gap-Type-Specific Identity

We shouldn't match only:

patient + gap_type


because one patient can have two referrals or duplicate-test situations.

Each truth gap needs identity.

Missed follow-up identity
patient
+ referral event
+ normalized specialty
+ due window

Duplicate-test identity
patient
+ normalized diagnostic identity
+ relevant event pair/group


For labs:

cbc + date1 + date2


For imaging:

MRI + brain + date1 + date2

Monitoring identity
patient
+ medication start event
+ monitoring target
+ window


This allows multiple same-type gaps in one patient without evaluation ambiguity.

3.6 Negative Truth Contract

This is where our benchmark can become unusually good.

Recommended:

{
  "negative_id": "uuid",
  "patient_id": "uuid",
  "detector_target": "duplicate_test",
  "scenario_family": "explicit_serial_monitoring",

  "relevant_event_ids": ["uuid", "uuid"],
  "relevant_doc_ids": ["uuid", "uuid"],

  "expected_result": "NO_GAP",

  "reason": "Source explicitly documents weekly CBC monitoring.",

  "difficulty": "HARD",
  "eval_version": "continua-eval-v1"
}


Every hard-negative family should have multiple instances where possible.

3.7 Minimum Negative Coverage

I would aim for at least:

3 examples per hard-negative family.

With 15 possible families:

≈45 adversarial negative cases


Not necessarily 45 separate patients.

One patient may contain multiple scenarios.

Required families

At minimum:

completed referral
wrong-specialty encounter
referral not yet due
telehealth completion
explicit serial lab testing
repeated lab outside duplicate window
imaging same modality/different region
medication stopped before due
monitoring alias
monitoring completed just inside window

Strongly recommended:

referral cancelled
duplicate document artifact
partial date
missing provider
ambiguous normalization
3.8 Extraction Gold Benchmark

Gap detection depends on structured events.

Therefore create a separate frozen event-level evaluation.

Phase 2 selected:

12 patients.

Now fully annotate them.

Gold event shape
{
  "gold_event_id": "uuid",
  "patient_id": "uuid",
  "source_doc_id": "uuid",

  "event_type": "referral",
  "date": "2026-04-18",
  "date_precision": "day",

  "normalized": {
    "specialty": "oncology",
    "status": "placed",
    "expected_window_days": 45
  },

  "evidence": {
    "source_span": "Referral to Medical Oncology...",
    "required": true
  }
}

3.9 Extraction Gold Scope

Annotate only fields downstream reasoning genuinely depends on.

Do not waste time evaluating prose quality.

Score:

event existence
event type
date
date precision
normalized specialty
normalized test
normalized medication
event status
evidence span
source document identity

Do not score things like:

Was the generated summary elegant?

That's irrelevant to detector correctness.

3.10 Extraction Gold Distribution

12 patients:

Oncology

4 including Maria.

Cardiology / specialty referral
Chronic/metabolic
Mixed multispecialty
Hard-negative focused

Target:

100–150 gold events depending on Phase 2 output.

3.11 Difficulty Tiers

Every event/gap scenario gets:

EASY
MEDIUM
HARD

EASY
explicit terminology
simple date
obvious source

Example:

Referral to Cardiology on 04/12/2026.

MEDIUM
abbreviation
multiple providers
terminology alias

Example:

Cards referral placed.

HARD
multiple records
temporal reasoning
distractors
aliasing
copied-forward text
negative scenario

This enables later analysis like:

Macro F1:
Easy   0.xx
Medium 0.xx
Hard   0.xx


Far more informative than one aggregate number.

3.12 Evaluation Partition Strategy

We need to prevent ourselves from continually tuning to the entire benchmark.

Since the dataset is small, use:

Development partition

Approximately:

25% of benchmark scenarios

Visible during implementation.

Used for:

debugging
prompt development
rule debugging
Final evaluation partition

Approximately:

75%

Labels shouldn't routinely guide development.

Used for:

final reported benchmark.

Important:

Split by patient, not document.

Otherwise the same patient's context can leak across partitions.

3.13 Stratified Split

The split must preserve:

three gap types
positives
negatives
three difficulty levels
major cohorts

Don't random-split blindly.

Example conceptual structure:

DEV: 20 patients
FINAL: 60 patients


The exact distribution comes from the frozen dataset.

Maria can remain in dev/demo because she is our product demonstration patient.

Do not report Maria's memorized performance as evidence of generalization.

That's why final evaluation primarily depends on the held-out remainder.

3.14 Important Benchmark Reporting Decision

I would actually report two sets:

Demo benchmark

Whole synthetic panel.

Useful for product visualization.

Held-out evaluation

The 60-ish final patients.

This should be the number emphasized when discussing technical quality.

Example:

"On the held-out partition of continua-eval-v1, Continua achieved..."

That's much stronger.

3.15 Prediction Contract

Before implementing detectors, define what evaluator expects from them.

{
  "prediction_id": "uuid",
  "patient_id": "uuid",
  "gap_type": "missed_followup",

  "trigger_event_ids": ["uuid"],

  "identity": {
    "specialty": "oncology"
  },

  "evidence": [
    {
      "doc_id": "uuid",
      "quoted_span": "...",
      "verification_method": "exact",
      "verification_score": 1.0
    }
  ],

  "detector_version": "gaps-v1"
}


Evaluator consumes this.

It does not care about the UI.

3.16 Prediction-to-Truth Matching

Use one-to-one matching.

A prediction P matches truth T iff:

Required
P.patient_id == T.patient_id


AND

P.gap_type == T.gap_type


AND

gap identity matches


AND

sufficient evidence overlap

3.17 Evidence Overlap

Don't require every evidence document to be identical.

Suppose a truth gap uses:

referral document R4


and the predictor cites:

R4 + PCP follow-up note


That's acceptable if R4 is included and valid.

Define:

required_evidence ⊆ predicted_valid_evidence


or a gap-specific equivalent.

3.18 One-to-One Assignment

Suppose two predictions match the same truth.

Only one gets TP status.

Second becomes:

FP_DUPLICATE_PREDICTION


This prevents systems from gaming recall by emitting many near-identical gaps.

3.19 Matching Order

Use maximum/best match rather than naive list order.

Conceptual similarity score:

identity correctness
+
evidence overlap
+
temporal proximity


Select the best one-to-one assignment.

With our small dataset, this can be deterministic and simple.

We do not need complicated ML matching.

3.20 Core Confusion Definitions

For each gap type:

TP

Correct reported gap matched to one truth gap.

FP

Reported gap cannot match truth.

FN

Truth gap receives no prediction.

TN

Useful for scenario-level negative evaluation, but traditional detection F1 doesn't require enumerating every possible non-gap event.

Because we explicitly have a negative manifest, we can report:

hard-negative pass rate.

That is important.

3.21 Primary Detection Metrics

Per gap type:

Precision = TP / (TP + FP)
Recall    = TP / (TP + FN)
F1        = 2PR / (P + R)


Report:

missed-followup precision/recall/F1
duplicate-test precision/recall/F1
monitoring precision/recall/F1
3.22 Aggregate Metrics
Macro F1

Equal weight to each detector.

This should be our primary aggregate metric.

Why?

Otherwise the most common gap dominates.

Micro F1

All gaps pooled.

Useful, but secondary.

Hard-negative pass rate
number of negative scenarios correctly suppressed
/
total negative scenarios


This is extremely useful for judges.

3.23 Minimum Target Gates

Targets, not claims:

Metric	TargetPer-type precision	≥0.80
Per-type recall	≥0.70
Per-type F1	≥0.75 desirable
Macro F1	≥0.75
Hard-negative pass rate	≥0.90
Grounding accuracy	1.00
Extraction accuracy	≥0.90

If we don't meet them, we report actual values.

3.24 Grounding Evaluation

This deserves separate measurement.

For every reported user-visible gap:

Citation existence

Does doc_id exist?

Must be:

100%

Citation ownership

Does document belong to patient?

Must be:

100%

Span verification

Is quoted span supported by source?

Pass if:

exact


or frozen fuzzy verification ≥ threshold.

Claim support

More difficult.

Does evidence actually support the factual trigger?

Because our detectors operate on structured events whose provenance maps to evidence, we can validate structurally.

3.25 Grounding Metrics

Report:

Citation validity
Span support rate
Grounded-gap rate
Unsupported-claim rate


Our hard architectural gate should be:

No ungrounded prediction reaches the UI.

Therefore expected displayed-gap grounding:

100%


If a candidate fails grounding, suppress it.

3.26 Extraction Evaluation

We need more nuance than:

event correct / incorrect.

Evaluate components.

For gold event G and predicted event P:

Match first by
patient
source document
event type
temporal proximity

Then score fields.

Metrics
Event detection recall

How many gold events were extracted?

Event precision

How many extracted events correspond to genuine gold events?

Date accuracy

Exact date match or declared precision-compatible match.

Normalization accuracy

Correct:

test
medication
specialty
Source attribution accuracy

Correct source document and evidence span.

3.27 Extraction Composite

Don't create an arbitrary "AI score".

If we want a simple headline, report:

Event extraction F1

plus:

normalization accuracy

and:

citation accuracy.

More transparent.

3.28 Priority Evaluation

Our priority engine isn't clinical risk prediction.

So don't evaluate it against outcomes such as mortality or hospitalization.

Instead evaluate internal ranking correctness.

Checks
deterministic
priority formula correctly applied
stronger configured urgency outranks weaker cases under otherwise equal conditions
low-confidence gap bands capped correctly
multiple-gap contribution capped
no hidden oncology override
3.29 Metamorphic Priority Tests

Excellent use case.

Example:

Take the same missed-followup fixture.

Change:

overdue = 3 days


to:

overdue = 30 days


Everything else equal.

Expected:

priority must not decrease


Similarly:

confidence .95 → .65


Expected:

priority must not increase


This is a much better test than inventing "optimal" clinical ranking labels.

3.30 Queue Metrics

For product-level evaluation, we can report optional:

Precision@5

Among top 5:

What fraction correspond to genuine planted gaps?

Should ideally be extremely high.

But don't optimize the entire system solely for Maria/top 5.

Coverage@K

How many high-priority planted gaps are represented in top K?

Again, benchmark-specific workflow metric.

Not a clinical-outcomes claim.

3.31 Latency Benchmark

Measure separately:

Extraction latency

Per document/patient.

Detection latency

Expected to be very small.

Evidence verification latency
Priority latency
End-to-end patient latency
Whole-panel latency

Record:

p50
p95


where repeated runs make those statistics meaningful.

3.32 Cached vs Live Performance

Do NOT combine them.

Report:

Live pipeline

Measures actual computation.

Cached judge demo

Measures experience.

Example:

Live panel evaluation: XX sec
Cached dashboard render: XXX ms


Very different metrics.

3.33 Failure Taxonomy

Every incorrect output must be classifiable.

Use:

EX-01

Event missed.

EX-02

Wrong event type.

EX-03

Wrong date.

EX-04

Normalization failure.

EX-05

Wrong source attribution.

GAP-01

False-positive missed follow-up.

GAP-02

False-negative missed follow-up.

GAP-03

False-positive duplicate.

GAP-04

False-negative duplicate.

GAP-05

False-positive monitoring.

GAP-06

False-negative monitoring.

EV-01

Missing citation.

EV-02

Incorrect source document.

EV-03

Unsupported span.

TIME-01

Window calculation error.

TIME-02

Evaluation clock error.

PRIO-01

Formula application error.

PRIO-02

Unexpected ordering.

This makes debugging evidence-driven.

3.34 Error Report Contract

Every eval run should produce:

eval-report.json
error-cases.json


Example:

{
  "error_id": "...",
  "patient_id": "...",
  "category": "GAP-03",
  "predicted_gap_id": "...",
  "truth_gap_id": null,
  "scenario_id": "HN-05",
  "summary": "Explicit serial CBC incorrectly flagged as duplicate."
}


This later tells Phase 6 exactly what needs fixing.

3.35 Leakage Threat Model

Benchmark leakage can happen several ways.

Leakage A

Ground truth accidentally imported by runtime.

Forbidden.

Leakage B

Patient-specific exception.

Example:

if (patient.fixture_key === "P-001-maria") ...


Hard fail.

Leakage C

Prompt contains expected answer.

Forbidden.

Leakage D

Rules tuned individually against held-out examples.

Avoid.

Leakage E

Hardcoded queue ordering.

Forbidden.

3.36 Automated Leakage Audit

Build a script looking for:

ground_truth
negative_manifest
truth_gap_id
P-001-maria
fixture-specific detector branches


inside runtime directories.

Some legitimate tests will contain them.

Production runtime logic should not.

3.37 Blind Final Evaluation Procedure

At final benchmark time:

Freeze extractor version.
Freeze detector version.
Freeze priority version.
Record Git commit.
Load held-out partition.
Run pipeline.
Write raw predictions.
Calculate metrics.
Produce errors.
Hash report.
Do not modify result.

If we change code afterwards:

new benchmark run ID.

Never overwrite history.

3.38 Evaluation Run Metadata

Each run:

{
  "run_id": "eval-2026...",
  "timestamp": "...",
  "git_commit": "...",

  "dataset_version": "continua-synth-v1",
  "eval_version": "continua-eval-v1",

  "extractor_version": "extractor-v1",
  "detector_version": "gaps-v1",
  "priority_version": "priority-v1",

  "partition": "final",

  "evaluation_as_of_date": "2026-06-05"
}


This is evaluator-grade reproducibility.

3.39 Benchmark Runner Architecture

Create:

scripts/eval.ts


Conceptually:

Load benchmark
      ↓
Validate hashes
      ↓
Load predictions
      ↓
Match truth/predictions
      ↓
Score extraction
      ↓
Score gaps
      ↓
Score hard negatives
      ↓
Score grounding
      ↓
Score ranking
      ↓
Score latency
      ↓
Classify errors
      ↓
Produce report


The evaluator should not require React, browser, or UI.

3.40 CLI Contract

Eventually:

npm run eval


Optional parameters:

npm run eval -- --partition dev
npm run eval -- --partition final


Final should preferably require an explicit flag to reduce accidental held-out inspection.

3.41 Evaluation Output

Target:

artifacts/eval/<run-id>/
├── metadata.json
├── predictions.json
├── extraction-results.json
├── gap-results.json
├── negative-results.json
├── grounding-results.json
├── priority-results.json
├── latency.json
├── error-cases.json
└── eval-report.json


This becomes critical in Phase 9 benchmarking and submission documentation.

3.42 Eval Report Shape

Example:

{
  "status": "completed",

  "gap_detection": {
    "missed_followup": {
      "tp": 0,
      "fp": 0,
      "fn": 0,
      "precision": null,
      "recall": null,
      "f1": null
    }
  },

  "macro_f1": null,
  "micro_f1": null,

  "hard_negative_pass_rate": null,

  "extraction": {
    "event_precision": null,
    "event_recall": null,
    "event_f1": null,
    "normalization_accuracy": null
  },

  "grounding": {
    "citation_validity": null,
    "span_support_rate": null,
    "grounded_gap_rate": null
  },

  "priority": {
    "metamorphic_tests_passed": null,
    "precision_at_5": null
  },

  "latency": {
    "single_patient_p50_ms": null,
    "single_patient_p95_ms": null,
    "panel_p50_ms": null,
    "panel_p95_ms": null
  }
}


Null until measured.

Never invented.

3.43 Benchmark Integrity

At Phase 3 freeze calculate:

ground_truth_sha256
negative_manifest_sha256
extraction_gold_sha256
partition_manifest_sha256
evaluation_config_sha256


Store:

benchmark-manifest.json


Any change produces a new benchmark version.

3.44 Benchmark Freeze Policy

After freeze:

Allowed without new eval version
formatting
comments
README wording
Requires continua-eval-v2
label change
gap identity change
matching logic semantics change
partition membership change
evaluation date change
hard-negative expected outcome change
metric definition change

This protects credibility.

3.45 Error Analysis Workflow

After every development evaluation:

Metric
↓
Failure type
↓
Scenario family
↓
Root cause
↓
Fix pipeline
↓
Re-run


Not:

Metric low
↓
random prompt tweaking


Example:

Duplicate precision = 0.71
↓
6 FP
↓
5 are explicit serial CBC
↓
normalization lost series_status
↓
fix extraction/schema


That's genuine engineering.

3.46 Benchmark Red-Team

Before freezing evaluation, try to game it.

Attack 1: Predict everything

Does precision collapse?

It should.

Attack 2: Predict nothing

Does recall become zero?

It should.

Attack 3: Cite wrong document

Does grounding fail?

It must.

Attack 4: Duplicate predictions

Does one become FP?

It should.

Attack 5: Wrong specialty

Should fail identity match.

Attack 6: Correct type, wrong occurrence

Should not receive easy TP merely because patient+type match.

Attack 7: Change evaluation date

Hash/version should change or benchmark validation should fail.

Attack 8: Expose labels to runtime

Leakage audit must fail.

3.47 Baseline Systems

This is one addition I strongly recommend.

Later, benchmark Continua against simple baselines.

We can define them now.

Baseline 0

Predict nothing.

Shows:

Recall = 0

Baseline 1

Naive keyword/rule extraction.

Example:

If "referral" appears and no "consult" appears in same document:

flag.

Should perform poorly.

Baseline 2

LLM-only free-form judgment.

Potentially:

documents → LLM → gaps


No deterministic engine.

Why?

If our hybrid architecture outperforms or grounds better than this baseline, we have a fantastic technical story:

We tested the obvious LLM-only approach. Hybrid extraction + deterministic reasoning was more reliable.

Do this only if time allows later.

Phase 3 merely defines baselines.

3.48 Ablation Plan

Similarly define future experiments:

Full system

LLM extraction + normalization + rules + grounding.

Without normalization

Tests alias importance.

Without negative safeguards

Tests false-positive protection.

LLM-only detector

Tests hybrid architecture.

Without evidence suppression

Tests trust layer.

This is excellent material for Phase 9.

3.49 Benchmark Documentation

Create:

docs/evaluation/
├── benchmark-card.md
├── labeling-guide.md
├── matching-rules.md
├── metric-definitions.md
├── failure-taxonomy.md
├── leakage-policy.md
├── baseline-plan.md
└── freeze-policy.md

3.50 Benchmark Card

Like the dataset card, clearly say:

Measures
extraction against synthetic ground truth
three specific continuity gap types
evidence validity
workflow prioritization consistency
Does not measure
clinical efficacy
patient outcomes
diagnosis quality
physician accuracy
real-EHR generalization
safety in real healthcare deployment

That's extremely important.

3.51 Phase 3 Quantitative Gates
Metric	Phase 3 requirementGround-truth gaps with unique IDs	100%
Ground-truth gaps with rationale	100%
Ground-truth source references valid	100%
Hard-negative scenarios labeled	100%
Hard-negative families	≥10, goal 15
Extraction gold selected	12 patients
Gold events with source evidence	100%
Partition overlap by patient	0
Ambiguous gap identities	0
Evaluator deterministic	100%
Runtime truth-label imports	0
Ungrounded displayed-gap allowance	0
Evaluation semantics with undefined behavior	0 known
Benchmark integrity hashes	100% files

Notice:

Phase 3 does not require good model F1 yet.

We haven't built the model.

It requires a benchmark capable of measuring F1 correctly.

3.52 Phase 3 Acceptance Tests

Important tests:

B-01

Same truth + same predictions:

same metrics

B-02

Perfect predictions:

P = 1
R = 1
F1 = 1

B-03

No predictions:

P semantics documented
R = 0
F1 = 0


Avoid NaN.

B-04

All-positive spam predictor:

Precision drops.

B-05

Duplicate prediction:

Only one matches TP.

B-06

Wrong patient:

FP.

B-07

Wrong gap type:

FP.

B-08

Correct type but wrong specialty/occurrence:

FP.

B-09

Missing truth prediction:

FN.

B-10

Invalid evidence:

grounding failure.

B-11

Partition overlap:

benchmark validator fails.

B-12

Tampered ground truth:

hash validation fails.

B-13

Changed evaluation date:

benchmark validation fails unless version updated.

B-14

Metrics never return:

NaN
Infinity
undefined

3.53 Phase 3 Deliverables

Expected package:

data/eval-set/continua-eval-v1/
├── ground_truth.json
├── negative_manifest.json
├── extraction_gold.json
├── partitions.json
├── benchmark-manifest.json
└── README.md

lib/evaluation/
├── types.ts
├── matching.ts
├── extraction-matching.ts
├── metrics.ts
├── grounding.ts
├── priority.ts
├── taxonomy.ts
└── validate-benchmark.ts

scripts/
├── eval.ts
├── validate-benchmark.ts
├── audit-benchmark-leakage.ts
└── hash-benchmark.ts

tests/evaluation/
├── matching.test.ts
├── metrics.test.ts
├── grounding.test.ts
├── priority.test.ts
├── partition.test.ts
├── hash.test.ts
└── red-team.test.ts

docs/evaluation/
├── benchmark-card.md
├── labeling-guide.md
├── matching-rules.md
├── metric-definitions.md
├── failure-taxonomy.md
├── leakage-policy.md
├── baseline-plan.md
└── freeze-policy.md

3.54 Phase 3 Execution Order

Use this order:

3.0 Validate Phase-2 artifacts
        ↓
3.1 Write benchmark constitution
        ↓
3.2 Freeze truth-gap schema
        ↓
3.3 Freeze negative schema
        ↓
3.4 Complete extraction gold
        ↓
3.5 Freeze temporal truth semantics
        ↓
3.6 Define gap identities
        ↓
3.7 Create stratified patient partitions
        ↓
3.8 Implement prediction contracts
        ↓
3.9 Implement truth matching
        ↓
3.10 Implement detection metrics
        ↓
3.11 Implement extraction metrics
        ↓
3.12 Implement grounding evaluation
        ↓
3.13 Implement priority assertions
        ↓
3.14 Implement latency contracts
        ↓
3.15 Freeze failure taxonomy
        ↓
3.16 Create benchmark runner
        ↓
3.17 Write evaluator tests
        ↓
3.18 Leakage audit
        ↓
3.19 Run adversarial benchmark tests
        ↓
3.20 Canonical serialization
        ↓
3.21 Hash benchmark
        ↓
3.22 Freeze continua-eval-v1

3.55 Phase 3 Final Acceptance Gates
Gate A: Truth

Every gap has deterministic identity, rationale and evidence.

PASS / FAIL

Gate B: Negatives

Hard negatives are explicit and machine-testable.

PASS / FAIL

Gate C: Extraction gold

The 12-patient event benchmark is complete.

PASS / FAIL

Gate D: Isolation

Dev/final partitions have zero patient overlap.

PASS / FAIL

Gate E: Evaluator correctness

Synthetic perfect/terrible predictors produce expected metrics.

PASS / FAIL

Gate F: Grounding

Citation and span correctness are independently scored.

PASS / FAIL

Gate G: Leakage

Runtime has zero access to hidden truth.

PASS / FAIL

Gate H: Reproducibility

Same predictions + benchmark produce byte-equivalent metric results.

PASS / FAIL

Gate I: Integrity

Benchmark hashes validate.

PASS / FAIL

All nine pass.

3.56 Phase 3 Exit Report

At the end, generate:

CONTINUA-EVAL-V1

Dataset:
continua-synth-v1

Patients:
80

Partitions:
Development: XX
Final: XX
Overlap: 0

Ground truth:
Missed follow-up: XX
Duplicate testing: XX
Medication monitoring: XX
Total: XX

Hard-negative scenarios:
XX across XX families

Extraction gold:
12 patients
XXX events

Benchmark validation:
PASS

Runtime label leakage:
0

Ground truth SHA-256:
...

Extraction gold SHA-256:
...

Evaluation config SHA-256:
...


No detector performance yet.

That's later.

3.57 Definition of Done

Phase 3 is complete when we can take any future Continua implementation, give it the frozen synthetic records, receive predictions, and objectively answer:

Did it reconstruct the patient events correctly?
Did it find the right care gaps?
Did it invent gaps?
Did it survive difficult negatives?
Did it cite genuine source evidence?
Did it calculate priorities deterministically?
How fast was it?
Exactly where did it fail?
Can someone reproduce the same numbers?

If the answer to all of those is yes, stamp:

CONTINUA PHASE 3: continua-eval-v1 FROZEN

The next master-plan phase is Phase 4: Canonical Clinical Event Model, where we build the typed intermediate representation that separates messy healthcare documents from deterministic gap reasoning.
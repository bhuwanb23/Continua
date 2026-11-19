Continua Phase 9: Intelligence Benchmarking & End-to-End Evaluation

Phases 2–8 built and individually validated the intelligence stack. Phase 9 is where we stop asking whether each component works in isolation and answer the question that matters:

Does Continua, starting from messy fragmented records, reliably identify the right continuity gaps, suppress unsupported claims, and surface the right coordination work without knowing the answers beforehand?

This phase must be unusually strict. Phase 9 does not improve the system while measuring it. Development runs may guide improvements, but the final benchmark is executed only after the relevant versions are frozen.

9.0 Phase Mission

Evaluate the complete pipeline:

Synthetic Records
       ↓
extractor-v1
       ↓
ClinicalEvent v1
       ↓
normalization-v1
       ↓
gaps-v1
       ↓
evidence-v1
       ↓
VerifiedGap v1
       ↓
priority-v1
       ↓
Ranked Panel / Top 5


against:

continua-eval-v1


and answer, quantitatively:

Can Continua reconstruct events?
Can it detect all 3 supported gaps?
How many false alarms does it generate?
Does it survive adversarial negatives?
Are surfaced claims fully grounded?
What does evidence suppression cost in recall?
Is intervention ranking deterministic?
Does the Top-5 queue contain true coordination issues?
Which component causes each failure?
How fast is live inference?
Does the hybrid architecture outperform simpler alternatives?
Can another machine reproduce the reported results?
9.1 Inputs

Freeze before final evaluation:

Dataset             continua-synth-v1
Benchmark           continua-eval-v1
Event schema        clinical-event-v1
Normalization       normalization-v1
Extractor           extractor-v1
Extraction prompt   frozen Phase-5 version
Gap engine          gaps-v1
Gap policy          gap-policy-v1
Evidence layer      evidence-v1
Priority engine     priority-v1
Evaluation date     2026-06-05
Git commit          <record at runtime>


If one changes after the final benchmark:

It is a new run.

If benchmark semantics change:

It requires a new benchmark version.

9.2 Outputs

Phase 9 produces:

continua-benchmark-v1

with:

extraction benchmark
oracle detector benchmark
real-pipeline gap benchmark
pre/post-grounding comparison
hard-negative benchmark
priority validation
Top-K metrics
latency benchmark
cost benchmark
error attribution
baseline comparisons
ablations
reproducibility report
judge-facing technical scorecard
9.3 Critical Separation: Development vs Final Benchmark

We need two modes.

Development evaluation

Used during engineering.

Allowed:

run
→ inspect failures
→ improve system
→ version changes
→ rerun


Primarily use the Phase-3 development partition.

Final evaluation

Used for reported results.

Sequence:

Freeze system versions
       ↓
Record Git commit
       ↓
Run held-out partition
       ↓
Save predictions
       ↓
Score once
       ↓
Save artifacts
       ↓
Hash outputs


After seeing results:

Do not silently modify the system and overwrite the run.

A fix becomes another benchmark run.

9.4 Benchmark Layers

Do not collapse evaluation into one number.

We want five layers.

Layer A

Extraction

Layer B

Gap reasoning

Layer C

Evidence/trust

Layer D

Priority/ranking

Layer E

Complete end-to-end system

This lets us tell judges exactly where performance comes from.

9.5 Layer A: Extraction Evaluation

Evaluate extractor-v1 against the 12-patient extraction-gold set.

Primary:

Event Precision
Event Recall
Event F1


Secondary:

event-type accuracy
date accuracy
specialty normalization
diagnostic normalization
medication normalization
source-document accuracy
supported-span rate
9.6 Extraction Report Breakdown

Report by:

Difficulty
EASY
MEDIUM
HARD

Document type
Referral
Consult
Progress note
Lab
Imaging
Medication
Follow-up


This is much more useful than one aggregate score.

9.7 Extraction Hallucination Measurement

Calculate:

Spurious Event Rate =
FP extracted events
/
all accepted extracted events


But avoid casually calling everything a "hallucination."

Classify:

unsupported event
wrong event type
duplicate occurrence
historical mention mistaken as current
wrong normalization

That makes failure analysis actionable.

9.8 Layer B1: Oracle Gap Benchmark

Run the three deterministic gap engines against gold/canonical events.

This removes extraction from the equation.

We now answer:

If Continua knew the facts perfectly, are its gap rules correct?

Report for each:

Missed Follow-Up
Duplicate Testing
Medication Monitoring


Metrics:

TP
FP
FN
Precision
Recall
F1

9.9 Oracle Expectations

Targets from Phase 6:

Precision ≥ .95
Recall    ≥ .95
Macro F1  ≥ .95


If oracle performance is poor:

We have a rule/policy problem.

Do not blame the model.

This is a release blocker unless the miss is explicitly understood and accepted.

9.10 Layer B2: Extracted-Event Gap Benchmark

Now run:

Records
→ extractor-v1
→ canonical events
→ gaps-v1


against exactly the same gap ground truth.

This measures actual pipeline detection performance.

Report again:

Precision
Recall
F1


per type and aggregate.

9.11 Extraction Loss

Compare:

Oracle gap recall
versus
Extracted-event gap recall


Define:

Extraction-Induced Recall Loss =
Oracle Recall - Pipeline Recall


Example interpretation, not fabricated result:

Oracle rules recover 96% of gaps while the real pipeline recovers 82%, so approximately 14 points of recall are lost upstream.

This immediately identifies the bottleneck.

9.12 Hard-Negative Benchmark

Run every Phase-3 adversarial negative scenario.

Report:

Hard Negative Pass Rate =
correctly suppressed negative scenarios
/
total adversarial negative scenarios


Also break down by family.

Example report structure:

Family	Cases	PassCompleted referral	N	X/N
Telehealth completion	N	X/N
Explicit serial CBC	N	X/N
Duplicate-document artifact	N	X/N
Imaging different region	N	X/N
Medication stopped	N	X/N
Monitoring alias	N	X/N
Not-yet-due referral	N	X/N

This can become one of the strongest technical artifacts in the submission.

9.13 Layer C: Evidence Benchmark

Now evaluate:

Candidate Gaps
       ↓
evidence-v1
       ↓
Verified Gaps


We need both:

Candidate metrics

before evidence gate

and

Verified metrics

after evidence gate.

9.14 Evidence-Gate Effect

Measure:

Candidate Precision
Candidate Recall

Verified Precision
Verified Recall


Then calculate:

Precision gain
Recall cost


This tells us whether evidence verification genuinely improves trust.

9.15 Grounding Metrics

For every displayed VerifiedGap:

Citation validity

Does document exist?

Patient attribution

Correct patient?

Span validity

Does source contain supporting passage?

Claim completeness

All determinant claims supported?

Absence validity

Correct search scope and no contradictory event?

Policy validity

Correct frozen policy/version?

9.16 Hard Trust Gates

For user-visible output:

Valid citation             = 100%
Correct patient ownership  = 100%
Required span support      = 100%
Required claim support     = 100%
Unsupported claims         = 0
Ungrounded queue gaps      = 0


Unlike F1, these are architectural requirements.

9.17 Corruption Benchmark

Run deliberately corrupted evidence packages.

Examples:

wrong document
wrong patient
altered span
missing policy
contradicted absence
stale event-store hash

Report:

Critical Corruption Rejection Rate


Target:

100%


If not:

Phase 7 trust architecture fails.

9.18 Layer D: Priority Benchmark

We do not evaluate priority as clinical risk prediction.

Evaluate:

Determinism

Same input → same ranking.

Formula correctness

Implementation = frozen spec.

Monotonicity

More overdue otherwise-equivalent issue doesn't rank lower.

Invariance

Demographic changes don't alter priority.

Secondary-cap behavior

Weak alert volume can't overwhelm strong top issue.

Tie determinism

Stable ordering.

9.19 Ranking Metrics

Product-facing metrics:

Top-5 verified rate
Top5 items backed by VerifiedGap / 5


Hard requirement:

5/5

Top-5 truth precision
Top5 patients whose surfaced gap
matches frozen benchmark truth / 5


Target:

5/5


Measured honestly.

Precision@K

Calculate:

P@1
P@3
P@5
P@10


Useful to see whether queue quality degrades lower down.

9.20 Ranking Stability

Run frozen sensitivity perturbations around workflow weights.

Measure:

Top-5 retention


and optionally:

rank correlation


Use Spearman or Kendall if straightforward.

But don't overcomplicate it.

The important question:

Does a tiny arbitrary coefficient change completely reshuffle Sarah's day?

If yes, ranking is too fragile.

9.21 Demographic Invariance Benchmark

Take representative patient cases.

Mutate only:

display name
age where age is not part of rules
sex where not used
synthetic demographic metadata

Hold verified gaps fixed.

Expected:

Priority differences = 0


This is a meaningful responsible-AI result.

Do not claim broad demographic fairness from this. It's an input-invariance test, not population fairness validation.

9.22 Layer E: Full End-to-End Benchmark

Now evaluate:

Raw synthetic records
       ↓
Extraction
       ↓
Normalization
       ↓
Gap detection
       ↓
Evidence verification
       ↓
Priority ranking
       ↓
Top-5 queue


This provides the primary product benchmark.

9.23 End-to-End Unit of Success

For a ground-truth gap to become an E2E true positive:

relevant events extracted;
correct normalized identity;
detector creates correct candidate;
evidence verifies;
verified gap survives;
patient is available for ranking.

This is intentionally strict.

9.24 End-to-End Gap Metrics

Again:

Precision/type
Recall/type
F1/type
Macro F1
Micro F1


Primary headline:

Held-out Macro F1

because all three gap types matter.

Master target:

Macro F1 ≥ .75


Not guaranteed.

9.25 End-to-End Hard-Negative Performance

Also report:

Hard-negative pass rate


because high F1 can hide operationally annoying false alarms.

Target:

≥ .90

9.26 Panel-Level Metrics

Useful:

patients with ≥1 truth gap
patients with ≥1 detected gap
patients with ≥1 verified gap
false-alert patients
completely missed positive patients

This tells us whether errors cluster badly.

9.27 Patient-Level Precision

Define:

Patient Alert Precision =
patients surfaced with ≥1 true gap
/
patients surfaced with ≥1 verified gap


This directly reflects coordinator alert burden.

9.28 Patient-Level Recall
Patient Alert Recall =
positive patients surfaced
/
patients containing ≥1 ground-truth gap


Useful in addition to gap-instance recall.

9.29 Failure Attribution

Every E2E FN needs attribution.

Possible stages:

EXTRACTION
NORMALIZATION
RECONCILIATION
DETECTION
EVIDENCE
PRIORITY


Priority cannot technically cause a gap-level FN, but it can cause a:

QUEUE_MISS


if a true high-priority case falls outside Top-K.

9.30 Attribution Example

Suppose a missed follow-up isn't surfaced.

Trace:

Referral extracted? YES
Specialty normalized? YES
Consult events reconstructed? YES
Detector produced gap? YES
Evidence verified? NO


Root cause:

EVIDENCE


not detector.

This is why our architecture is layered.

9.31 Failure Funnel

Produce:

Truth gaps
  ↓
Support events successfully extracted
  ↓
Correct candidates
  ↓
Verified gaps
  ↓
Ranked gaps
  ↓
Top-K patients


At each stage show counts.

This can produce an excellent visual later.

9.32 Baseline 0: Predict Nothing

Expected:

Recall = 0
F1 = 0


Precision behavior must follow frozen Phase-3 metric semantics.

This is mostly a sanity check.

9.33 Baseline 1: Naive Keyword/Rule System

Build deliberately simple baseline.

For example:

Referral

Find "referral" in text and search "consult" after it.

Duplicate

String-equal test names within 14 days.

Monitoring

Simple exact raw drug/test names.

No LLM normalization.

No evidence trust layer.

Purpose:

Measure whether sophisticated extraction/normalization actually adds value.

9.34 Baseline 2: LLM-Only Gap Judge

This is potentially our most valuable comparison.

Pipeline:

patient documents
↓
LLM
↓
"find the care gaps"


Structured output allowed, but:

no deterministic gap rules;
no deterministic evidence gate.

Evaluate using the exact same continua-eval-v1.

9.35 Why LLM-Only Baseline Matters

Our architectural claim is:

LLMs are good at flexible extraction, while deterministic rules and evidence verification make workflow decisions more reproducible and auditable.

If evaluation supports that:

excellent.

If LLM-only performs better:

we report it honestly and analyze trade-offs such as:

grounding
consistency
adverse negatives
reproducibility

Do not assume our architecture wins because we designed it.

9.36 Baseline 3: Oracle Events

This isn't a deployable competitor.

It's an upper-bound diagnostic baseline:

gold events
+
our rules


It tells us how much room extraction leaves on the table.

9.37 Ablation A: No Normalization

Run:

extractor
→ raw entities
→ detectors


Compare with full.

Measure the contribution of:

specialty aliases
test aliases
medication aliases
9.38 Ablation B: No Reconciliation

Disable copied/historical-event reconciliation.

Expected potential effect:

Duplicate-test false positives increase.

Measure it.

9.39 Ablation C: No Negative Safeguards

Disable:

explicit-series protection
cancellation handling
medication-stop protection

This demonstrates why those rules exist.

9.40 Ablation D: No Evidence Gate

Use Phase-6 candidates directly.

Measure:

precision
recall
unsupported-claim rate


Then compare with verified output.

9.41 Ablation E: No Secondary Priority Cap

Test ranking without capped secondary contribution.

Observe whether alert-heavy cases dominate.

This supports the design of priority-v1.

9.42 Don't Overdo Ablations

For hackathon scope, prioritize:

Oracle
LLM-only
Full hybrid
No evidence gate

Then add others only when build schedule allows.

The project must ship.

9.43 Latency Benchmark Architecture

Measure stages separately.

Document preparation
Extraction
Schema validation
Normalization
Reconciliation
Gap detection
Evidence verification
Priority
Complete pipeline


For:

single patient

and:

full 80-patient panel.
9.44 Latency Statistics

For actually repeated operations:

p50
p95


Also record:

mean


if useful.

Don't calculate fake percentiles from 2 runs.

Use enough repetitions for meaningful local stages.

Live LLM panel evaluation may be more expensive, so document run count.

9.45 Live vs Cached Latency

Report separately.

Live intelligence pipeline

Actual extraction + reasoning.

Cached judge experience

Loading precomputed verified artifacts.

Never advertise cached latency as AI-processing latency.

9.46 Cost Benchmark

Track LLM extraction cost.

Report:

cost/document
cost/patient
cost/80-patient benchmark


based on actual recorded token usage/pricing where available.

Because pricing is time-sensitive, the benchmark artifact should record:

provider/model
token counts
pricing basis/date


For the hackathon submission, update pricing using current provider documentation if we publish a dollar value.

9.47 Reproducibility Benchmark

Run full deterministic post-extraction stack twice.

Expected:

Canonical event cache identical
Gap IDs identical
Verified gap set identical
Patient scores identical
Top-K order identical
Evaluation results identical


Live LLM extraction itself may not be byte-identical.

That's fine.

What matters:

Frozen cached extraction output produces fully reproducible downstream intelligence.

9.48 Environment Reproduction

Eventually test on a clean environment:

npm ci
generate/validate dataset
load frozen extraction artifacts
run benchmark


Metrics should exactly match the committed benchmark report for deterministic stages.

9.49 Benchmark Run IDs

Every run:

benchmark-YYYYMMDD-HHMM-<shortsha>


Metadata:

{
  "run_id": "...",
  "git_commit": "...",
  "dataset_version": "...",
  "eval_version": "...",
  "extractor_version": "...",
  "prompt_version": "...",
  "normalization_version": "...",
  "detector_version": "...",
  "evidence_version": "...",
  "priority_version": "...",
  "evaluation_as_of_date": "2026-06-05"
}

9.50 Benchmark Artifact Structure
artifacts/benchmark/<run-id>/
├── metadata.json
├── extraction/
│   ├── predictions.json
│   ├── metrics.json
│   └── errors.json
├── gaps/
│   ├── oracle.json
│   ├── extracted.json
│   └── errors.json
├── evidence/
│   ├── verified.json
│   ├── suppressed.json
│   └── metrics.json
├── priority/
│   ├── ranked-panel.json
│   ├── top-k.json
│   └── sensitivity.json
├── negatives/
│   └── results.json
├── baselines/
│   ├── naive.json
│   └── llm-only.json
├── ablations/
│   └── ...
├── latency.json
├── cost.json
├── failure-funnel.json
├── error-attribution.json
└── final-report.json

9.51 No Result Overwriting

Every run is immutable.

Latest pointer can exist:

artifacts/benchmark/latest.json


but actual past results remain.

This prevents accidental benchmark revisionism.

9.52 Benchmark Status

A benchmark run should have:

NOT_RUN
RUNNING
COMPLETED
FAILED
INVALID


INVALID examples:

wrong benchmark hash
version mismatch
wrong evaluation date
label leakage detected

Do not publish metrics from an invalid run.

9.53 Benchmark Preflight

Before final evaluation:

 dataset hash matches
 benchmark hash matches
 evaluation date matches
 dev/final partition disjoint
 extractor version frozen
 prompt version frozen
 detector version frozen
 evidence version frozen
 priority version frozen
 Git working tree clean
 no label leakage
 provider configuration recorded
 run metadata initialized

If any fails:

Don't start final benchmark.

9.54 Judge-Facing Scorecard

We eventually want something compact:

CONTINUA INTELLIGENCE BENCHMARK

Held-out synthetic benchmark
continua-eval-v1

Extraction F1                   X.XX
Gap Macro F1                    X.XX
Hard-negative pass              XX%
Displayed-gap grounding         100%
Unsupported displayed claims    0
Top-5 truth precision           X/5
Deterministic downstream runs   identical
Live patient latency            X.X sec
Cached demo latency             XXX ms


Only actual measured values.

This is much stronger than:

"Powered by AI."

9.55 Technical Judge Story

The eventual explanation becomes:

“We didn't benchmark only the LLM. We decomposed the system. We measure extraction separately from deterministic gap detection, evidence grounding separately from recall, and ranking separately from clinical risk. We also benchmark hard negatives, an LLM-only baseline, and a gold-event upper bound.”

That is unusually strong for this competition.

9.56 Business Judge Story

Don't dump metrics.

Translate:

“False alerts waste coordinators' limited time, so precision and hard-negative performance matter. Missing records matter too, so we also measure recall. And Continua refuses to surface a gap unless the evidence can be inspected.”

That's what Jad Diab-type business reasoning should care about, based on the judge research you supplied earlier.

9.57 AI Judge Story

For the technical evaluator:

extraction F1
LLM-only versus hybrid
source grounding
unsupported claim rate
hard negatives
error breakdown
held-out evaluation

This directly addresses the medical-NLP/faithfulness concerns identified in your dossier for Shreyansh Rath.

9.58 Design Judge Story

For the design/polish perspective identified for Sanjay Jillellamudi:

Don't make judges inspect JSON.

Phase 14 later converts benchmark output into a simple, attractive evidence experience.

Phase 9 merely produces trusted data for it.

9.59 Error Attribution Matrix

For each end-to-end failure:

ID	Gap type	Error	Stage	Root cause	Fix candidateE-001	Follow-up	FN	Extraction	referral omitted	prompt/model
E-002	Duplicate	FP	Reconciliation	copied CBC split	reconciliation
E-003	Monitoring	FN	Normalization	alias missed	alias map

This should become the engineering backlog.

9.60 Biggest-Error-First Rule

After a development benchmark:

Rank failure categories by:

frequency × impact


Fix:

systemic errors first.

Not the most visually embarrassing single demo error.

Typical priority:

12 false positives caused by copied labs


beats:

one unusual specialty alias


unless the latter breaks Maria/demo.

9.61 Benchmark Stop Rule

We need to avoid endless tuning.

Stop system tuning when:

P0 acceptance targets are met, or
remaining misses are understood and acceptable for hackathon scope, or
additional tuning threatens overfitting to continua-eval-v1.

Then freeze.

A benchmark is useless if we iterate on it indefinitely until memorized.

9.62 Benchmark Limitations

Explicitly document:

synthetic dataset
artificial gap prevalence
limited specialties
controlled document templates
narrow internal normalization vocabulary
benchmark monitoring policies
not clinically validated
not real-EHR validation
no patient outcome measurement
no FDA/clinical-device claims

This is not a weakness.

It's honest experimental scope.

9.63 Phase Subphase Map
Subphase	Deliverable9.0	Benchmark preflight
9.1	Run-metadata contract
9.2	Extraction benchmark
9.3	Oracle detector benchmark
9.4	Extracted-event detector benchmark
9.5	Extraction-loss analysis
9.6	Hard-negative benchmark
9.7	Evidence-gate benchmark
9.8	Corruption benchmark
9.9	Priority invariant benchmark
9.10	Top-K benchmark
9.11	Demographic invariance
9.12	End-to-end gap benchmark
9.13	Patient-level evaluation
9.14	Failure funnel
9.15	Failure attribution
9.16	Naive baseline
9.17	LLM-only baseline
9.18	Oracle upper bound
9.19	Core ablations
9.20	Latency benchmark
9.21	Cost benchmark
9.22	Reproducibility run
9.23	Limitations audit
9.24	Final held-out run
9.25	Artifact hashing
9.26	Benchmark report
9.27	Freeze
9.64 Execution Order

Follow this carefully:

9.0 Validate all Phase 2–8 versions
        ↓
9.1 Validate benchmark hashes
        ↓
9.2 Freeze benchmark-run configuration
        ↓
9.3 Implement unified benchmark runner
        ↓
9.4 Run benchmark runner tests
        ↓
9.5 Development extraction benchmark
        ↓
9.6 Oracle detector benchmark
        ↓
9.7 Extracted detector benchmark
        ↓
9.8 Hard-negative benchmark
        ↓
9.9 Evidence-gate benchmark
        ↓
9.10 Priority/invariance benchmark
        ↓
9.11 End-to-end development benchmark
        ↓
9.12 Build failure funnel
        ↓
9.13 Root-cause analysis
        ↓
9.14 Apply allowed systemic fixes
        ↓
9.15 Re-version changed components
        ↓
9.16 Freeze implementation
        ↓
9.17 Run baselines
        ↓
9.18 Run core ablations
        ↓
9.19 Run latency/cost tests
        ↓
9.20 Execute held-out benchmark
        ↓
9.21 Lock raw output
        ↓
9.22 Generate metrics
        ↓
9.23 Reproducibility rerun
        ↓
9.24 Generate final report
        ↓
9.25 Hash final artifacts
        ↓
9.26 Red-team benchmark claims
        ↓
9.27 Freeze continua-benchmark-v1


The crucial rule is:

No system tuning between 9.20 and final report generation.

9.65 Phase 9 Quantitative Gates
Measurement	Gate/TargetInvalid benchmark artifacts	0
Dataset/benchmark hash mismatches	0
Held-out patient leakage	0
Oracle detector Macro F1	target ≥ .95
E2E per-type precision	target ≥ .80
E2E per-type recall	target ≥ .70
E2E Macro F1	target ≥ .75
Hard-negative pass	target ≥ .90
Displayed-gap grounding	100% required
Unsupported displayed claims	0 required
Wrong-patient citations	0 required
Top-5 verified rate	5/5 required
Top-5 truth precision	target 5/5
Demographic-invariance violations	0 required
Downstream nondeterministic differences	0 required
LLM use outside extraction	0 required
Final metrics derived from real run	100%

Again:

Targets are not claims.

If E2E Macro F1 lands at .72, we report .72.

9.66 Red-Team the Benchmark

Before freezing, actively try to invalidate our conclusions.

Attack 1

Does LLM-only beat Continua?

If yes, don't hide it.

Analyze grounding/reproducibility differences.

Attack 2

Does full system outperform naive only because benchmark wording mirrors templates?

Inspect.

Attack 3

Does evidence gate simply suppress every difficult example?

Look at recall cost.

Attack 4

Do three or four patients determine most of Macro F1?

Check distribution.

Attack 5

Is Maria leaking into architecture?

Search runtime.

Attack 6

Are cached outputs being counted as live inference speed?

Reject.

Attack 7

Are scenario assumptions presented as measured business savings?

Reject.

Attack 8

Did we tune held-out labels?

Audit benchmark/version history.

Attack 9

Can evaluator itself be wrong?

Run perfect/no-output/spam sanity predictors from Phase 3.

Attack 10

Are we presenting synthetic performance as clinical validation?

Hard fail.

9.67 Phase Deliverables
lib/benchmark/
├── runner.ts
├── config.ts
├── metadata.ts
├── stages.ts
├── funnel.ts
├── attribution.ts
├── baselines.ts
├── ablations.ts
├── latency.ts
├── cost.ts
├── reproducibility.ts
└── report.ts

scripts/
├── benchmark-dev.ts
├── benchmark-final.ts
├── benchmark-baselines.ts
├── benchmark-ablations.ts
├── benchmark-latency.ts
├── benchmark-reproduce.ts
└── verify-benchmark-artifact.ts

tests/benchmark/
├── preflight.test.ts
├── runner.test.ts
├── metrics.test.ts
├── funnel.test.ts
├── attribution.test.ts
├── baselines.test.ts
├── reproducibility.test.ts
└── integrity.test.ts

docs/benchmark/
├── benchmark-protocol.md
├── system-scorecard.md
├── baseline-results.md
├── ablation-results.md
├── failure-analysis.md
├── limitations.md
└── final-report.md

artifacts/benchmark/
└── <run-id>/
    └── ...

9.68 Phase Acceptance Gates
Gate A: Integrity

All inputs match frozen hashes/versions.

PASS / FAIL

Gate B: Evaluator

Known perfect/empty/spam predictors score correctly.

PASS / FAIL

Gate C: Layered Evaluation

Extraction, detection, evidence and ranking measured independently.

PASS / FAIL

Gate D: End-to-End

Complete raw-record pipeline measured on frozen final partition.

PASS / FAIL

Gate E: Negatives

Adversarial negative performance measured and reported.

PASS / FAIL

Gate F: Trust

Displayed output has 100% required grounding.

PASS / FAIL

Gate G: Baselines

At least naive baseline plus one meaningful comparison exists.

PASS / FAIL

Gate H: Reproducibility

Deterministic downstream benchmark reproduces identically.

PASS / FAIL

Gate I: Claim Discipline

No benchmark claim exceeds what the synthetic evaluation supports.

PASS / FAIL

Gate J: Immutability

Final run artifacts preserved and hashed.

PASS / FAIL

All ten pass.

9.69 Final Phase-9 Report

The completed report should look roughly like:

CONTINUA BENCHMARK V1

Dataset:
continua-synth-v1

Benchmark:
continua-eval-v1

Final partition:
XX patients

Git:
<commit>


EXTRACTION

Event precision:              —
Event recall:                 —
Event F1:                     —
Source attribution:           —


ORACLE GAP ENGINE

Follow-up F1:                 —
Duplicate F1:                 —
Monitoring F1:                —
Macro F1:                     —


END-TO-END VERIFIED GAPS

Follow-up P/R/F1:             —
Duplicate P/R/F1:             —
Monitoring P/R/F1:            —

Macro F1:                     —
Micro F1:                     —

Hard-negative pass:           —


TRUST

Displayed gaps grounded:      —
Unsupported claims:           —
Wrong-patient citations:       —


QUEUE

Patients ranked:              —
Top-5 verified:               —/5
Top-5 truth precision:        —/5

Demographic invariance:
PASS / FAIL

Deterministic repeat:
PASS / FAIL


LIVE PERFORMANCE

Single patient p50:           —
Single patient p95:           —
80-patient panel:             —

Cached demo render:           —


BASELINES

Naive Macro F1:               —
LLM-only Macro F1:            —
Continua Macro F1:            —


LIMITATIONS

Synthetic-only benchmark.
Not clinically validated.
No real EHR/PHI evaluation.
No patient-outcome claims.


No number is populated until actually measured.

9.70 Handoff to Phase 10

After Phase 9, the intelligence core is formally complete.

We now know whether it works, where it fails, and exactly what we can safely claim.

Phase 10 receives:

frozen benchmark-qualified canonical artifacts
verified gap outputs
ranked panel
Top-5 queue
measured benchmark report
frozen Maria artifacts
hashes/version metadata

Its task is:

Package those validated results into a deterministic Demo Cache & Persistence Layer so judges never depend on live LLM availability, latency, or API limits.

Phase 9 Definition of Done

Phase 9 ends only when we can answer these questions with actual benchmark artifacts rather than intuition:

How accurate is the extractor?

Measured.

How accurate are the rules if extraction is perfect?

Measured.

How much performance is lost because of extraction?

Measured.

What is end-to-end gap precision/recall/F1?

Measured.

How often does Continua survive tricky negative cases?

Measured.

Does grounding increase trust at the cost of recall?

Measured.

Is every displayed claim supported?

Verified.

Are Top-5 items real benchmark issues?

Measured.

Does ranking change with irrelevant demographics?

Tested.

Does the hybrid design beat simpler alternatives?

Measured, not assumed.

How fast and expensive is the live pipeline?

Measured separately from cache latency.

Can another run reproduce the deterministic results?

Verified.

Only then stamp:

CONTINUA PHASE 9: continua-benchmark-v1 FROZEN

Next: Phase 10 — Demo Cache & Persistence, where benchmark-qualified intelligence becomes a reliable judge experience instead of a fragile live-AI demonstration.
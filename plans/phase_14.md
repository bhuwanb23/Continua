Continua Phase 14: Impact & Evaluation Experience

Phase 13 makes Continua memorable. Phase 14 makes it believable.

This phase must prevent the classic hackathon failure where technically sound work gets weakened by claims such as:

“95% accurate,” “saves 15 hours,” “reduces costs,” or “prevents missed care”

without explaining what was actually measured.

Phase 14 mission: Turn Continua's frozen benchmark results, trust metrics, operational measurements, modeled impact, assumptions, limitations, and failure cases into a concise proof system that a judge can understand in under a minute and interrogate without the story collapsing.

14.0 North Star

The proof hierarchy is:

WHAT CONTINUA DOES
        ↓
WHAT WE ACTUALLY MEASURED
        ↓
HOW WE MEASURED IT
        ↓
WHAT THE BUSINESS IMPACT COULD BE
        ↓
WHICH ASSUMPTIONS DRIVE THAT MODEL
        ↓
WHERE THE SYSTEM FAILS
        ↓
WHAT WE DO NOT CLAIM


We want a judge to distinguish instantly between:

Measured

Actual Continua benchmark/system result.

Modeled

Calculated consequence under explicit assumptions.

Scenario assumption

Input chosen for the demo/business model.

External evidence

Third-party industry evidence.

Future target

Something we have not achieved.

These categories must never visually blur together.

14.1 Inputs

Phase 14 consumes frozen:

continua-benchmark-v1
Phase 9 final held-out results
extraction metrics
oracle detector metrics
end-to-end detector metrics
hard-negative results
evidence-gate metrics
grounding results
Top-K results
latency metrics
baseline results
ablations, if performed
Phase 10 classified impact data
Phase 13 flagship experience
benchmark limitations
external research sources that survive final verification
14.2 Outputs

Phase 14 produces:

Continua Proof & Impact Experience v1

including:

evaluation scorecard
detector-performance view
pipeline funnel
trust scorecard
adversarial-negative scorecard
baseline comparison
failure-analysis experience
operational-impact model
assumption ledger
external-evidence registry
limitations panel
claim registry
judge-facing one-screen proof layer
reproducible calculation artifacts
final claim audit
14.3 Non-Goals

Phase 14 does not:

tune the benchmark;
modify outputs to improve F1;
invent ROI;
convert synthetic evaluation into clinical validation;
claim avoided complications;
calculate lives saved;
claim reduced readmissions;
claim actual hospital labor savings;
hide weak detector performance;
select only favorable test cases;
use cached-demo speed as live AI latency;
turn model confidence into clinical confidence.

This is a reporting and interpretation phase, not a metric-improvement phase.

14.4 Phase Structure
Subphase	Workstream	Result14.0	Result freeze	Valid Phase-9 run selected
14.1	Claim taxonomy	Meanings locked
14.2	Claim registry	Every public number governed
14.3	Evaluation summary	Technical headline
14.4	Per-detector view	P/R/F1
14.5	Pipeline funnel	Where errors occur
14.6	Trust scorecard	Grounding proof
14.7	Hard negatives	False-alert resistance
14.8	Baselines	Hybrid-value evidence
14.9	Ablations	Component contribution
14.10	Ranking proof	Top-K and invariants
14.11	Latency proof	Live vs cached
14.12	Failure analysis	Honest misses
14.13	Impact model	Operational consequences
14.14	Assumption ledger	Model transparency
14.15	External evidence	Source registry
14.16	Limitations	Scope boundaries
14.17	Judge proof screen	Fast comprehension
14.18	Calculation validation	Reproducibility
14.19	Claim red-team	Exaggeration testing
14.20	Freeze	Proof Experience v1
14.5 Claim Taxonomy

Freeze these five classes.

MEASURED
MODELED
SCENARIO_ASSUMPTION
EXTERNAL_RESEARCH
FUTURE_TARGET


Every quantitative claim appearing anywhere in:

product UI
pitch
Devpost
executive summary
demo narration
README

must belong to exactly one.

14.6 Class 1: MEASURED

A metric generated from actual Continua execution.

Examples:

Held-out Macro F1
Hard-negative pass rate
Grounding rate
Top-5 truth precision
Live pipeline latency
Cached endpoint latency


Required metadata:

benchmark_run_id
metric
value
unit
partition
sample size
versions

14.7 Class 2: MODELED

Derived mathematically from measured values and/or explicit assumptions.

Example:

potential coordinator hours redirected


A modeled output must provide its formula.

Never say:

Continua saved 14 hours.

Say:

Under the demo scenario assumptions, the model estimates X hours of review time could be redirected.

14.8 Class 3: SCENARIO_ASSUMPTION

Example:

Manual review baseline:
12 minutes/patient


Unless we genuinely measured care coordinators doing this, this remains an assumption.

The assumption may have external motivation, but that does not automatically turn it into a measured Continua result.

14.9 Class 4: EXTERNAL_RESEARCH

Examples may include industry findings about:

care coordination burden
interoperability
referral completion
duplicate testing

Only use statistics that are still necessary for the final story.

By the final submission phase, re-verify them against primary or authoritative sources because some earlier research came from secondary summaries.

Store:

source
publisher
URL
publication date
retrieval date
exact supported claim

14.10 Class 5: FUTURE_TARGET

Examples:

future FHIR integration
prospective pilot
real-world validation


Do not represent roadmap goals as current capability.

UI label:

Future validation

not:

Coming soon unless actually committed.

14.11 Claim Registry

Create a machine-readable registry.

Example:

{
  "claim_id": "benchmark-macro-f1",
  "label": "Held-out Macro F1",
  "classification": "MEASURED",
  "value_source": "continua-benchmark-v1",
  "benchmark_run_id": "...",
  "allowed_surfaces": [
    "evaluation",
    "demo",
    "readme",
    "submission"
  ]
}


This becomes the single source of truth for claims.

14.12 Why Claim Registry Matters

Without it, you'll eventually have:

README: 91%
Demo: 93%
Devpost: 94%
UI: 92%


because results changed during development.

With registry:

one benchmark
→ one claim
→ all surfaces


Much safer.

14.13 Claim States

Each claim should support:

DRAFT
VALIDATED
APPROVED
RETIRED


Only:

APPROVED


can enter final submission artifacts.

14.14 Evaluation Hero

Screen title:

How Continua performs

Subheading:

Evaluated on a frozen synthetic benchmark with held-out patients and adversarial negative cases.

Then maximum four headline metrics.

Recommended:

Held-out Macro F1
Hard-negative pass rate
Displayed-gap grounding
Top-5 truth precision

Actual values only.

14.15 Metric Card Anatomy

Every card should contain:

VALUE
LABEL
CONTEXT


Example:

0.84

Held-out Macro F1

Across 3 supported continuity-gap types
on continua-eval-v1.


Not simply:

84% Accuracy


"Accuracy" would be ambiguous and probably wrong.

14.16 No Giant "Accuracy" Number

Avoid:

94% ACCURATE

Precision, recall and F1 mean different things.

Report them correctly.

Technical sophistication includes not oversimplifying measurement beyond recognition.

14.17 Per-Detector View

Use the Phase-9 table:

Detector	Precision	Recall	F1Follow-up	actual	actual	actual
Repeat diagnostic	actual	actual	actual
Medication monitoring	actual	actual	actual

Add sample support:

Truth instances: N


when useful.

14.18 Why Sample Size Matters

A:

1.00 F1


from two examples is not impressive.

If a detector has small support:

surface it.

Example:

F1 1.00 · n=6

That is honest.

14.19 Oracle vs E2E

One of the strongest technical visuals:

With correct canonical events
        ↓
Oracle gap engine F1 = X

Raw records end-to-end
        ↓
E2E verified-gap F1 = Y


Difference:

extraction/reconciliation loss.

This demonstrates real engineering understanding.

14.20 Pipeline Funnel

Create:

Ground-truth gaps
        ↓
Support events extracted
        ↓
Correct candidates produced
        ↓
Evidence verified
        ↓
Verified gaps surfaced


Use actual counts.

This answers:

Where does Continua lose recall?

Extremely valuable.

14.21 Funnel Interaction

Technical judge can hover/click each stage:

Extraction

X gaps lost.

Detection

Y lost.

Evidence

Z suppressed.

No need for complicated Sankey.

A vertical funnel is clearer.

14.22 Trust Scorecard

Separate from general performance.

Title:

What reaches the coordinator

Show:

Displayed gaps with verified sources       X%
Wrong-patient citations                    N
Unsupported displayed claims               N
Critical corrupted evidence accepted       N


Our architecture targets:

100%
0
0
0


But display actual benchmark values.

14.23 Evidence Suppression Tradeoff

Show:

Before evidence verification

Precision X
Recall Y

After evidence verification

Precision A
Recall B


Then one line:

Continua chooses to suppress unsupported issues rather than present them as trusted coordination alerts.

This directly demonstrates responsible engineering.

14.24 Hard-Negative Experience

Title:

Designed to say "no" when appropriate

That's powerful.

Show a few adversarial cases:

Completed referral              ✓ Suppressed
Planned serial CBC              ✓ Suppressed
MRI of different body region    ✓ Suppressed
Medication stopped before due   ✓ Suppressed


Then overall:

Hard-negative pass: actual%.

14.25 Why This Matters

Pitch explanation:

"In a care-coordination workflow, false alerts consume the same limited time we're trying to save. So we benchmark not only what Continua finds, but what it correctly refuses to flag."

Excellent business + technical bridge.

14.26 Baseline Comparison

If Phase 9 has valid baselines, show:

System	Macro F1	Grounding	Hard NegativesNaive rules	actual	actual	actual
LLM-only	actual	actual	actual
Continua hybrid	actual	actual	actual

Do not highlight only dimensions where Continua wins.

14.27 If LLM-Only Wins on F1

Don't panic.

Suppose hypothetically:

LLM-only F1 > Continua


while:

grounding/reproducibility/hard negatives


favor Continua.

Tell the truth:

"The LLM-only baseline had stronger raw recall/F1 in this synthetic benchmark, while Continua's hybrid architecture produced stricter grounding and deterministic behavior."

That's intellectually stronger than hiding it.

14.28 Ablation Experience

Only display if it adds a clear conclusion.

Possible:

Full Continua

vs.

No normalization
No evidence gate
No reconciliation


Question answered:

Which architecture pieces matter?

No need to show all five possible ablations in primary UI.

14.29 One Good Ablation

If evidence gate effect is dramatic, use that.

If reconciliation dramatically lowers duplicate false positives, use that.

Choose based on measured insight, not expected narrative.

14.30 Priority Proof

Title:

Workflow priority, not clinical risk

Show:

Verified issue
      ↓
Workflow severity
+
Overdue time
+
Actionability
      ↓
Intervention priority


Then:

No demographic factor, diagnosis bonus, or LLM prediction affects priority-v1.

That's strong responsible-AI positioning.

14.31 Priority Invariance Results

If Phase 9 tested demographic mutations:

Test cases: N
Priority changes: 0


Label correctly:

Input-invariance test

Do not call it:

"Bias-free AI."

That would be far too broad.

14.32 Top-K Proof

Show:

Top-5 verified: 5/5

Top-5 matching benchmark truth: X/5


First is architecture.

Second is performance.

Don't conflate them.

14.33 Latency Experience

Separate:

Live

Raw synthetic records through extraction/intelligence.

Cached

Judge/application read path.

Example:

Live single-patient pipeline    X.X sec
Cached queue API                XX ms


Never:

Continua analyzes 80 patients in 20ms

when 20ms is merely cached retrieval.

14.34 Latency Context

If live 80-patient processing takes, say, tens of seconds, that's okay for a prototype.

Don't apologize unnecessarily.

The workflow is:

background/precomputation
→ fast coordinator reads


The cache architecture was designed for this.

14.35 Cost Experience

Only if actual provider usage data exists.

Could show:

Extraction cost / synthetic patient
Extraction cost / 80-patient benchmark


This might strengthen business feasibility.

But avoid it if provider pricing became uncertain or cost is trivial/noisy.

Phase 20 re-verifies current public pricing before submission if we publish it.

14.36 Failure Analysis

This is critical.

A strong system should admit mistakes.

Show:

Where Continua still fails

Top 3 actual failure categories.

For example structure:

1. Historical mentions incorrectly treated as occurrences
   N cases

2. Specialty alias normalization
   N cases

3. Monitoring evidence lost during extraction
   N cases


Actual categories come from Phase 9.

14.37 Why Show Failures?

Because one judge already has responsible-AI/research signals from your supplied dossier.

More broadly, it communicates:

evaluation maturity
honesty
roadmap awareness
technical understanding

Do not hide all failures behind:

"Limitations exist."

Show them.

14.38 Failure Drilldown

Click a failure family:

What happened
Which stage failed
How many cases
What we would fix next


Do not expose hidden benchmark answer during ordinary coordinator workflow.

This is evaluation/methodology territory.

14.39 Operational Impact Model

Now business value.

The question:

If Continua reduces manual information-search burden, what might that mean operationally?

Build a transparent calculator/model.

No black-box savings.

14.40 Basic Time Model

Suppose:

N = patients reviewed
B = baseline manual minutes/patient
C = Continua-assisted review minutes/patient


Modeled:

Time redirected =
N × (B - C)


But C is not automatically equivalent to system latency.

That's a crucial distinction.

14.41 System Latency ≠ Coordinator Review Time

Never compute:

12 minutes manual
-
8 seconds AI
=
11m52s saved


unless the assisted human workflow truly takes only eight seconds.

It won't.

The system may compute in eight seconds, but Sarah still:

reads issue
checks evidence
contacts patient
coordinates care

Therefore:

Do not build the ROI model around raw AI latency.

This is an important correction to earlier drafts.

14.42 Assisted Review Time

Until we actually time users completing the workflow:

assisted_review_time


is either:

measured via usability test, or
scenario assumption.

Label accordingly.

A better Phase-14 experiment is to measure the demo/user task:

Find highest-priority issue
Understand why
Open evidence


with and without Continua, if feasible.

14.43 Small Workflow Study

If time allows, create a modest internal usability evaluation.

For example:

Participants receive:

Condition A

Synthetic raw records.

Task:

Identify unresolved specialist follow-up.

Condition B

Continua.

Same/similar synthetic complexity.

Measure:

task-completion time
correct identification
evidence localization time

Even with a tiny sample, label:

Internal synthetic workflow study, n=X

not clinical trial.

This is much stronger than an arbitrary 12-minute assumption.

14.44 Study Design Caution

Avoid within-participant memorization.

Use paired but different synthetic cases of matched difficulty, counterbalance ordering if practical.

For hackathon scope even:

5–10 participants


could provide useful directional workflow evidence, but don't overstate it statistically.

No need for significance testing with tiny convenience samples.

Report descriptive results.

14.45 Impact Model Without Study

If no user study:

Keep impact model explicit:

Scenario:
80 patients

Assumed baseline review:
X min/patient

Assumed assisted review:
Y min/patient

Modeled redirected time:
Z hours


Allow judges to change assumptions mentally or with a calculator.

14.46 Interactive Impact Calculator

A small local calculator could be useful:

Inputs:

Patients
Manual review min/patient
Assisted review min/patient
Working days/month


Outputs:

Modeled time redirected/day
Modeled time redirected/month


No financial savings unless a wage/cost assumption is explicitly entered.

14.47 Input Bounds

If calculator exists, clamp values.

Example broad demo ranges:

patients: 1–1000
minutes: 0–120
days/month: 1–31


Validation prevents nonsense.

14.48 Don't Default to Heroic Assumptions

Avoid defaults like:

30 min current
15 sec Continua


That produces flashy but silly savings.

Use conservative, clearly described demo assumptions.

14.49 Financial Model

Optional.

If we model labor opportunity:

redirected hours
× loaded hourly labor cost


But this introduces another assumption.

Unless the sponsor case specifically needs dollars:

Time redirected is enough.

Jad-style business value does not require a fake dollar number.

14.50 Referral Leakage Impact

We researched potential referral leakage earlier.

But do not claim:

Continua recovered $870K.

At most:

Closing unresolved referrals can have operational and revenue implications; Continua surfaces them for verification.

External figures can appear as industry context if authoritative and current.

14.51 Patient Outcome Impact

Do not model:

prevented cancer progression
avoided mortality
prevented hospitalization

We do not have evidence for those.

Even as a model, that's too consequential for this prototype.

14.52 Assumption Ledger

Create a dedicated panel.

Example:

Assumption	Value	Why	Editable?Panel size	80	Demo dataset	No
Baseline review	X min	Scenario/Study	Maybe
Assisted review	Y min	Scenario/Study	Maybe
Working days	20	Model input	Yes

This immediately improves credibility.

14.53 External Evidence Registry

For every external statistic retained:

{
  "claim_id": "...",
  "claim": "...",
  "source_type": "EXTERNAL_RESEARCH",
  "publisher": "...",
  "title": "...",
  "url": "...",
  "publication_date": "...",
  "retrieved_at": "...",
  "supporting_excerpt_reference": "..."
}


Phase 20 can revalidate.

14.54 Source Hierarchy

Final external evidence preference:

government/public agency
peer-reviewed paper
professional medical association
primary company documentation
strong secondary industry source

Avoid building final business case on random marketing blogs if stronger evidence exists.

14.55 Limitations Panel

Title:

What this benchmark does not prove

List:

Synthetic data only.
Three supported gap types only.
No real-EHR deployment.
No clinical validation.
No patient-outcome measurement.
Artificial benchmark prevalence.
Limited normalization dictionary.
Monitoring rules are benchmark policies.
Priority is workflow prioritization, not clinical risk.

This is excellent, not embarrassing.

14.56 Scope Panel

Separate:

Built
structured extraction
deterministic gap detection
evidence verification
intervention priority
coordinator UX
benchmark
Not built
FHIR integration
real PHI
hospital deployment
clinical trial
EHR write-back
autonomous care decisions

Clear.

14.57 "Would You Deploy This?" Panel

Potential methodology FAQ:

No, not yet.

Then:

Prototype
↓
Real EHR integration
↓
Security/privacy review
↓
Retrospective validation
↓
Prospective shadow pilot
↓
Human-factor evaluation
↓
Controlled deployment


This shows maturity.

14.58 Judge-Facing Proof Screen

Primary proof should fit one 1440×900 screen if possible.

Layout:

┌────────────────────────────────────────────────────┐
│ HOW CONTINUA PERFORMS                              │
│ Frozen held-out synthetic benchmark                │
├────────────┬────────────┬────────────┬─────────────┤
│ Macro F1   │ Hard Neg.  │ Grounding  │ Top-5 Truth │
│ actual     │ actual     │ actual     │ actual       │
├──────────────────────────────┬─────────────────────┤
│ Per-detector P/R/F1          │ Trust               │
│ compact table                │ unsupported = ...   │
├──────────────────────────────┴─────────────────────┤
│ Limitations: synthetic-only · not clinical validation │
└────────────────────────────────────────────────────┘


No scrolling needed for the main proof.

14.59 Expandable Technical Details

Below/secondary route:

pipeline funnel
baselines
ablations
failure analysis
latency
cost
assumptions

Primary demo doesn't need them.

14.60 Visual Semantics for Claim Types

Use labels rather than relying only on color.

For example:

MEASURED
MODELED
ASSUMPTION
EXTERNAL
TARGET


Each gets a subtle visual style.

A modeled figure should never visually resemble measured benchmark output without its badge.

14.61 Copy Standards

Say:

Measured on continua-eval-v1.

Not:

Proven.

Say:

Modeled potential time redirected.

Not:

Time saved.

Say:

No unsupported displayed claims in this benchmark run.

Not:

Hallucination-free AI.

Say:

100% grounding on displayed gaps in our frozen synthetic benchmark.

Not:

100% medically accurate.

14.62 "Zero Hallucinations" Is Banned

Even if unsupported displayed claims = 0 in this benchmark, don't say:

Zero hallucinations.

Why?

The extractor could still make errors that the evidence gate suppresses.

Use:

0 unsupported claims reached the coordinator-facing output in this benchmark run.

Precise and defensible.

14.63 "100% Grounded" Needs Context

Good:

100% of displayed gaps in the held-out synthetic benchmark had all required evidence checks pass.

Bad:

Continua is 100% grounded.

Always include benchmark scope.

14.64 Failure Examples

If possible select one actual:

false positive blocked by evidence layer

and/or:

false negative caused by extraction

to demonstrate.

Show:

The system isn't perfect, and we know why.

Research-minded judges appreciate this.

14.65 Failure Example Privacy

All are synthetic.

Still label as synthetic.

No confusion with a real patient case.

14.66 Benchmark Card

Every displayed benchmark should show:

Benchmark
continua-eval-v1

Dataset
continua-synth-v1

Partition
final / held-out

Date
run date

Synthetic
yes


Technical details can hide Git SHA behind expand.

14.67 Version Consistency

Evaluation screen pulls directly from:

continua-demo-cache-v1/evaluation.json


Claim registry checks same run.

No manual duplication.

14.68 Reproducible Impact Calculation

Impact model code should be a pure function.

Example:

calculateRedirectedTime(inputs)


Unit tested.

Do not calculate separately in:

frontend
PDF
executive summary

Generate outputs from one canonical function/artifact.

14.69 Reproducible Benchmark Summaries

Similarly:

benchmark summary


should derive from final benchmark JSON.

Submission copy can consume exported values later.

Avoid typing metrics into five files manually.

14.70 Claim Export

Create:

npm run export:claims


Output:

artifacts/claims/
├── approved-claims.json
├── approved-claims.md
└── submission-metrics.json


Later Phases 19–21 use this.

Excellent protection against inconsistency.

14.71 Claim Validation Script
npm run validate:claims


Checks:

source exists
benchmark run valid
measured value matches artifact
model formula resolves
assumption exists
external source metadata complete
no retired claim used
14.72 Claim Surface Audit

Search:

UI
README
demo script
docs

for quantitative values.

Every public number should map to:

claim_id


This can be partially manual for hackathon scope.

14.73 Error Bars / Uncertainty

For our synthetic benchmark, don't add statistical confidence intervals unless we calculate them meaningfully.

With a small benchmark:

show sample size.

That's often enough.

For any user-study median:

show n.

Don't manufacture scientific sophistication.

14.74 Statistical Significance

Don't say:

statistically significant

unless you actually ran an appropriate study with sufficient design/power.

We almost certainly won't need that claim.

14.75 Evaluation Experience Tests
EVX-01

Every metric shown equals final benchmark JSON.

EVX-02

No metric labeled "accuracy" unless specifically mathematically accuracy.

EVX-03

Held-out partition visible.

EVX-04

Synthetic limitation visible.

EVX-05

Per-detector values sum/derive correctly.

EVX-06

No NaN/Infinity/null displayed as numbers.

EVX-07

Unavailable metric renders "Not measured."

EVX-08

Baseline values come from baseline artifacts.

EVX-09

Grounding scope explicitly stated.

EVX-10

Failure counts match final errors.

14.76 Impact Experience Tests
IMP-01

Every modeled output has explicit formula.

IMP-02

Every assumption is visible.

IMP-03

Changing assumption updates model correctly.

IMP-04

Measured latency isn't used as assisted-review time.

IMP-05

No patient-outcome savings modeled.

IMP-06

No financial savings without explicit cost assumption.

IMP-07

External figures have source metadata.

IMP-08

Modeled values visually labeled.

14.77 Claim Red-Team

Ask the most hostile interpretations.

Attack A

"You're claiming this works clinically."

Can any UI copy support that interpretation?

If yes, fix.

Attack B

"You're calling cached retrieval AI latency."

Fix.

Attack C

"You picked only your successful cases."

Held-out benchmark should answer.

Attack D

"You hide false positives."

Hard-negative report.

Attack E

"100% grounding means 100% accuracy?"

UI must explicitly distinguish them.

Attack F

"Your business savings are made up."

Expose assumptions/formula.

Attack G

"Your dataset makes your rules look good."

Expose synthetic benchmark limitations/baselines.

Attack H

"Why should I trust your metrics?"

Frozen artifacts + hashes + reproducibility.

14.78 Performance

Evaluation payload is small.

Target:

headline metrics immediate
details lazily rendered if needed


No need for heavy chart libraries if simple CSS/table suffices.

Avoid adding 300 KB just for fancy graphs.

14.79 Expected Files
lib/claims/
├── types.ts
├── registry.ts
├── validate.ts
├── export.ts
└── classifications.ts

lib/impact/
├── types.ts
├── model.ts
├── assumptions.ts
├── validate.ts
└── format.ts

components/evaluation/
├── BenchmarkHeader.tsx
├── MetricCard.tsx
├── DetectorTable.tsx
├── PipelineFunnel.tsx
├── TrustScorecard.tsx
├── NegativeCases.tsx
├── BaselineComparison.tsx
├── FailureAnalysis.tsx
└── LimitationsPanel.tsx

components/impact/
├── ImpactSummary.tsx
├── ImpactCalculator.tsx
├── AssumptionLedger.tsx
├── ClaimBadge.tsx
└── ExternalEvidence.tsx

tests/claims/
tests/impact/
tests/evaluation-experience/

scripts/
├── export-claims.ts
├── validate-claims.ts
├── audit-claim-surfaces.ts
└── verify-external-claims.ts

docs/impact/
├── evaluation-story.md
├── impact-model.md
├── assumption-ledger.md
├── external-evidence.md
├── claim-registry.md
├── limitations.md
└── approved-claims.md

artifacts/claims/
├── approved-claims.json
├── approved-claims.md
└── submission-metrics.json

14.80 Execution Order

Use this order:

14.0 Select frozen Phase-9 final benchmark
        ↓
14.1 Freeze claim taxonomy
        ↓
14.2 Build claim registry
        ↓
14.3 Register all measured benchmark claims
        ↓
14.4 Build evaluation hero
        ↓
14.5 Build per-detector view
        ↓
14.6 Build pipeline funnel
        ↓
14.7 Build trust scorecard
        ↓
14.8 Build hard-negative view
        ↓
14.9 Add baseline comparison
        ↓
14.10 Add useful ablations
        ↓
14.11 Build ranking proof
        ↓
14.12 Build latency distinction
        ↓
14.13 Build failure analysis
        ↓
14.14 Freeze impact-model variables
        ↓
14.15 Build assumption ledger
        ↓
14.16 Implement pure impact calculator
        ↓
14.17 Register external research claims
        ↓
14.18 Build limitations panel
        ↓
14.19 Build judge-facing proof screen
        ↓
14.20 Export approved claims
        ↓
14.21 Validate every calculation
        ↓
14.22 Audit claim surfaces
        ↓
14.23 Claim red-team
        ↓
14.24 Freeze Proof & Impact Experience v1

14.81 Quantitative Gates
Requirement	GateDisplayed measured claims matching benchmark	100%
Unclassified public quantitative claims	0
Modeled metrics without formula	0
Scenario assumptions hidden	0
External claims without source metadata	0
Cached latency mislabeled live processing	0
System latency used as human review time	0
Patient-outcome claims	0
Clinical-validation claims	0
Grounding claim missing benchmark scope	0
Benchmark sample size hidden where relevant	0
Failure-analysis benchmark mismatches	0
Impact calculation test failures	0
NaN/Infinity visible	0
Approved claim registry coverage	100% final claims
14.82 Acceptance Gates
Gate A: Measurement integrity

Every measured claim derives directly from a frozen artifact.

PASS / FAIL

Gate B: Modeling integrity

Every modeled claim exposes assumptions and formula.

PASS / FAIL

Gate C: Research integrity

External evidence is sourced and clearly distinguished.

PASS / FAIL

Gate D: Trust interpretation

Judges cannot reasonably confuse grounding with clinical accuracy.

PASS / FAIL

Gate E: Benchmark transparency

Held-out/synthetic scope and sample size are visible.

PASS / FAIL

Gate F: Failure transparency

Material failure modes are explicitly shown.

PASS / FAIL

Gate G: Business credibility

Operational benefit can be explained without fake financial claims.

PASS / FAIL

Gate H: Technical credibility

A technical judge can inspect detector, grounding, baseline and funnel results.

PASS / FAIL

Gate I: Cross-surface consistency

UI, README, demo script, and export artifacts use identical numbers.

PASS / FAIL

Gate J: Claim red-team

No consequential overstatement survives review.

PASS / FAIL

All ten must pass.

14.83 Exit Report

Populate only from actual artifacts:

CONTINUA PROOF & IMPACT EXPERIENCE V1

Approved claims:                  XX
Measured:                         XX
Modeled:                          XX
Scenario assumptions:            XX
External research:                XX
Future targets:                   XX

Unclassified claims:               0
Benchmark mismatches:               0
Unsupported external claims:        0


EVALUATION EXPERIENCE

Headline metrics:                   4
Per-detector view:                PASS
Pipeline funnel:                  PASS
Trust scorecard:                  PASS
Hard-negative view:               PASS
Baseline comparison:             PASS / N/A
Failure analysis:                PASS


IMPACT

Model formula validated:          PASS
Assumptions visible:              PASS
Human review time measured:       YES / NO
Financial impact modeled:         YES / NO

Patient-outcome claims:              0
Clinical-validation claims:          0


CONSISTENCY

UI ↔ benchmark:                   PASS
Demo ↔ benchmark:                 PASS
README ↔ approved claims:         PASS
Export artifact:                  PASS

Claim red-team:
PASS / FAIL

14.84 Failure Conditions

Do not proceed when:

measured and modeled results look identical;
"12 minutes → 8 seconds" returns as an unsupported time-savings claim;
F1 gets renamed "accuracy";
cached API latency becomes analysis latency;
grounding becomes "hallucination-free";
small-sample perfect results omit sample size;
benchmark limitations are hidden;
external healthcare statistics have weak or missing sourcing;
financial savings lack explicit assumptions;
product implies patient outcomes improved;
different submission surfaces contain different metrics.

Any of these damages trust more than a modest benchmark result ever would.

14.85 Handoff to Phase 15

After this phase, Continua has:

Problem
✓

Intelligence
✓

Evidence
✓

Priority
✓

Benchmark
✓

Product
✓

Flagship Story
✓

Proof Layer
✓


Phase 15 moves into Safety, Privacy & Responsible AI.

It will formalize:

safety threat model
prohibited clinical behavior
PHI boundary
prompt/data handling
auditability
unsafe-output regression testing
data retention principles
human-in-the-loop controls
healthcare deployment caveats
responsible-AI package

rather than merely displaying a disclaimer.

Phase 14 Definition of Done

Phase 14 is genuinely complete when a skeptical judge can ask:

"What did you actually measure?"

and we can show it.

Then:

"What part is just an assumption?"

and we can show it.

Then:

"Where does Continua fail?"

and we can show it.

Then:

"Why should I believe your business impact?"

and we can show the exact model and let them challenge the assumptions.

And finally:

"Are you claiming this is clinically validated?"

and the answer is immediately:

"No. This is a synthetic-data prototype evaluated on a frozen benchmark. We separate benchmark correctness, modeled operational impact, and future clinical validation."

When our strongest presentation survives those five questions without retreating from any visible claim:

CONTINUA PHASE 14: PROOF & IMPACT EXPERIENCE v1 FROZEN

Next: Phase 15 — Safety, Privacy & Responsible AI, where Continua's safety boundaries become enforceable engineering controls rather than presentation language.
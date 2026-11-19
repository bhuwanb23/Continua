Continua Phase 8: Intervention Priority Engine

Phase 7 ensures Continua only reasons over verified, inspectable continuity gaps. Phase 8 solves the product question that originally motivated the whole project:

A care coordinator has 80 patients. Which 5 deserve attention first, why are they ahead of the others, and can we explain that ranking without pretending to predict clinical risk?

The answer must not be a mysterious AI risk score.

Phase 8 mission: Build priority-v1, a deterministic, explainable intervention-priority system that ranks only verified coordination gaps and converts an 80-patient panel into a defensible Top-5 action queue.

8.0 Core Architecture
VerifiedGap[]
      ↓
Eligibility Gate
      ↓
Gap-Level Priority
      ↓
Patient-Level Aggregation
      ↓
Deterministic Tie-Breaking
      ↓
Ranked Patient Panel
      ↓
Top-K Selection
      ↓
Explanation Generation
      ↓
Coordinator Queue

80 patients
      ↓
5 need attention
      ↓
Why?
      ↓
What should Sarah verify next?

Hard invariant
CandidateGap       ✗
Ungrounded Gap     ✗
Clinical Risk      ✗
LLM Ranking        ✗

VerifiedGap
     ↓
Deterministic Intervention Priority
     ✓

8.1 Inputs

Phase 8 consumes frozen:

VerifiedGap v1
evidence-v1
gaps-v1
gap-policy-v1
clinical-event-v1
fixed evaluation date
patient IDs
verified coordinator-action templates

It must not consume:

raw documents
LLM output directly
hidden ground truth
actual patient outcomes
manually specified top-5 ranking
fixture-specific bonuses
8.2 Outputs

Phase 8 produces:

priority-v1

plus:

GapInterventionPriority
PatientInterventionPriority
ranked panel
Top-K queue
factor breakdowns
deterministic explanation
ranking audit trail
metamorphic tests
priority benchmark report
Maria ranking regression
8.3 Non-Goals

Phase 8 does not predict:

mortality
readmission
disease severity
emergency deterioration
treatment response
clinical prognosis
likelihood of cancer progression
likelihood that a patient will "fall through the cracks" as a statistical probability

We are ranking:

verified coordination work items

not predicting:

patient clinical risk.

That distinction must remain visible in code, API, copy, README, demo, and executive summary.

8.4 Phase Structure
Subphase	Workstream	Result8.0	Handoff	Verified-gap inputs validated
8.1	Priority contract	Semantics frozen
8.2	Eligibility	Only valid gaps ranked
8.3	Factor definitions	Explainable inputs
8.4	Severity factor	Workflow importance
8.5	Temporal factor	Overdue magnitude
8.6	Evidence factor	Evidence quality handling
8.7	Actionability factor	Coordinator usefulness
8.8	Gap-type factor	Conservative policy weighting
8.9	Gap scoring	One verified gap → score
8.10	Patient aggregation	Many gaps → one patient
8.11	Score mapping	Raw → 0–100 display
8.12	Priority bands	Critical/High/Medium/Low
8.13	Tie-breaking	Stable ordering
8.14	Top-K	80 → 5
8.15	Explanation	Why ranked here
8.16	API contract	Queue-ready output
8.17	Invariants	Safety/behavior tests
8.18	Metamorphic tests	Ranking behavior
8.19	Fairness/sensitivity	Hidden bias checks
8.20	Maria regression	Demo patient behavior
8.21	Red-team	Gaming attacks
8.22	Benchmark	Measured queue behavior
8.23	Freeze	priority-v1
8.5 Priority Semantics

Freeze the definition:

Intervention Priority

A deterministic workflow score representing the relative urgency and actionability of a verified coordination issue within Continua's synthetic benchmark policy.

It does not mean:

Probability of harm.

It does not mean:

Clinical severity.

It does not mean:

Patient risk.

8.6 Naming Contract

Use only:

gap_priority_score
patient_priority_score
priority_band
priority_breakdown


Forbidden:

risk_score
clinical_risk
patient_risk
danger_score
AI_risk


Even internal variable names should comply.

We don't want clinical-risk semantics leaking back later.

8.7 Eligibility Gate

Before scoring any gap:

gap is VerifiedGap?
    ↓ yes

grounded == true?
    ↓ yes

evidence version valid?
    ↓ yes

event-store hash current?
    ↓ yes

policy version current?
    ↓ yes

→ ELIGIBLE


Otherwise:

NOT RANKED


There is no "low score" for unverified gaps.

They simply do not participate.

8.8 Patient Eligibility

A patient with:

0 verified gaps


has:

patient_priority_score = 0
priority_band = LOW / NONE


I'd actually recommend NONE internally, with the coordinator UI showing:

No verified continuity issues found.

Do not mark an unaffected patient "low risk."

Again, this isn't risk.

8.9 Priority Factors

Keep the engine deliberately small.

Recommended factors:

Workflow severity
Overdue factor
Evidence quality factor
Actionability factor
Gap-type policy weight

No demographics.

No cancer diagnosis bonus.

No sex.

No race/ethnicity.

No socioeconomic status.

No hospital identity.

No provider identity.

No manually added importance for Maria.

8.10 Why These Five Factors?
Severity

Represents frozen workflow significance.

Overdue duration

An issue unresolved longer should generally rise.

Evidence quality

More securely supported issues can receive the full intervention weighting.

Actionability

Sarah should see work she can actually act on.

Gap type

Allows modest product-policy differentiation without pretending all gap types have identical operational consequences.

But this factor must remain conservative.

8.11 Base Formula

A reasonable frozen starting formula:

raw_gap_priority =

severity_weight
× overdue_factor
× evidence_factor
× actionability_weight
× gap_type_weight


The exact weights need to be frozen before final benchmark evaluation.

No LLM.

No learned model.

8.12 Severity Weights

Use simple values.

For example:

HIGH    = 1.00
MEDIUM  = 0.70
LOW     = 0.45


These are workflow weights.

They are not medically validated risk coefficients.

Document that explicitly.

8.13 Temporal Factor

This is where the early 1.75 example originated, but we should make the function explicit instead of hardcoding magic examples.

For temporal gaps:

overdue_ratio = overdue_days / window_days


Then clamp.

Example:

not overdue:          0.75
0–25% overdue:        1.00
25–50% overdue:       1.15
50–100% overdue:      1.35
>100% overdue:        1.50


That's only an illustrative candidate.

We need to decide whether we truly want "not overdue" gaps ranked at all.

Given Phase 6's stricter logic, genuine benchmark gaps should normally be overdue.

So we can simplify further.

8.14 Recommended Temporal Policy

For actual verified Phase-8 gaps:

Missed follow-up / monitoring
1–7 overdue days   → 1.00
8–30               → 1.15
31–60              → 1.30
61–90              → 1.40
>90                → 1.50

Duplicate test

No overdue concept.

Use:

temporal_factor = 1.0


The test interval already determines detector eligibility/severity.

This avoids pretending days_between is equivalent to overdue days.

8.15 Evidence Factor

I would change the earlier design substantially.

Because Phase 7 now creates a strict VerifiedGap, evidence is already binary at the critical threshold.

Therefore don't heavily rank patients based on LLM confidence.

Recommended:

verified exact evidence        → 1.00
verified fuzzy evidence        → 0.95
mixed exact/fuzzy              → 0.97


or even simpler:

all VerifiedGap → 1.0

My preference

Use 1.0 for all verified gaps in v1.

Why?

We shouldn't let poorly calibrated extraction confidence quietly move patient rankings.

Phase 7 already decided whether evidence was acceptable.

This simplifies and strengthens the architecture.

8.16 Actionability Factor

This factor can be useful.

Examples:

Clearly actionable by coordinator
Verify referral status
Contact patient
Coordinate follow-up


→ 1.0

Requires someone else's review
Review potential repeat diagnostic history


→ 0.85

Informational only

Should probably not enter the intervention queue at all.

8.17 Freeze Actionability by Gap Type

For v1, don't assign actionability dynamically.

Use deterministic mappings.

Example:

missed_followup → 1.00
med_monitoring  → 0.95
duplicate_test  → 0.85


These are workflow-policy constants, not clinical values.

8.18 Gap-Type Weight

Question:

Do we even need this if severity and actionability already differentiate?

Possibly not.

Simpler architecture wins.

Recommended v1

Set:

gap_type_weight = 1.0


for all 3 types.

Then don't pretend we know one is inherently more clinically important.

If future sponsor requirements justify operational weighting, change in priority-v2.

This is cleaner.

8.19 Recommended priority-v1 Formula

I would lock:

raw_gap_priority =
severity_weight
× temporal_factor
× actionability_weight


where:

evidence_factor = excluded because every input is already verified

gap_type_weight = excluded because no arbitrary clinical hierarchy


This is stronger than the earlier five-factor draft.

Less complexity.

More defensibility.

8.20 Worked Examples
Example A: Missed oncology follow-up

Suppose:

severity = HIGH
overdue = 3 days
actionability = 1.00


Then:

1.00 × 1.00 × 1.00
= 1.00

Example B: 45-day overdue referral
HIGH
45 days overdue
1.00 actionability


Using:

31–60 days → 1.30


result:

1.00 × 1.30 × 1.00
= 1.30


Therefore Example B should outrank Maria's 3-day-overdue referral, all else equal.

That's correct.

We should not distort the formula just to keep Maria #1.

8.21 Maria Ranking Consequence

This is important.

Maria was previously manually expected to be:

rank #1


But after correcting:

45 days overdue

to:

~3 days overdue,

she might no longer legitimately rank #1.

Rule

Do not rig Phase 8 to preserve the storyboard.

If another patient's verified issue is more urgent under the frozen rules:

that patient ranks first.

We have two honest options:

Option A

Maria naturally ranks somewhere in top 5 and demo clicks her.

Perfectly fine.

Option B

If the demo truly needs Maria at #1, redesign the synthetic scenario before final dataset freeze so she legitimately deserves it.

But Phases 2/3 are supposedly frozen now, so changing her requires explicit dataset/eval version governance.

Don't silently cheat.

8.22 Score Normalization

Raw values like:

1.30


aren't user-friendly.

Convert to display score:

0–100


using a deterministic non-data-trained transform.

For example:

display_score =
round(
  100 × raw_score / MAX_RAW_SCORE
)


where MAX_RAW_SCORE comes from theoretical formula bounds, not observed panel maxima.

8.23 Why Not Panel-Relative Normalization?

Avoid:

current highest patient = 100


because score changes when unrelated patients enter the panel.

We want:

same issue → same priority score.

Independent of panel composition.

8.24 Theoretical Maximum

If:

severity max       = 1.00
temporal max       = 1.50
actionability max  = 1.00


then:

MAX_RAW_GAP = 1.50


So:

gap_priority_score =
round(raw / 1.50 × 100)


Example:

1.30 → 87
1.00 → 67


This is simple and explainable.

8.25 Priority Bands

Freeze bands independently of panel.

Example:

CRITICAL  ≥ 80
HIGH      60–79
MEDIUM    35–59
LOW       1–34
NONE      0


But be careful with wording:

CRITICAL sounds clinical.

Better recommendation

Use:

IMMEDIATE
HIGH
ROUTINE
LOW
NONE


or:

P1
P2
P3
P4
NONE


I prefer:

P1 — Act first
P2 — High priority
P3 — Review
P4 — Low priority


because CRITICAL can be interpreted as medical acuity.

8.26 Change From Previous Contract

Earlier API froze:

CRITICAL/HIGH/MEDIUM/LOW


If Phase 0 is genuinely frozen, changing this requires:

spec amendment

not casual modification.

We need to decide carefully.

My practitioner recommendation

Amend it now to workflow-oriented labels before implementation crystallizes:

P1
P2
P3
P4
NONE


UI:

P1 · Act first


This removes clinical ambiguity.

Document:

SPEC-1.1 amendment: priority labels clarified as workflow priority.

This is worth the controlled change.

8.27 Gap-Level Priority Object
type GapInterventionPriority = {
  gap_id: string;

  raw_score: number;
  gap_priority_score: number;

  priority_band:
    | "P1"
    | "P2"
    | "P3"
    | "P4";

  breakdown: {
    severity_weight: number;
    temporal_factor: number;
    actionability_weight: number;
  };

  priority_version: "priority-v1";
};

8.28 Multiple Gaps Per Patient

Now the important question:

How do three verified gaps become one patient priority?

Naive:

sum all scores


is bad.

A patient with five low-priority issues could overpower one genuinely urgent issue.

Naive:

max only


ignores workload compounding.

Use:

max gap dominates + capped secondary contribution.

This idea from the earlier architecture remains good.

8.29 Patient Aggregation Formula

Recommended:

patient_raw_priority =

max_gap_raw
+
SECONDARY_FACTOR
× sum(other_gap_raw)


then cap secondary contribution.

Example:

secondary_factor = 0.10
secondary_bonus_cap = 0.30


Thus:

patient_raw =
max_gap
+
min(
  0.10 × sum(other gaps),
  0.30
)


This ensures the most important gap dominates.

8.30 Why Cap Secondary Gaps?

Otherwise quantity becomes an exploit.

Example:

Patient A
1 serious unresolved referral

Patient B
6 weak repeat-test alerts


We don't want B automatically outranking A just because the system generated more cards.

Capped contribution reduces alert-volume bias.

8.31 Patient Maximum

If max gap:

1.5


and secondary bonus cap:

0.30


then:

MAX_RAW_PATIENT = 1.80


Display:

patient_priority_score =
round(
  patient_raw / 1.80 × 100
)


Again, theoretical normalization.

8.32 Patient Breakdown

Expose:

{
  "patient_priority_score": 82,
  "priority_band": "P1",
  "breakdown": {
    "top_gap_raw": 1.30,
    "secondary_gap_count": 2,
    "secondary_raw_sum": 0.72,
    "secondary_factor": 0.10,
    "secondary_bonus": 0.072,
    "patient_raw_score": 1.372
  }
}


A judge can inspect exactly why someone ranked #2.

8.33 No Demographic Factors

Create tests to ensure patient records cannot influence ranking through:

name
sex
age
race
ethnicity
ZIP code
insurance
income
provider identity
hospital identity


unless someday explicitly justified and validated in a new product version.

For priority-v1, these fields are prohibited inputs.

8.34 No Diagnosis-Based Bonus

Even oncology itself should not get a hidden boost.

We're demonstrating an oncology workflow.

We're not claiming cancer patients should automatically rank above everyone else.

Only verified gap properties determine priority.

This is a very important responsible-AI story.

8.35 Tie-Breaking

Ties must be deterministic.

Recommended order:

patient priority score descending;
top-gap raw score descending;
top-gap overdue days descending where applicable;
verified-gap count descending;
stable patient_id ascending.

Never random.

Never name-based.

Never last insertion order.

8.36 Top-K Engine

Input:

ranked patients


Output:

first K


Default:

K = 5


But core ranking should support:

K = 1–80


within safe bounds.

Top 5 is product choice, not mathematical limitation.

8.37 Queue Item Contract

Example:

type QueueItem = {
  rank: number;

  patient_id: string;

  display_name: string;

  patient_priority_score: number;

  priority_band: PriorityBand;

  top_gap: {
    gap_id: string;
    gap_type: GapType;
    title: string;
    gap_priority_score: number;
  };

  verified_gap_count: number;

  headline: string;

  recommended_coordinator_action: string;

  explanation: PriorityExplanation;
};

8.38 Headline Generation

No LLM needed.

Templates:

Follow-up
Oncology follow-up unresolved · 3 days overdue

Duplicate
Possible repeat CBC · 8 days apart

Monitoring
Monitoring unresolved · 25 days overdue


Use "appears unresolved" or "not found in available records" where relevant.

8.39 Queue Explanation

Example:

Why P1?

Top verified issue:
Oncology follow-up unresolved

Workflow severity:
High

Overdue:
45 days

Action:
Verify referral status and coordinate follow-up

Other verified issues:
2


No black box.

8.40 Priority API Contract

Earlier:

GET /api/panels/{panelId}/queue?k=5


Now response should have separated scores.

Example:

{
  "rank": 1,
  "patient_id": "...",
  "name": "...",

  "patient_priority_score": 82,
  "priority_band": "P1",

  "top_gap": {
    "gap_id": "...",
    "gap_type": "missed_followup",
    "gap_priority_score": 87
  },

  "verified_gap_count": 3,

  "headline": "...",

  "recommended_action": "...",

  "priority_version": "priority-v1"
}


No generic priority_score.

8.41 Priority Breakdown Endpoint

Could be included in patient endpoint rather than another route.

Need support for:

Why is this patient P1?


One click maximum in final UX.

That requirement came from earlier research and remains strong.

8.42 Deterministic Priority Explanation

Store factor labels.

For example:

{
  "severity": {
    "value": "high",
    "weight": 1.0
  },
  "temporal": {
    "overdue_days": 45,
    "factor": 1.3
  },
  "actionability": {
    "class": "direct_coordinator_action",
    "weight": 1.0
  }
}


No vague:

AI thinks this patient is important.

8.43 Priority Invariants

Freeze.

INV-P1

Only VerifiedGap contributes.

INV-P2

Adding an unverified candidate changes nothing.

INV-P3

Increasing overdue duration cannot reduce priority.

INV-P4

Lowering workflow severity cannot increase priority.

INV-P5

More secondary gaps cannot reduce patient priority.

INV-P6

Secondary contribution never exceeds cap.

INV-P7

Changing patient demographics changes nothing.

INV-P8

Changing patient name changes nothing.

INV-P9

Event order changes nothing.

INV-P10

Same inputs produce identical ranking.

8.44 Metamorphic Tests

These are Phase 8's strongest tests.

MP-01 Overdue monotonicity

3 days → 30 days overdue.

Score cannot fall.

MP-02 Resolution

Remove/resolved top gap.

Patient score must fall or stay equal if another identical top gap exists.

MP-03 Add weak gap

Add low-priority secondary gap.

Patient score may rise slightly, never above bonus cap.

MP-04 Add ten weak gaps

Still cannot exceed capped secondary contribution.

MP-05 Demographic substitution

Change:

54F Maria Chen


to fabricated:

72M David Brooks


while holding gaps identical.

Priority must remain byte-identical.

MP-06 Exact vs fuzzy evidence

If both are Phase-7 VerifiedGap and evidence isn't a scoring factor:

priority unchanged.

Good.

MP-07 Reorder patients

Ranking identical.

MP-08 Add unrelated no-gap patient

Existing scores/ranks only shift by insertion if that patient has actual verified priority, otherwise unchanged.

8.45 Sensitivity Analysis

Before freezing weights, test how ranking changes when:

severity weights ±10–20%
temporal thresholds adjusted modestly
secondary factor adjusted
secondary cap adjusted


Goal:

Ensure Top-5 isn't wildly unstable from tiny arbitrary weight changes.

If rank #1 changes constantly under small perturbations, the priority design is too fragile.

8.46 What Sensitivity Analysis Is NOT

It is not:

Find the weights that rank Maria first.

That's benchmark gaming.

Instead:

Find a simple region where ranking remains interpretable and stable.

Freeze weights before held-out evaluation.

8.47 Rank Stability Metric

Optional but valuable.

Compute top-5 overlap under reasonable perturbations.

Example:

Jaccard(top5_base, top5_perturbed)


or:

Top-5 retention rate


No need for overly sophisticated ranking statistics.

8.48 Priority Evaluation

We don't have real-world care-coordinator adjudications.

So we cannot claim:

Ranking accurately predicts what coordinators should clinically prioritize.

We can evaluate:

Formula correctness

Did implementation match spec?

Monotonicity

Behavior expected?

Determinism

Stable?

Hard-case ordering

Does explicitly more-overdue otherwise-identical issue rank higher?

Top-5 precision

Are Top-5 patients backed by genuine ground-truth gap instances?

Evidence eligibility

Any suppressed/unverified items sneaking in?

8.49 Top-5 Precision

Against Phase 3 truth:

Top5Precision =
patients in top 5 with at least one matching true gap
/
5


Ideally:

1.0


But measured, not assumed.

8.50 Queue Trust Metric

Also measure:

verified_gaps_in_queue
/
all_queue_gaps


Hard requirement:

100%

8.51 Alert Burden

Monitor:

average verified gaps per flagged patient


and:

number of patients ranked >0


If 70/80 patients are "urgent," the system isn't useful.

The dataset was designed partly to prevent this.

8.52 Queue Compression Ratio

Product metric:

eligible patient panel / displayed Top-K


For demo:

80 → 5


But don't pretend the other 75 are clinically safe.

Say:

"The queue surfaces the top five verified coordination items first."

Not:

"The other 75 don't need care."

8.53 Correct Demo Language

Excellent:

"Of 80 synthetic patients, Continua prioritizes the five highest-ranked verified coordination issues."

Bad:

"Only five patients need care today."

The latter is a clinical claim we did not establish.

Our tagline can remain punchy, but formal copy must stay precise.

8.54 Maria Regression

Maria should:

receive a deterministic score;
have the corrected follow-up overdue duration;
have exactly the verified gaps remaining after Phase 7;
receive no hidden oncology bonus;
rank according to the same formula as everyone.
Important

Do not make:

Maria must be rank #1


a Phase 8 correctness test.

Instead:

Maria's computed priority must equal the frozen formula output.


Whether that is rank #1, #3, or #5 is an empirical result.

This is more honest than our older acceptance test.

8.55 Demo Story Adaptation

If Maria ranks #3:

Demo says:

"Sarah's morning queue narrows 80 patients to five verified interventions. Let's open Maria."

No problem.

The wow moment still works.

The demo doesn't require her to be #1.

That removes pressure to game the score.

8.56 Priority Failure Taxonomy

Freeze:

PR-001

Unverified gap ranked.

PR-002

Formula mismatch.

PR-003

Temporal factor incorrect.

PR-004

Severity mapping incorrect.

PR-005

Actionability mapping incorrect.

PR-006

Secondary bonus exceeds cap.

PR-007

Patient score normalization wrong.

PR-008

Non-deterministic tie.

PR-009

Demographic field affected priority.

PR-010

Patient-specific exception.

PR-011

Stale priority calculated from outdated gap set.

PR-012

Score/band mismatch.

8.57 Version/State Validation

Priority result must carry hashes/versions:

priority_version
evidence_version
detector_version
verified_gap_set_hash
evaluation_as_of_date


If gap set changes:

priority is stale.

Recompute.

8.58 No LLM

Phase 8 is another local deterministic phase.

LLM calls = 0


Now Continua's architecture has a compelling shape:

AI:
fact extraction

Deterministic:
gap detection
evidence verification
priority ranking


That's a strong differentiator.

8.59 Performance

Ranking 80 patients should be trivial.

Measure anyway:

single patient priority calculation
whole panel
Top-K generation


Expected to be tiny relative to extraction.

If queue ranking takes hundreds of milliseconds or seconds, inspect the implementation.

8.60 File Layout

Expected:

lib/priority/
├── types.ts
├── eligibility.ts
├── severity.ts
├── temporal.ts
├── actionability.ts
├── gap-score.ts
├── patient-score.ts
├── normalize-score.ts
├── bands.ts
├── ties.ts
├── rank.ts
├── top-k.ts
├── explain.ts
├── invariants.ts
└── version.ts

tests/priority/
├── eligibility.test.ts
├── gap-score.test.ts
├── patient-score.test.ts
├── temporal.test.ts
├── bands.test.ts
├── ties.test.ts
├── top-k.test.ts
├── metamorphic.test.ts
├── demographic-invariance.test.ts
├── sensitivity.test.ts
├── stale-state.test.ts
└── maria.test.ts

scripts/
├── build-priority.ts
├── eval-priority.ts
├── sensitivity-priority.ts
└── inspect-ranking.ts

docs/priority/
├── priority-contract.md
├── formula.md
├── factor-rationale.md
├── aggregation.md
├── responsible-ranking.md
├── sensitivity-analysis.md
└── benchmark-results.md

artifacts/priority/
└── <run-id>/
    ├── metadata.json
    ├── gap-priorities.json
    ├── patient-priorities.json
    ├── queue.json
    ├── sensitivity.json
    └── evaluation.json

8.61 Execution Order

Follow this sequence:

8.0 Verify Phase-7 handoff
      ↓
8.1 Freeze priority semantics
      ↓
8.2 Controlled SPEC amendment for workflow bands
      ↓
8.3 Define GapInterventionPriority
      ↓
8.4 Define PatientInterventionPriority
      ↓
8.5 Implement VerifiedGap eligibility
      ↓
8.6 Freeze severity weights
      ↓
8.7 Freeze temporal factors
      ↓
8.8 Freeze actionability mappings
      ↓
8.9 Eliminate unnecessary evidence/type weights
      ↓
8.10 Implement gap scoring
      ↓
8.11 Freeze secondary-factor + cap
      ↓
8.12 Implement patient aggregation
      ↓
8.13 Implement theoretical score normalization
      ↓
8.14 Implement workflow bands
      ↓
8.15 Implement deterministic ties
      ↓
8.16 Implement Top-K
      ↓
8.17 Build structured explanations
      ↓
8.18 Implement API/domain contracts
      ↓
8.19 Unit/invariant tests
      ↓
8.20 Metamorphic tests
      ↓
8.21 Demographic-invariance tests
      ↓
8.22 Sensitivity analysis
      ↓
8.23 Maria regression
      ↓
8.24 Run complete frozen panel
      ↓
8.25 Evaluate Top-5 quality
      ↓
8.26 Red-team
      ↓
8.27 Freeze priority-v1

8.62 Quantitative Gates
Requirement	GateUnverified gaps ranked	0
LLM calls	0
Raw-document reads	0
Priority calculations reproducible	100%
Demographic-invariance tests	100% pass
Secondary bonus exceeding cap	0
Formula/spec mismatches	0
Score/band mismatches	0
Non-deterministic ties	0
Hidden patient-specific rules	0
Queue gaps grounded	100%
Top-5 patients containing true benchmark gaps	measured, target 100%
Mutation/metamorphic tests	100% pass
Known stale priorities accepted	0
8.63 Red-Team
Attack A: Add 20 weak gaps

Does patient overwhelm one stronger intervention?

Should be limited by secondary cap.

Attack B: Change name/sex/age

Score identical.

Attack C: Add unverified candidate

No change.

Attack D: Remove evidence verification

Gap becomes ineligible.

Attack E: Reorder patients

Ranking identical.

Attack F: Create perfect tie

Stable deterministic tiebreak.

Attack G: Change OS clock

Frozen benchmark result unchanged.

Attack H: Disable LLM/network

No change.

Attack I: Add oncology diagnosis with no new gap

No priority change.

Attack J: Hardcode Maria #1

Static/code review must catch any patient-specific exception.

8.64 Acceptance Gates
Gate A: Semantic honesty

Priority is workflow intervention priority, not clinical risk.

PASS / FAIL

Gate B: Eligibility

Only VerifiedGap participates.

PASS / FAIL

Gate C: Formula

Exact deterministic formula implemented once.

PASS / FAIL

Gate D: Aggregation

Top issue dominates and secondary contribution is bounded.

PASS / FAIL

Gate E: Invariance

Protected/irrelevant patient properties do not alter ranking.

PASS / FAIL

Gate F: Stability

Small weight perturbations do not reveal pathological ranking instability.

PASS / FAIL

Gate G: Explainability

Every score can be decomposed into visible factors.

PASS / FAIL

Gate H: Queue

Top-K generation deterministic.

PASS / FAIL

Gate I: Benchmark

Actual queue metrics generated.

PASS / FAIL

Gate J: Demo integrity

Maria gets no special treatment.

PASS / FAIL

All ten pass.

8.65 Exit Report

Populate only after execution:

CONTINUA INTERVENTION PRIORITY V1

Input:
VerifiedGap v1

Priority version:
priority-v1

LLM calls:
0


PANEL

Patients:                     80
Patients with verified gaps:  XX
Ranked patients:              XX
Top K:                         5

QUEUE QUALITY

Top-5 with true gap:           X/5
Top-5 grounded:                5/5
Unverified gaps ranked:        0

DETERMINISM

Repeat-run queue differences:  0
Tie instability:               0

INVARIANCE

Demographic mutations:         XX
Priority changes:              0

SENSITIVITY

Top-5 retention under
frozen perturbation suite:     XX%

PERFORMANCE

Gap scoring:                   — ms
80-patient ranking:            — ms

MARIA

Verified gap count:            X
Gap scores:                    [...]
Patient score:                 XX
Priority band:                 P?
Rank:                          X

Patient-specific overrides:    0

8.66 Phase Failure Conditions

Do not move forward if:

priority resembles unexplained AI risk;
Maria requires hidden weighting;
demographics change scores;
unverified gaps enter queue;
panel-relative normalization makes scores unstable;
adding many weak gaps overwhelms one strong gap;
score changes with event ordering;
LLM contributes to ranking;
"CRITICAL" remains misleadingly clinical without controlled spec decision;
queue cannot explain why someone is above someone else.
8.67 Handoff to Phase 9

The master plan originally defined Phase 9: Intelligence Benchmarking.

At this point we have the entire intelligence core:

Documents
    ↓
Extractor v1
    ↓
ClinicalEvent v1
    ↓
gaps-v1
    ↓
evidence-v1
    ↓
priority-v1
    ↓
Top-5 Queue


Phase 9 will finally evaluate this complete pipeline end-to-end rather than evaluating each component in isolation.

It will measure:

extraction quality;
detector quality;
grounding;
hard-negative performance;
priority invariants;
Top-5 quality;
end-to-end latency;
component failure contribution;
baselines;
ablations;
reproducibility.
Phase 8 Definition of Done

Phase 8 is complete when we can ask:

Why is Patient A above Patient B?

and answer with arithmetic.

When we can ask:

Would changing the patient's name, sex, or age alter the ranking when the verified gaps are identical?

and answer:

No.

When we can ask:

Can an unverified AI-generated concern reach the Top 5?

and answer:

No, the type boundary prevents it.

And when we can ask:

Did we make Maria #1 manually because she's the demo patient?

and answer honestly:

No. She receives exactly the same deterministic formula as every other synthetic patient.

Only then stamp:

CONTINUA PHASE 8: priority-v1 FROZEN

Next: Phase 9 — Intelligence Benchmarking, where we prove whether the complete Continua intelligence stack actually works as a system.
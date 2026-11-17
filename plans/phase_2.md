Continua Phase 2: Synthetic Healthcare Dataset Engineering

Phase 1 gave Continua a reproducible engineering substrate. Phase 2 now gives the system something far more important than a pretty demo: a deterministic, messy, adversarial synthetic healthcare world in which the later extraction and reasoning systems can succeed, fail, and be measured honestly.

Phase 2 mission: Construct continua-synth-v1, an 80-patient synthetic dataset with realistic cross-provider documents, deliberately planted continuity gaps, difficult negative cases, complete provenance, and zero dependency on detector output.

2.0 Final Outcome

At Phase 2 exit we need:

Dataset

80 synthetic patients

Documents

Target:

~480 documents, acceptable band 400–600

Approximately:

5–7 records/patient

Providers

Target:

20–30 synthetic providers/entities across:

primary care
oncology
cardiology
endocrinology
surgery
laboratory
imaging
pharmacy
True gap distribution

Do not force exactly 80 gaps.

Target:

35–45 patients with ≥1 true gap
35–45 patients with zero true gaps
approximately 60–80 total gaps
Three supported gaps

Only:

missed_followup
duplicate_test
med_monitoring
Adversarial negatives

At least 10 explicitly designed families.

Reproducibility

Same:

dataset version
+ seed
+ generator version


must produce byte-equivalent canonical output.

2.1 Dataset Design Principles

Before writing generators, lock six rules.

Principle A: Ground truth exists before detection

We must know why a patient has a gap because we generated the causal scenario that created it.

Bad:

Generate random notes
→ run detector
→ call whatever it finds "ground truth"


Correct:

Select scenario template
→ decide ground truth
→ generate records representing it
→ freeze manifest
→ later challenge detector


This prevents circular evaluation.

2.2 Positive ≠ Obvious

Don't make every positive say:

"PATIENT MISSED FOLLOW-UP."

Realistic source:

04/18:
Referral to Medical Oncology for post-operative
adjuvant evaluation. Please schedule within 45 days.


Then later documents contain:

PCP visits
labs
pharmacy updates


but no qualifying oncology consult.

The gap must be derived from longitudinal absence, not spelled out for the system.

2.3 Negative ≠ Easy

A no-gap patient shouldn't simply have no referrals or medications.

Hard negative:

Referral to Cardiology
↓
23 days later
↓
Cardiology telehealth consultation


A naive detector may miss the telehealth consult and generate a false positive.

These cases will make our eventual precision number meaningful.

2.4 Messiness Must Be Controlled

We want:

realistic variation

not:

arbitrary garbage.

Inject known forms of messiness:

aliases
abbreviations
inconsistent provider naming
prose order variation
duplicate copied text
partially structured notes
different document templates

Every perturbation should have a known generator rule.

2.5 No Clinical Claims Hidden in Random Generation

Medication-monitoring relationships are especially sensitive.

For this benchmark, use only the explicit, frozen synthetic benchmark policies approved in Phase 0.

Do not dynamically invent medical monitoring requirements through the LLM.

2.6 Dataset ≠ Evaluation Labels

Keep generated source data and hidden truth conceptually separate:

data/synthetic/


versus:

data/eval-set/


A production pipeline must never load planted-label metadata.

2.7 Dataset Architecture

I would divide it into five layers.

L1 Patient Profiles
        ↓
L2 Care-Journey Scenarios
        ↓
L3 Clinical Events
        ↓
L4 Source Documents
        ↓
L5 Ground-Truth Manifest


This matters enormously.

Do not generate raw notes directly from random values.

Generate a truthful underlying event world first, then render that world into messy documents.

2.8 Canonical Data Model
Patient

Conceptually:

{
  "id": "<deterministic UUID>",
  "fixture_key": "P-001-maria",
  "synthetic": true,
  "display_name": "Maria Chen",
  "birth_year": 1972,
  "sex": "F",
  "demo_age": 54,
  "primary_condition": "breast_cancer",
  "care_pathway": "oncology",
  "dataset_version": "continua-synth-v1"
}


Do not store unnecessary identifiers such as:

SSN
real MRN
real street address
insurance IDs

They aren't needed for our use case.

2.9 Synthetic Providers

Use obviously fabricated, deterministic provider identities.

Example representation:

{
  "provider_id": "uuid",
  "fixture_key": "PROV-PCP-01",
  "display_name": "Dr. A. Patel",
  "specialty": "primary_care",
  "organization": "Northlake Primary Care",
  "synthetic": true
}


Avoid names matching known real DFW clinicians where practical.

Provider organizations should also be fictional.

2.10 Provider Ecosystem

Build enough fragmentation for continuity to matter.

Suggested structure:

Primary care

5–6 providers

Medical oncology

3–4

Cardiology

2–3

Endocrinology

2–3

Surgical services

2–3

Imaging centers

3

Labs

3

Pharmacy

2

This gives approximately 22–27 provider sources.

2.11 Patient Cohort Architecture

Don't make 80 near-identical oncology patients.

Use an oncology-heavy panel consistent with our flagship story while testing general detector behavior.

Cohort A: Oncology

32 patients

Examples:

breast cancer
colorectal oncology follow-up
prostate cancer
lung oncology
post-surgical oncology navigation

Goal:

Demo vertical and complex cross-provider journeys.

2.12 Cohort B: Cardio/medical specialty

16 patients

Good for:

referrals
duplicate labs/imaging
completed referral hard negatives
2.13 Cohort C: Chronic metabolic care

16 patients

Examples:

diabetes
hypertension-related specialty care

Useful primarily for controlled medication-monitoring cases.

2.14 Cohort D: Mixed multispecialty

16 patients

Used heavily for:

clean negatives
aliases
outside-provider records
edge cases

Total:

32 + 16 + 16 + 16 = 80

2.15 Gap Prevalence Design

We don't need epidemiologically representative prevalence.

We need a benchmark that tests our algorithms meaningfully.

Target approximately:

Gap type	InstancesMissed specialist follow-up	22–28
Duplicate test	18–24
Medication monitoring	18–24
Total	58–76

Again, the final count comes from the frozen manifest.

Do not manipulate the generator to make the total look prettier.

2.16 Patient-Level Distribution

Recommended:

No true gaps

~38 patients

Exactly one

~24

Exactly two

~12

All three

~6

Illustrative total:

38 × 0 = 0
24 × 1 = 24
12 × 2 = 24
6 × 3  = 18

Total = 66 planted gaps


That's far healthier than concentrating ~80 gaps into 20 patients.

The exact generated distribution can vary slightly if deliberately specified.

2.17 Golden Case: Maria

Reserve:

P-001-maria


Maria remains our golden-case fixture.

She should have exactly:

1 missed specialist follow-up
1 genuine duplicate-test scenario
1 temporally valid medication-monitoring scenario

Do not reintroduce the invalid tamoxifen annual-follow-up case.

Tamoxifen may stay as contextual information, but the third benchmark gap must satisfy the frozen Phase-0 rule as of:

2026-06-05

2.18 Care Journey Templates

Create scenario templates instead of random-event soup.

Examples:

Template T01

Referral completed normally

PCP
→ referral
→ specialist consult inside window
→ returned consult note


Label:

NO missed-followup gap

T02

Referral unresolved

PCP
→ referral
→ unrelated visits
→ window passes
→ no matching specialist encounter


Label:

missed_followup

T03

Legitimate serial testing

medication/treatment context
→ explicit "weekly CBC"
→ CBC
→ CBC
→ CBC


Label:

NO duplicate gap


This is vital.

T04

Likely duplicate testing

CBC at Lab A
↓ 6 days
repeat CBC from Provider B
explicit record indicates no serial-monitoring plan


Label:

duplicate_test

T05

Monitoring satisfied

medication start
→ monitoring expected
→ qualifying result inside window


Label:

NO med_monitoring gap

T06

Monitoring overdue

medication start
→ monitoring expected
→ window passes
→ no qualifying result


Label:

med_monitoring

2.19 Required Hard-Negative Families

This is a Phase 2 non-negotiable.

At least these 10:

HN-01 Completed referral

Referral → correct specialist consult within window.

Expected:

NO GAP

HN-02 Wrong-specialty encounter

Cardiology referral → PCP encounter.

Expected:

GAP


This is technically a positive case but adversarial because an unsophisticated "any follow-up" matcher will incorrectly close it.

HN-03 Referral not yet due

Referral exists; evaluation date is still inside window.

Expected:

NO OVERDUE GAP


Possibly due-soon state if specification allows.

HN-04 Telehealth specialist completion

Referral → specialist telehealth consult.

Expected:

NO GAP

HN-05 Explicit serial CBC

Source explicitly says:

weekly CBC monitoring


Multiple CBCs follow.

Expected:

NO DUPLICATE GAP

HN-06 Same test outside duplicate window

CBC → 21+ days → CBC.

Expected:

NO DUPLICATE GAP


given a frozen 14-day rule.

HN-07 Same imaging modality, different region

MRI brain followed by MRI knee.

Expected:

NO DUPLICATE GAP

HN-08 Medication stopped early

Medication started → discontinued before monitoring due date.

Expected:

NO MONITORING GAP

HN-09 Monitoring alias

Expected:

A1c


document instead says:

HbA1c


Expected:

NO GAP


after normalization.

HN-10 Monitoring just inside window

Monitoring completed one day before deadline.

Expected:

NO GAP

2.20 Add Another 5 Adversarial Families

We can do better than the minimum.

HN-11 Referral before evaluation cut-off but consult after window

Expected:

OVERDUE/RESOLUTION semantics according to frozen rule


Test historical timing carefully.

HN-12 Duplicate copied document

Same lab report enters dataset twice because of record duplication.

Should not necessarily be interpreted as two independently performed tests.

We need a source-document duplication marker or content hash strategy.

HN-13 Incomplete date

Example:

May 2026


Tests date precision.

HN-14 Missing provider

The event remains possible but provider is unknown.

Detector must not crash.

HN-15 Referral explicitly cancelled

Expected:

NO missed-followup gap


assuming the Phase-0 contract supports cancelled/inactive referrals.

If cancellation isn't currently represented, incorporate it into the schema only through versioned spec change, not an ad hoc dataset field.

2.21 Document-Type Distribution

Target approximately:

Document Type	Approx. countProgress/visit notes	120
Specialist consults	65
Referrals	65
Lab reports	100
Imaging reports	45
Medication records	55
Surgery/procedure notes	20
Follow-up/phone/telehealth notes	40
Total	~510

This is a target composition, not a forced exact count.

2.22 Messiness Matrix

Each patient should not receive every kind of noise.

Assign controlled perturbations.

Messiness	Approx exposureAbbreviations	30–40% docs
Provider naming variants	20–30%
Test aliases	20–30% relevant labs
Date format variation	10–20%
Copied-forward prose	10–15%
Telehealth terminology	5–10%
Cross-provider duplicate data	10–15%
Unstructured referral language	30–40% referrals

We want heterogeneity.

2.23 Test Alias Catalogue

Build deterministic mappings.

For example:

cbc:
- CBC
- Complete Blood Count
- CBC with differential
- CBC w/ diff

a1c:
- A1c
- HbA1c
- Hemoglobin A1c

bmp:
- BMP
- Basic Metabolic Panel


But be careful:

CBC with differential is not the same thing as BMP.

Normalization dictionaries must not collapse clinically distinct tests simply to improve detector scores.

2.24 Specialty Aliases

Example:

oncology:
- Oncology
- Medical Oncology
- Med Onc

cardiology:
- Cardiology
- Cardiac Clinic


Only include aliases we deliberately generated.

The benchmark is not an ontology project.

2.25 Provider-Name Variation

Same provider may appear as:

Dr. Anita Patel
A. Patel, MD
Patel, Anita MD
Dr A Patel


The source record should carry canonical provider metadata independently of the rendered text.

The later LLM must recover or normalize this.

2.26 Event-First Generation

Internally, generate truth-events.json before documents.

Example:

{
  "event_id": "...",
  "patient_id": "...",
  "date": "2026-04-18",
  "truth_type": "referral",
  "specialty": "oncology",
  "window_days": 45,
  "provider_id": "...",
  "scenario_id": "T02"
}


This document must not be available to the runtime detector.

It's generation truth only.

2.27 Render Documents From Events

The renderer turns canonical events into things such as:

Structured-ish lab
CBC WITH DIFFERENTIAL
Date: 04/20/2026
WBC 5.8
Hgb 12.4
Platelets 248

Narrative PCP note
Discussed recent surgical pathology.
Medical oncology referral placed for adjuvant therapy evaluation.
Patient should be seen within approximately 45 days.

Referral
Reason for referral:
Post-surgical breast oncology evaluation.

Requested specialty:
Medical Oncology


This separation gives us controlled truth plus messy observations.

2.28 Document Template Library

Create at least:

Notes

3–4 stylistic templates

Referrals

3

Lab reports

2–3

Imaging

2–3

Medication records

2

Consultation notes

3

Phone/telehealth

2

Otherwise the LLM will learn document layout instead of clinical entities.

2.29 Optional LLM Use During Dataset Generation

My recommendation:

Do not rely on an LLM for the canonical benchmark records.

Why?

We need deterministic generation.

LLM-generated prose may introduce:

accidental diagnoses
unsupported events
accidental referrals
monitoring events that corrupt labels

If you use an LLM to make wording more natural, it must be followed by strict validation against canonical truth, and the final rendered corpus becomes frozen.

For the benchmark itself, template-based generation is safer.

2.30 Ground-Truth Generation

Ground truth should be derived from the scenario manifest, not from clinical notes.

Each planted gap:

{
  "gap_truth_id": "...",
  "patient_id": "...",
  "gap_type": "missed_followup",
  "trigger_event_id": "...",
  "source_doc_ids": ["..."],
  "expected_window_days": 45,
  "evaluation_as_of_date": "2026-06-05",
  "scenario_id": "T02"
}


This prevents label leakage from the detector.

2.31 Explicit Negative Manifest

This is worth adding.

Create:

negative_manifest.json


Example:

{
  "patient_id": "...",
  "scenario_id": "HN-05",
  "detector": "duplicate_test",
  "expected": "no_gap",
  "reason": "explicit serial CBC monitoring"
}


Why?

Because later when we get a false positive, we'll know exactly which safeguard failed.

2.32 Split Eval Labels From Runtime Data

Runtime should receive only:

patients
providers
records


Evaluation receives additionally:

ground_truth
negative_manifest
truth_events


The detector process must not be able to import generation-truth modules.

We should enforce this structurally.

2.33 Dataset File Layout

Recommended:

data/synthetic/continua-synth-v1/
├── manifest.json
├── patients.json
├── providers.json
├── records.json
└── README.md

data/eval-set/continua-eval-v1/
├── ground_truth.json
├── negative_manifest.json
├── extraction_gold.json
└── README.md

data/generator/
├── scenarios/
├── templates/
└── truth-events/


If you don't want generation truth committed publicly, the generator can regenerate it.

But for hackathon reproducibility, committing synthetic truth data is acceptable as long as the runtime pipeline does not consume it.

2.34 Manifest

manifest.json should record:

{
  "dataset_version": "continua-synth-v1",
  "generator_version": "generator-v1",
  "seed": 20261117,
  "evaluation_as_of_date": "2026-06-05",
  "synthetic": true,
  "patient_count": 80,
  "document_count": 0,
  "provider_count": 0,
  "content_hash": "..."
}


Counts populate from generation.

Do not manually hardcode claimed final counts before generation.

2.35 Determinism Strategy

Generator accepts:

seed
dataset version
evaluation date


Every randomized operation passes through the Phase-1 seeded RandomSource.

Forbidden:

Math.random()


outside the deterministic random wrapper.

Forbidden:

new Date()


for clinical scenario calculation.

2.36 Stable Identifiers

Machine ID:

UUID


Fixture aliases:

P-001-maria
DOC-P001-REF-01
PROV-ONC-02


Example:

{
  "id": "actual-deterministic-uuid",
  "fixture_key": "P-001-maria"
}


Never again confuse display fixture IDs with API UUID requirements.

2.37 Data Integrity Validation

Implement:

scripts/validate-data.ts


It should check:

Structural
exactly 80 patients
all docs reference valid patients
all provider IDs resolve
unique IDs
valid dates
dataset version consistent
Provenance
all records synthetic=true
all records contain generator metadata
Temporal
no event after evaluation cutoff unless intentionally marked future
windows calculate correctly
Truth
every ground-truth doc exists
referenced events exist
every positive scenario is internally derivable
Negatives
every hard-negative scenario exists
expected detector outcome is declared
2.38 PHI Safety Scan

Even synthetic data can accidentally include copied real information if people paste samples.

Run a scanner for:

SSN-like numbers
real email domains
phone numbers
realistic MRN patterns
known real provider/hospital names
street addresses

For names, perfect automated detection isn't possible. Maintain:

synthetic-name-source.md


explaining how generated names were produced.

2.39 Real Organization Rule

The dataset should not use:

Texas Oncology
Baylor Scott & White
Children's Health
UT Southwestern
Medical City

as fictitious care sites inside patient records.

Those are real organizations.

Use fictional entities like:

Northlake Oncology Center
Cedar Ridge Imaging
Metro Lab Services
Greenfield Primary Care

The pitch can discuss the DFW market separately.

2.40 Maria Reconstruction

Phase 2 must create the new frozen Maria story.

Maria requirements

At least:

oncology-relevant surgery/history
imaging
medical-oncology referral
no qualifying consult within frozen window
genuine duplicate test
separate valid medication-monitoring scenario
unrelated noise records

Her records shouldn't look handcrafted solely for detectors.

She needs believable distractors.

2.41 Maria Golden-Case Gate

Expected:

missed_followup = 1
duplicate_test = 1
med_monitoring = 1
unexpected gaps = 0


But remember:

Phase 2 validates this against generation truth, not the future detector.

We are confirming the dataset's logic.

2.42 Extraction Gold Subset

Select 12 patients after generation.

Recommended composition:

Maria
3 oncology
2 cardiac
2 chronic-care
2 multi-specialty
2 hard-negative-heavy

Manually/frozen-generator label expected events:

event type
date
normalized entity
provider
source doc
source span


Target perhaps:

100–150 labeled events, depending on generated records.

This becomes Phase 5's extraction benchmark.

2.43 Difficulty Levels

Assign each evaluation patient:

EASY
MEDIUM
HARD

Easy

Clear terminology, one provider.

Medium

Aliases/multiple providers.

Hard

Multiple providers + alias + distractor + negative pattern.

Later report F1 by difficulty if time allows.

This can become a very strong technical slide/demo insight.

2.44 Dataset Bias Check

We don't need population-representative demographic modeling.

But avoid obviously broken generation such as:

80 women with breast cancer


or:

every oncology patient age 54


Check:

age spread appropriate to constructed scenarios
mixed sexes where relevant
multiple specialties
diverse journey lengths

Don't fabricate demographic claims about real DFW populations.

This is an engineering benchmark, not epidemiologic research.

2.45 Document-Length Distribution

Don't make every document 3 sentences.

Suggested:

Short

25%: 50–150 words

Medium

55%: 150–400 words

Longer

20%: 400–800 words

Long documents should include irrelevant but safe synthetic information so extraction gets challenged.

Again, these are design targets, not healthcare population facts.

2.46 Noise Without Corrupting Truth

Good noise:

"Patient reports doing well."
"Follow up with PCP as planned."
"Medication list reviewed."


Dangerous noise:

"Patient saw oncology yesterday."


when ground truth says no oncology consult.

The document validator should detect truth-breaking event phrases where feasible.

2.47 Dataset Mutation Testing

This is an advanced but valuable step.

For sample scenarios automatically mutate one property and make sure ground truth changes logically.

Example:

Unresolved referral


Mutation:

Add qualifying oncology consult on day 30


Expected truth:

missed_followup true → false


Similarly:

duplicate CBC at day 8


Mutation:

move second CBC to day 20


Expected:

duplicate true → false


This tests the dataset generator logic itself.

2.48 Benchmark Leakage Test

Inspect runtime source imports.

Ensure application path cannot import:

ground_truth.json
negative_manifest.json
truth-events


Only evaluation scripts should access them.

If the app uses ground-truth labels to populate queue output, that's cheating.

Hard fail.

2.49 Generation Pipeline

Target:

Config
  ↓
Seed RNG
  ↓
Generate providers
  ↓
Generate patients
  ↓
Assign scenario templates
  ↓
Generate canonical truth events
  ↓
Plant gaps / hard negatives
  ↓
Render source documents
  ↓
Inject controlled messiness
  ↓
Generate labels
  ↓
Validate integrity
  ↓
Safety scan
  ↓
Canonical sort
  ↓
Hash
  ↓
Freeze


Canonical sorting is important for true reproducibility.

2.50 Dataset Hashing

Compute content hashes for final canonical files.

For example:

patients_sha256
providers_sha256
records_sha256
ground_truth_sha256


Store them in the dataset manifest.

Now a judge/developer can regenerate and verify the corpus hasn't silently changed.

2.51 Tests for the Generator

Minimum test families:

Dataset unit tests
same seed = same output
different seed = different non-golden patients
exactly 80 patients
Maria always preserved
valid references
Scenario tests
T01 produces completed referral
T02 produces unresolved referral
T03 marks explicit serial testing
T04 creates eligible duplicate
T05 monitoring completed
T06 monitoring overdue
Negative-family tests

All 10+ required negative scenarios validate expected truth.

PHI tests

No forbidden real identifiers.

2.52 Phase 2 Quantitative Quality Gates
Metric	RequiredPatient count	80 exactly
Documents	400–600
Broken patient references	0
Broken provider references	0
Duplicate machine IDs	0
Real PHI	0 known instances
Real hospital identities used as synthetic sources	0
Supported gap types	exactly 3
Positive patients	35–45 target band
True no-gap patients	35–45 target band
Gap instances	60–80 target band
Required adversarial families	≥10, target 15
Maria valid planted gaps	3/3
Unexpected Maria gaps in truth	0
Reproducibility	100%
Ground-truth source references valid	100%
Runtime access to ground truth	0
Extraction-gold patients	12
Dataset validation failures	0

The distribution entries are design gates, not real-world prevalence claims.

2.53 Phase 2 Subphase Map

Execute the phase as these subphases:

2.0

Contract inheritance

2.1

Generator architecture

2.2

Provider ecosystem

2.3

Patient cohort design

2.4

Scenario library

2.5

Positive gap planting

2.6

Hard-negative construction

2.7

Canonical truth-event generation

2.8

Document template system

2.9

Controlled messiness injection

2.10

Maria golden-case reconstruction

2.11

Ground-truth manifest generation

2.12

Negative manifest

2.13

Extraction-gold subset

2.14

Data validator

2.15

Synthetic/PHI safety audit

2.16

Mutation tests

2.17

Leakage audit

2.18

Reproducibility + hashing

2.19

Dataset characterization

2.20

Freeze & handoff

2.54 Detailed Execution Order

Follow this order strictly:

Phase 0/1 contracts
      ↓
Generator configuration
      ↓
Provider catalogue
      ↓
Cohort definitions
      ↓
Scenario grammar
      ↓
Truth-event model
      ↓
Gap scenarios
      ↓
Hard negatives
      ↓
Patient scenario assignment
      ↓
Canonical events
      ↓
Document rendering
      ↓
Messiness
      ↓
Positive manifest
      ↓
Negative manifest
      ↓
Validation
      ↓
Maria audit
      ↓
Extraction-gold selection
      ↓
Safety scan
      ↓
Mutation tests
      ↓
Leakage test
      ↓
Canonical serialization
      ↓
SHA-256 hashes
      ↓
CONTINUA-SYNTH-V1 FREEZE


Do not start producing 500 documents before the scenario grammar and truth representation pass tests.

2.55 Phase 2 Deliverables

Expected output:

data/
├── synthetic/
│   └── continua-synth-v1/
│       ├── manifest.json
│       ├── patients.json
│       ├── providers.json
│       ├── records.json
│       └── README.md
│
├── eval-set/
│   └── continua-eval-v1/
│       ├── ground_truth.json
│       ├── negative_manifest.json
│       ├── extraction_gold.json
│       └── README.md
│
└── generator/
    ├── scenarios/
    ├── templates/
    └── truth-events/

scripts/
├── generate-synthetic-data.ts
├── validate-data.ts
├── audit-synthetic-safety.ts
└── hash-dataset.ts

tests/
├── dataset/
├── scenarios/
├── negatives/
├── mutations/
└── reproducibility/

docs/
└── data/
    ├── dataset-design.md
    ├── scenario-catalog.md
    ├── adversarial-cases.md
    ├── maria-golden-case.md
    └── dataset-card.md

2.56 Dataset Card

Create dataset-card.md.

It should clearly say:

What it is

80-patient synthetic benchmark for continuity-gap detection.

Intended use

Development/evaluation of Continua.

Not intended for
medical training
diagnosis
clinical-decision validation
epidemiological claims
real-world performance claims
Data origin

Programmatically constructed synthetic events and documents.

Supported gap types

Exactly three.

Limitations

Artificial distribution, limited specialties, benchmark policies, templated prose.

That transparency is a strength.

2.57 Phase 2 Red-Team

Before freeze, attack the dataset from four directions.

Attack A: Detector-friendly bias

Question:

Are the positives much more obviously worded than negatives?

If yes, regenerate.

Attack B: Leakage

Question:

Does source text accidentally contain labels such as "MISSED_FOLLOWUP"?

Hard fail.

Attack C: Clinical plausibility

Question:

Are temporal relationships internally coherent?

Example failure:

follow-up occurs before referral


unless intentionally adversarial.

Attack D: Demo manipulation

Question:

Did we design Maria solely so she scores #1 under a known priority formula?

The scenario should justify her priority without hidden overrides.

2.58 Phase 2 Acceptance Gates
Gate A: Structural Integrity
80 patients
400–600 documents
0 dangling references


PASS/FAIL

Gate B: Truth Integrity

Every planted gap derivable from the canonical scenario.

PASS/FAIL

Gate C: Negative Quality

At least 10 hard-negative families represented and validated.

PASS/FAIL

Gate D: Maria

Three temporally valid supported gaps, no hidden fourth gap.

PASS/FAIL

Gate E: Safety

Synthetic-only, no copied PHI, no real clinical-system integration.

PASS/FAIL

Gate F: Reproducibility

Same version + seed regenerates identical corpus/hash.

PASS/FAIL

Gate G: Label Isolation

Runtime pipeline cannot access truth manifests.

PASS/FAIL

Gate H: Evaluation Readiness

Extraction-gold subset and frozen gap labels available.

PASS/FAIL

All eight gates must pass.

2.59 Phase 2 Exit Benchmark Report

At freeze, generate something like:

CONTINUA-SYNTH-V1

Patients:                  80
Providers:                 XX
Documents:                 XXX
Positive patients:         XX
Negative patients:         XX

Ground-truth gaps:
Missed follow-up:          XX
Duplicate test:            XX
Medication monitoring:     XX
Total:                     XX

Adversarial families:      XX
Extraction-gold patients:  12
Gold extraction events:    XXX

Dangling references:       0
Known PHI:                 0
Runtime label leakage:     0

Dataset SHA-256:
xxxxxxxx...


These values are populated only after generation.

2.60 Phase 2 Handoff to Phase 3

Phase 3 receives a frozen world.

It must not modify the dataset to make evaluation easier.

Inputs into Phase 3:

continua-synth-v1
continua-eval-v1
Maria golden case
scenario catalogue
negative manifest
extraction gold set
dataset hashes


Phase 3's job is then to turn these into a rigorous Ground-Truth & Benchmark System, including exact matching semantics, benchmark splits, evaluation tooling contracts, failure taxonomy, and frozen acceptance gates.

Phase 2 Definition of Done

Phase 2 is complete when we can answer all of these with evidence:

Can every generated document be traced to synthetic truth?

Yes.

Do we know exactly which gaps truly exist before running Continua?

Yes.

Are there difficult cases where Continua should deliberately say "no gap"?

Yes.

Does Maria's story actually obey time and rule semantics?

Yes.

Can the runtime cheat by reading labels?

No.

Can another developer regenerate the identical dataset?

Yes.

Is the dataset realistic enough to challenge extraction while still being completely synthetic and reproducible?

Yes.

## Phase 2 execution checklist

- [x] Generator architecture and deterministic seed
- [x] 26-provider ecosystem
- [x] 80 patients across 4 cohorts
- [x] Scenario grammar T01–T06
- [x] Positive gap planting (42 patients, 66 gaps)
- [x] Adversarial negatives HN-01–HN-15 (13 negative + 2 adversarial-positive)
- [x] Canonical truth-event generation
- [x] Document template system (9 templates, controlled messiness)
- [x] Padding to realistic length bands (25/55/20)
- [x] Maria golden case (3 gaps, tamoxifen not a gap)
- [x] Ground-truth manifest generation
- [x] Negative manifest
- [x] Extraction-gold subset (12 patients / 130 events)
- [x] Data validator (scripts/validate-dataset.ts)
- [x] Synthetic/PHI safety audit
- [x] Mutation tests
- [x] Leakage audit
- [x] Reproducibility + hashing
- [x] Dataset characterization (docs/data/dataset-characterization.md)
- [x] Docs: dataset-design, scenario-catalog, adversarial-cases, maria-golden-case, dataset-card
- [x] npm scripts and CI integration
- [x] Delete scripts/debug-truth.ts

CONTINUA PHASE 2: continua-synth-v1 FROZEN

The master-plan next phase is Phase 3: Ground Truth & Benchmark Construction, where we formalize exactly how predictions are matched to truth and how Continua will prove that its results are accurate rather than merely visually impressive.
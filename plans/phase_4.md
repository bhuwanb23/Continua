Continua Phase 4: Canonical Clinical Event Model

Phase 3 froze how Continua will be judged. Phase 4 creates the most important internal boundary in the system: the canonical representation that converts messy healthcare documents into a small, typed, provenance-preserving world that deterministic reasoning can safely operate on.

Phase 4 mission: Build and freeze ClinicalEvent v1, the canonical intermediate representation between document understanding and clinical-gap reasoning.

The architecture after this phase becomes:

Messy synthetic records
        ↓
Extraction
        ↓
Raw extracted events
        ↓
Validation
        ↓
Normalization
        ↓
Canonical Clinical Events   ← PHASE 4
        ↓
Gap engines
        ↓
Evidence verifier
        ↓
Intervention priority


The crucial rule remains:

LLMs may extract facts. ClinicalEvent does not encode LLM-made gap decisions, diagnoses, treatment decisions, or patient-risk judgments.

4.0 Phase Objectives

By the end of Phase 4, Continua must have:

One canonical event envelope.
Strict typed payloads for every supported event.
Explicit date precision.
Explicit source provenance.
Deterministic normalization.
Safe handling of uncertainty.
Stable event identities.
Exact schema-version semantics.
Valid/invalid event-state handling.
Duplicate-event handling.
Temporal ordering rules.
Extraction-gold compatibility.
Complete runtime validation.
Serialization guarantees.
Comprehensive unit/contract tests.
Output

ClinicalEventSchema v1.0 FROZEN

Phase 5's extractor must produce this representation.

Phase 6's detectors must consume this representation.

Neither should invent an alternative event model.

4.1 What the Canonical Model Is

Suppose source records say:

"Referral to Medical Oncology."

"Med Onc referral was placed."

"Post-surgical oncology consult requested."


Continua's downstream reasoning shouldn't need to understand all three versions.

They become something like:

{
  "event_type": "referral",
  "date": "2026-04-18",
  "specialty": "oncology"
}


while retaining:

source document
source span
extraction confidence


The canonical model therefore performs:

variation
↓
normalization
↓
structure


without erasing provenance.

4.2 What It Must NOT Become

ClinicalEvent is not:

an EHR replacement,
a FHIR implementation,
an HL7 engine,
a complete clinical ontology,
a medical knowledge graph,
a claim-processing model,
a clinical decision engine.

For the hackathon, that would destroy scope.

We model only what our three detectors need.

4.3 Event-Type Freeze

Phase 4 supports exactly these canonical types:

referral
consult
followup
lab_result
imaging
medication_start
medication_stop
surgery


No ninth type without a specification revision.

Examples that don't matter to our gap reasoning can remain documentary context rather than producing new event classes.

4.4 Base ClinicalEvent Contract

Freeze a base envelope conceptually like:

type ClinicalEvent = {
  schema_version: "clinical-event-v1";

  event_id: string;
  patient_id: string;

  event_type: EventType;

  date: string;
  date_precision: "day" | "month";

  provider_id?: string;
  provider_display?: string;
  provider_type:
    | "pcp"
    | "specialist"
    | "lab"
    | "imaging"
    | "pharmacy"
    | "other"
    | "unknown";

  description: string;

  source: EventSource;

  extraction_confidence: number;

  typed: EventPayload;
};


The exact TypeScript syntax can vary, but the semantics cannot.

4.5 Source Contract

Every accepted clinical event needs provenance.

type EventSource = {
  source_doc_id: string;
  source_span: string;

  span_start?: number;
  span_end?: number;

  verification_method:
    | "exact"
    | "fuzzy";

  verification_score: number;
};

Hard rule

No:

source_doc_id


means:

No canonical event.

Evidence-free facts never enter the reasoning store.

4.6 Source Span Policy

We previously had a possible contradiction between:

"verbatim source span"
fuzzy verification.

Resolve it this way:

Primary expectation

Store the exact extracted source text whenever possible.

Exact

Normalized span occurs in the source.

verification_method = exact
verification_score = 1

Fuzzy

Permitted only for small OCR/format normalization differences.

Required:

verification_score ≥ 0.85


Otherwise:

event rejected


The detector never sees it.

4.7 Date Model

Dates need a proper contract because gap reasoning is temporal.

Use:

date: "YYYY-MM-DD"
date_precision: "day" | "month"

Day known
{
  "date": "2026-04-18",
  "date_precision": "day"
}

Only month known
{
  "date": "2026-04-01",
  "date_precision": "month"
}


The 1st is storage normalization.

It does not mean the event actually occurred on April 1.

4.8 Date Precision and Gap Reasoning

This needs a conservative policy.

For time-sensitive detector decisions:

day precision


can support exact calculations.

For:

month precision


the detector should not silently pretend April 1 is the true clinical date.

Recommended downstream semantics:

date_lower_bound
date_upper_bound


may be deterministically derived.

For April 2026:

2026-04-01
through
2026-04-30


Then detectors can behave conservatively.

Phase 6 will define the final comparison behavior.

4.9 Timezone Policy

Clinical events are date-centric for MVP.

Don't introduce timezone complexity unless source records actually require timestamps.

Freeze:

ClinicalEvent date = calendar date


Meanwhile API timestamps such as:

generated_at


remain UTC ISO 8601.

This separates clinical event dates from system timestamps.

4.10 Referral Payload
type ReferralPayload = {
  specialty_raw: string;
  specialty_normalized: SpecialtyCode;

  reason?: string;

  expected_window_days: number;

  status:
    | "placed"
    | "completed"
    | "cancelled"
    | "unknown";
};


cancelled is important for the hard-negative family created in Phase 2.

4.11 Referral Rules
expected_window_days

Must come from one of two explicit sources:

Source-stated

Example:

Please schedule within 45 days.

Record:

window_source = DOCUMENT

Benchmark-policy fallback

If no explicit source window:

window_source = BENCHMARK_POLICY


with frozen default defined by continua-synth-v1.

Do not make an LLM invent a window.

Enhance payload:

expected_window_days: number;

window_source:
  | "document"
  | "benchmark_policy";


This directly improves explainability.

4.12 Consult Payload
type ConsultPayload = {
  specialty_raw: string;
  specialty_normalized: SpecialtyCode;

  clinician?: string;

  mode:
    | "in_person"
    | "telehealth"
    | "phone"
    | "unknown";

  completion_status:
    | "completed"
    | "cancelled"
    | "unknown";
};


This allows Phase 6 to correctly handle:

referral completed through telehealth.

4.13 Follow-Up Payload
type FollowupPayload = {
  topic?: string;

  specialty_normalized?: SpecialtyCode;

  mode:
    | "in_person"
    | "telehealth"
    | "phone"
    | "message"
    | "unknown";

  status:
    | "scheduled"
    | "completed"
    | "missed"
    | "cancelled"
    | "unknown";
};


Important distinction:

scheduled ≠ completed


A naive system might accidentally close a referral because an appointment exists.

Phase 6 must only accept statuses allowed by the frozen detector rule.

4.14 Lab Result Payload
type LabResultPayload = {
  test_name_raw: string;
  test_code_normalized: LabCode;

  value?: number | string | null;
  unit?: string | null;

  abnormal?: boolean | null;

  series_status:
    | "explicit_series"
    | "explicit_one_off"
    | "unknown";
};


This resolves the earlier intentional_series schema contradiction.

4.15 series_status Semantics
explicit_series

Source actually says something like:

Weekly CBC monitoring.

The extractor can cite this.

explicit_one_off

Source explicitly indicates an isolated/repeat order rather than recurring monitoring.

unknown

The source does not establish intent.

Most cases should probably be unknown.

Important

Do not ask the LLM:

Was this medically necessary?

That's a clinical judgment.

Ask:

Does the document explicitly describe this test as part of a scheduled series?

That's extraction.

4.16 Imaging Payload

Don't pretend imaging uses test_name_normalized.

Use a separate contract:

type ImagingPayload = {
  modality_raw: string;

  modality_normalized:
    | "ct"
    | "mri"
    | "xray"
    | "pet"
    | "mammogram"
    | "ultrasound"
    | "other";

  body_region_raw: string;
  body_region_normalized?: string;

  result_summary?: string;

  series_status:
    | "explicit_series"
    | "explicit_one_off"
    | "unknown";
};


Duplicate identity later:

modality_normalized
+
body_region_normalized


not:

test_name_normalized

4.17 Medication Start Payload
type MedicationStartPayload = {
  drug_raw: string;
  drug_normalized: MedicationCode;

  dose?: string | null;
  route?: string | null;

  reason?: string | null;
};


The event merely represents:

The source says this medication started.

Not:

Continua believes medication is clinically appropriate.

4.18 Medication Stop Payload
type MedicationStopPayload = {
  drug_raw: string;
  drug_normalized: MedicationCode;

  stop_reason?: string | null;
};


A legitimate stop event is essential for hard-negative monitoring scenarios.

4.19 Surgery Payload

We don't currently reason heavily from surgery, but it materially supports the oncology timeline.

type SurgeryPayload = {
  procedure_raw: string;
  procedure_normalized?: string;

  site?: string;

  outcome_summary?: string;
};


Keep it minimal.

Don't build a surgical ontology.

4.20 Normalized Code Strategy

Do not adopt a huge clinical terminology system in Phase 4.

We don't need full:

SNOMED CT
LOINC
RxNorm

integration for this synthetic hackathon benchmark.

Instead use narrow internal codes.

Example:

LabCode:
cbc
a1c
bmp
inr


etc., only where present in the frozen dataset.

Architect the fields so standards-based mappings could later be added, but don't pretend they're implemented.

4.21 Normalization Maps

Store independently:

lib/normalization/
├── lab-aliases.ts
├── medication-aliases.ts
├── specialty-aliases.ts
├── imaging-aliases.ts
└── provider-aliases.ts


These maps are:

deterministic
versioned
tested
4.22 Lab Normalization

Example:

CBC
Complete Blood Count
CBC w/ diff
CBC with differential


Need careful consideration.

If our duplicate definition intentionally treats CBC w/ diff and CBC as equivalent for the synthetic benchmark, document that benchmark policy.

Never silently declare clinically distinct tests equivalent solely to improve benchmark performance.

4.23 Medication Normalization

Examples:

Metformin 500 mg
metformin
METFORMIN


normalize to:

metformin


but retain raw text and dose separately.

Potential brand→generic mapping should be very small and explicit.

4.24 Specialty Normalization

Examples:

Medical Oncology
Oncology
Med Onc


→

oncology


Similarly:

Cardiology
Cardiac Clinic


→

cardiology


Only aliases actually present in dataset need support.

4.25 Provider Normalization

We have canonical provider IDs from Phase 2.

If extraction resolves a provider entity:

A. Patel, MD
Dr Anita Patel
Dr A Patel


it may map to the same synthetic provider.

But:

uncertain provider matching must not be used to infer clinical facts.

If no confident mapping:

provider_type = unknown
provider_id = absent
provider_display = extracted text


That's fine.

4.26 Confidence Model

Avoid fake precision.

Don't create ten independent pseudo-scientific probabilities.

Phase 4 needs only:

extraction_confidence


representing extractor confidence.

Downstream evidence verification is separate:

verification_score


These mean different things.

Never average them blindly.

4.27 Confidence Bounds

Runtime validation:

0 ≤ confidence ≤ 1


No:

NaN
Infinity
-0.1
1.2


If missing:

reject or explicitly represent unknown according to schema.

I favor required confidence for LLM-extracted events.

Fixture-derived golden events can set confidence through fixture policy and must not be used to claim model confidence.

4.28 Unknown vs Null vs Omitted

Freeze semantics now.

Unknown categorical value

Use explicit:

"unknown"


when the schema supports it.

Optional fact absent from source

Omit or null according to the field contract.

Do not use arbitrary empty strings:

""


for missing clinical facts.

4.29 Invalid Events

Canonical events have only two states:

ACCEPTED
REJECTED


Don't allow downstream reasoning on:

PARTIALLY_VALID


We may log why an event was rejected.

Example:

{
  "reason": "SOURCE_SPAN_NOT_VERIFIED",
  "candidate_event": "...",
  "stage": "clinical_event_validation"
}


But rejected candidates stay outside the canonical event store.

4.30 Rejection Taxonomy

Freeze:

CE-001 schema invalid
CE-002 unknown event type
CE-003 invalid date
CE-004 source document missing
CE-005 source belongs to wrong patient
CE-006 source span unverifiable
CE-007 confidence invalid
CE-008 payload mismatch
CE-009 normalization failure
CE-010 unsupported value


These later feed Phase 5 error analysis.

4.31 Deterministic Event IDs

IDs must not depend on LLM wording like description.

Otherwise minor prose changes produce different IDs.

Use stable identity inputs such as:

patient_id
source_doc_id
event_type
canonical date
event ordinal within source


For example conceptually:

UUIDv5(
 patient_id +
 source_doc_id +
 event_type +
 date +
 source_local_index
)


Use whatever deterministic ID implementation Phase 1 froze.

4.32 Multiple Events in One Document

A single PCP note might contain:

medication start
referral
follow-up

These must become three events.

Therefore event ID cannot just be:

patient + doc + date


It needs event-local identity.

4.33 Duplicate Event Handling

The same clinical event could appear in:

original specialist note
copied PCP note
discharge summary

Do not simply delete all duplicates.

We need two concepts:

Source events

Facts extracted from documents.

Canonical event grouping

Potentially multiple source events representing one underlying episode.

For MVP, keep this simple.

4.34 Event Fingerprint

Compute a fingerprint for probable duplicates.

Example for referral:

event_type
+ patient
+ specialty
+ date


For labs:

event_type
+ patient
+ test code
+ date
+ value


This enables grouping.

But keep each provenance source attached.

4.35 Canonical Event Group

Potential model:

{
  "canonical_event_id": "uuid",
  "representative_event": {...},
  "supporting_event_ids": ["...", "..."],
  "supporting_source_doc_ids": ["...", "..."]
}


This is useful especially for copied-forward external records.

However:

Do not overdo entity resolution in Phase 4.

If grouping becomes complex, Phase 4 can freeze the fingerprint model and Phase 5 implement conservative deduplication.

4.36 Crucial Duplicate-Test Distinction

Do not confuse:

Duplicate record

Same CBC event copied into two documents.

with:

Duplicate test

CBC actually performed twice.

The detector must operate on distinct canonical test occurrences, not document count.

This distinction is a major source of potential false positives.

4.37 Event Ordering

Canonical timeline ordering:

date lower bound
date precision
deterministic event-type ordering if same date
event_id as final stable tie-breaker

Never rely on JSON insertion order.

4.38 Same-Day Event Ordering

Don't imply false chronology.

If two events occur on the same date with no time:

they are co-dated


The UI may order consistently, but shouldn't imply one clinically occurred first unless documented.

4.39 Phase/Display Groups

phase existed in earlier schema but is primarily presentational.

I would remove it from extractor-controlled canonical truth.

Instead derive UI grouping deterministically:

surgery       → Surgery
imaging       → Radiology
referral      → Referral/Oncology depending on specialty
consult       → Specialty Care
lab_result    → Labs
medication_*  → Medications
followup      → Follow-up


This prevents the LLM from inventing a display concept that downstream logic doesn't need.

4.40 Description Field

description is convenient for UI.

But don't let downstream detectors parse it.

Hard rule:

No detector may inspect description.

Detectors consume typed fields only.

If detector needs information that exists only in description, the canonical schema is incomplete and must be revised deliberately.

This is one of the most important Phase 4 architectural rules.

4.41 Provenance Preservation

Normalization must never destroy raw values.

Example:

{
  "test_name_raw": "CBC w/ diff",
  "test_code_normalized": "cbc"
}


Both retained.

Similarly:

specialty_raw
specialty_normalized


This allows future debugging:

Why did Med Onc become oncology?

4.42 Event Validation Pipeline

Every extractor candidate goes through:

Candidate Event
      ↓
JSON Schema Validation
      ↓
Patient Ownership Check
      ↓
Source Document Validation
      ↓
Source Span Verification
      ↓
Date Validation
      ↓
Event/Payload Compatibility
      ↓
Normalization
      ↓
Confidence Validation
      ↓
Event-ID Assignment
      ↓
ACCEPT


Anything failing:

REJECT + structured reason


No quiet partial repair except explicitly documented deterministic normalizations.

4.43 Runtime Schema Design

Use discriminated unions.

Conceptually:

type ClinicalEvent =
  | ReferralEvent
  | ConsultEvent
  | FollowupEvent
  | LabResultEvent
  | ImagingEvent
  | MedicationStartEvent
  | MedicationStopEvent
  | SurgeryEvent;


Each has a specific typed payload.

This prevents nonsense such as:

{
  "event_type": "lab_result",
  "typed": {
    "specialty": "oncology"
  }
}


from becoming canonical.

4.44 No any Boundary

LLM output arrives as:

unknown


Then:

RuntimeSchema.parse(...)


Only after validation does it become:

ClinicalEvent


No as ClinicalEvent casts around external JSON.

This becomes a code-review gate.

4.45 Canonical Serialization

Freeze canonical JSON behavior.

Required:

deterministic field representation
stable event order
stable array order where semantics allow
normalized dates
no undefined serialization surprises

This matters for caching and hashing.

4.46 Version Metadata

Every event:

schema_version = clinical-event-v1


Derived collections also record:

dataset_version
extractor_version
normalization_version


Example:

{
  "metadata": {
    "clinical_event_schema": "clinical-event-v1",
    "normalization_version": "normalization-v1",
    "extractor_version": "fixture-extractor-v1"
  },
  "events": []
}

4.47 Normalization Version

Introduce:

NORMALIZATION_VERSION = normalization-v1


Why?

Suppose later:

CBC w/diff


mapping changes.

Evaluation must know which map produced an event store.

4.48 ClinicalEvent Store Contract

Patient event-store retrieval:

getEvents(patientId)


returns:

only accepted canonical events
deterministically sorted
no rejected candidates

Separate debugging endpoint/store may expose rejected candidates during development.

Production UI does not need them.

4.49 Golden-Case Event Fixture

Before Phase 5, manually create a canonical Maria event fixture from the corrected Phase 2 story.

This is critical.

Something like:

Maria
├── surgery
├── imaging
├── oncology referral
├── CBC #1
├── medication-context events
├── CBC #2
└── corrected medication-monitoring trigger


The exact count comes from final Phase 2 documents.

Do not preserve the old "7 events" requirement if fixing the monitoring case changed the story.

Specification truth beats the old storyboard.

4.50 Golden Fixture Purpose

This fixture bypasses LLM extraction entirely.

It lets Phase 6 test:

Canonical Events
        ↓
Gap Engine


independently of Phase 5.

This separation is essential.

If Maria's detector test fails later:

fixture event path passes → extraction problem
fixture event path fails → detector problem

Very clean debugging.

4.51 Phase 3 Extraction-Gold Compatibility

Every extraction-gold event from the 12 patients must map cleanly into ClinicalEvent v1.

Run a migration/validation check:

Gold events
↓
ClinicalEventSchema


Required:

100% representable


If not, one of two things is wrong:

gold labels contain unnecessary data, or
canonical schema is insufficient.

Resolve now, not in Phase 5.

4.52 Detector Sufficiency Test

Before freezing the model, ask for each future detector:

Missed follow-up

Can it decide using only:

referral
consult/followup
specialty
status
date
window


?

If no, schema incomplete.

Duplicate testing

Can it decide using:

lab/imaging identity
date
series status
distinct canonical occurrence


?

Medication monitoring

Can it decide using:

medication start/stop
normalized medication
monitoring target
date
lab/consult occurrence
benchmark policy


?

No detector should need to reopen raw notes.

That's the test.

4.53 Policy Data Is Not Clinical Event Data

Keep benchmark policies separately.

Example:

lib/policies/
├── referral-windows.ts
├── monitoring-policy.ts
└── duplicate-windows.ts


ClinicalEvent says:

metformin started on X.

Policy says:

For this synthetic benchmark, metformin scenario expects monitoring item Y within window Z.

Don't embed all reasoning policy inside events.

This maintains architectural clarity.

4.54 Safety Boundary

Canonical event model may state:

medication started
lab occurred
referral placed
consult completed


It must not state:

medication should have been prescribed
diagnosis confirmed by Continua
patient needs treatment
patient is high risk
doctor made an error


Those are outside factual extraction.

4.55 Unit Test Families

Build comprehensive tests.

Schema tests

Every valid event type parses.

Every wrong payload fails.

Provenance tests

Missing doc → reject.

Wrong patient's doc → reject.

Unsupported span → reject.

Date tests
valid day
valid month
impossible date
post-as-of date policy
leap year if applicable
Normalization tests

Every alias in Phase 2 has expected canonical mapping.

Series tests
weekly CBC


→ explicit_series

No explicit series phrase:

→ unknown

Medication tests

Raw dose preserved separately from normalized drug.

Consult tests

Telehealth consult remains completed consult.

Serialization tests

Same events → same serialized form/hash.

4.56 Property/Invariant Tests

Important invariants:

INV-01

Every event belongs to exactly one patient.

INV-02

Every event has valid source provenance.

INV-03

Every event type matches exactly one payload schema.

INV-04

Every normalization retains its raw source value.

INV-05

Canonical dates are valid.

INV-06

Confidence ∈ [0,1].

INV-07

No detector decision field exists inside the canonical event.

INV-08

No clinical risk field exists.

INV-09

Stable input yields stable event ID.

INV-10

Canonical serialization is deterministic.

4.57 Mutation Testing

Examples:

Mutation 1

Change referral specialty:

oncology → cardiology


Only specialty-normalization fields should change.

Mutation 2

Remove source span.

Event should be rejected.

Mutation 3

Change:

explicit_series


to:

unknown


Model remains valid; later detector behavior may change.

Mutation 4

Change event type but preserve old payload.

Schema validation must reject.

This proves discriminated unions work properly.

4.58 Performance Requirements

Phase 4 functions should be extremely fast.

Normalization and schema validation are normal local computation.

For an 80-patient panel:

canonical validation/normalization should not be the bottleneck.

Don't over-optimize prematurely, but measure:

events processed/sec
normalization duration
validation duration


No hard commercial-performance claim needed.

4.59 Observability

Validation logs should aggregate:

candidate events
accepted
rejected
rejection reasons
normalization misses
exact source matches
fuzzy source matches


Example:

Events proposed: 125
Accepted: 118
Rejected: 7

CE-006 span failed: 4
CE-009 normalization failed: 2
CE-003 invalid date: 1


Useful in Phase 5.

4.60 Phase 4 Benchmark

This phase isn't testing LLM accuracy.

It's testing the canonical model correctness.

Requirement	GateSupported event types	8 exactly
Gold events representable	100%
Accepted events with valid source	100%
Accepted events preserving raw normalized fields	100%
Invalid discriminated payloads accepted	0
Detector decision fields in schema	0
Clinical-risk fields	0
Unversioned normalization mappings	0
Non-deterministic fixture event IDs	0
Undefined alias mappings from synthetic corpus	0
Unit/contract test failures	0
Core detector needs requiring raw-note parsing	0

That last one is crucial.

4.61 Phase 4 Red-Team

Attack the model.

Attack A: Unsupported LLM fact

Candidate includes no valid source.

Expected:

REJECT

Attack B: Wrong payload

Medication payload under referral event.

Expected:

REJECT

Attack C: Fake confidence
1.4


Expected:

REJECT

Attack D: Same document copied twice

Canonical occurrence logic should prevent a later duplicate-test detector from naïvely treating it as two procedures.

Attack E: Ambiguous date

Must preserve uncertainty.

Attack F: Unknown alias

Do not silently hallucinate normalization.

Use explicit unmapped/error handling.

Attack G: Telehealth

Must remain a qualifying consult representation.

Attack H: Detector tries to parse description

Architectural/static review fails.

4.62 Phase 4 Files

Expected:

lib/domain/
├── clinical-event.ts
├── event-source.ts
├── event-types.ts
└── event-store.ts

lib/schemas/
├── clinical-event.schema.ts
├── referral.schema.ts
├── consult.schema.ts
├── followup.schema.ts
├── lab-result.schema.ts
├── imaging.schema.ts
├── medication.schema.ts
└── surgery.schema.ts

lib/normalization/
├── index.ts
├── lab-aliases.ts
├── medication-aliases.ts
├── specialty-aliases.ts
├── imaging-aliases.ts
├── provider-aliases.ts
└── version.ts

lib/clinical-events/
├── validate.ts
├── normalize.ts
├── identify.ts
├── fingerprint.ts
├── sort.ts
├── serialize.ts
└── rejection.ts

lib/policies/
├── referral-windows.ts
├── duplicate-windows.ts
└── monitoring-policy.ts

tests/clinical-events/
├── schema.test.ts
├── provenance.test.ts
├── normalization.test.ts
├── date.test.ts
├── identification.test.ts
├── deduplication.test.ts
├── serialization.test.ts
├── invariants.test.ts
└── red-team.test.ts

data/fixtures/
└── maria-canonical-events.json

docs/architecture/
├── clinical-event-model.md
├── normalization-policy.md
├── provenance-policy.md
└── clinical-event-rejections.md

4.63 Phase 4 Execution Order

Run it in this sequence:

4.0 Validate Phase-3 handoff
       ↓
4.1 Freeze supported event vocabulary
       ↓
4.2 Define base envelope
       ↓
4.3 Define provenance model
       ↓
4.4 Define temporal representation
       ↓
4.5 Define 8 event payloads
       ↓
4.6 Freeze raw↔normalized semantics
       ↓
4.7 Build normalization maps
       ↓
4.8 Separate benchmark policies
       ↓
4.9 Define confidence semantics
       ↓
4.10 Define validation/rejection flow
       ↓
4.11 Define deterministic IDs
       ↓
4.12 Define event fingerprinting
       ↓
4.13 Handle copied-event deduplication
       ↓
4.14 Define sorting/serialization
       ↓
4.15 Implement runtime schemas
       ↓
4.16 Validate Phase-3 gold events
       ↓
4.17 Create corrected Maria fixture
       ↓
4.18 Detector-sufficiency review
       ↓
4.19 Unit/property/mutation tests
       ↓
4.20 Red-team
       ↓
4.21 Freeze ClinicalEvent v1

4.64 Acceptance Gates
Gate A: Representation

Every Phase 3 gold event can be represented without abusing free text.

PASS / FAIL

Gate B: Provenance

Every accepted event has valid source-document evidence.

PASS / FAIL

Gate C: Determinism

Same candidate input yields same normalized event and identifier.

PASS / FAIL

Gate D: Type Safety

Impossible event/payload combinations cannot enter canonical storage.

PASS / FAIL

Gate E: Normalization

Every alias intentionally present in continua-synth-v1 has a documented expected result.

PASS / FAIL

Gate F: Duplicate Separation

Copied records and actual repeated tests are representationally distinguishable.

PASS / FAIL

Gate G: Detector Sufficiency

All three future gap engines can operate exclusively on canonical events + frozen benchmark policies.

PASS / FAIL

Gate H: Safety

No diagnosis, treatment, clinical-risk or gap-decision fields exist in the canonical model.

PASS / FAIL

Gate I: Benchmark Compatibility

Extraction-gold and benchmark identity semantics remain intact.

PASS / FAIL

All nine must pass.

4.65 Phase 4 Exit Report

At freeze, generate:

CONTINUA CLINICAL EVENT MODEL v1

Schema:
clinical-event-v1

Supported event types:          8

Normalization:
normalization-v1

Phase-3 gold events:            XXX
Representable:                  XXX / XXX

Synthetic aliases:
Lab aliases mapped:             XX / XX
Medication aliases mapped:      XX / XX
Specialty aliases mapped:       XX / XX

Canonical provenance:
Missing source docs accepted:   0
Unsupported spans accepted:     0

Schema violations accepted:     0
Risk/diagnosis fields:          0
Detector decision fields:       0

Maria canonical fixture:
VALID

Detector sufficiency:
Missed follow-up:               PASS
Duplicate testing:              PASS
Medication monitoring:          PASS

Test suite:
PASS

ClinicalEvent schema hash:
...


Populate the XXX values from actual artifacts, never assumptions.

4.66 Handoff to Phase 5

Phase 5 receives:

continua-synth-v1
continua-eval-v1
clinical-event-v1
normalization-v1
Maria canonical event fixture
event rejection taxonomy
extraction gold set
normalization maps
benchmark policies


Phase 5 now has one narrow task:

Convert messy synthetic cross-provider documents into accurate, grounded ClinicalEvent v1 objects.

It is not allowed to:

detect gaps,
prioritize patients,
diagnose patients,
determine treatment,
smuggle clinical reasoning into the extraction prompt.
Phase 4 Definition of Done

Before leaving this phase, take any messy record from continua-synth-v1 and ask:

If Phase 5 correctly understands this document, is there exactly one well-defined, typed, provenance-preserving representation it should emit?

Then take the resulting event store and ask:

Could Phase 6 determine all three supported gap types without reopening the raw records or asking an LLM what they mean?

If the answer to both is yes, stamp:

CONTINUA PHASE 4: ClinicalEvent v1.0 FROZEN

The next master-plan phase is Phase 5: Extraction & Provenance Engine, where Continua gets its first actual AI component: a constrained structured-extraction pipeline measured against the 12-patient extraction-gold benchmark.
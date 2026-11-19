Continua Phase 7: Evidence & Trust Layer

Phase 6 answers:

What continuity gaps do the deterministic rules believe exist?

Phase 7 answers the more important question:

Can Continua prove every user-facing claim from the underlying records?

This phase is what prevents Continua from becoming another healthcare-AI system that produces convincing-looking answers without showing why they should be trusted.

Phase 7 mission: Convert deterministic candidate gaps into verified, evidence-backed, inspectable claims, suppress anything that cannot be grounded, quantify evidence quality, and establish the human-verification contract for every surfaced intervention.

7.0 North Star

The invariant is:

Every claim
    ↓
Canonical event(s)
    ↓
Source document(s)
    ↓
Exact supporting span(s)
    ↓
Independent verification
    ↓
Coordinator can inspect it


Therefore:

CandidateGap
      ↓
Evidence Collection
      ↓
Document Ownership Check
      ↓
Span Verification
      ↓
Semantic/Structural Support Check
      ↓
Completeness Check
      ↓
Verification Result
      ↓
┌──────────────┬──────────────┐
│ VERIFIED     │ UNVERIFIED   │
│              │              │
▼              ▼              ▼
VerifiedGap   SUPPRESS     Audit Log
      ↓
Phase 8 Priority Engine

Fundamental safety rule

An ungrounded candidate gap never reaches the coordinator queue.

Not:

Show it with a warning.


Not:

Show it at lower confidence.


But:

SUPPRESS IT.

7.1 Inputs

Phase 7 receives only frozen artifacts:

continua-synth-v1
continua-eval-v1
clinical-event-v1
extractor-v1
gaps-v1
gap-policy-v1
canonical events
candidate gaps
event provenance
synthetic source documents
fixed evaluation date
Phase 3 grounding evaluation contract

No ground-truth label is available to the runtime verifier.

7.2 Outputs

Phase 7 produces:

evidence-v1

and:

VerifiedGap v1

along with:

evidence collection engine
document-ownership verifier
source-span verifier
absence-evidence representation
structural support evaluator
verification status model
suppression mechanism
evidence API model
audit trail
trust metrics
evidence benchmark report
Maria evidence package
7.3 Non-Goals

Phase 7 does not:

discover new care gaps;
change detector rules;
repair bad extraction using an LLM;
determine treatment;
assign intervention priority;
generate patient risk;
calculate ROI;
make unsupported evidence "sound better";
expose ground truth;
create new source facts;
decide medical necessity.

If Phase 7 finds insufficient evidence:

The correct output is no user-facing gap.

7.4 Phase Structure
Subphase	Workstream	Result7.0	Handoff validation	Inputs verified
7.1	Trust contract	Verification semantics
7.2	Evidence model	Canonical evidence objects
7.3	Evidence collection	Candidate→source graph
7.4	Ownership verification	Correct patient/document
7.5	Span verification	Exact/fuzzy support
7.6	Event support	Event↔source consistency
7.7	Positive evidence	Trigger verification
7.8	Absence evidence	Missing completion proof
7.9	Multi-document support	Composite claims
7.10	Verification scoring	Evidence confidence
7.11	Suppression	Unsafe gaps removed
7.12	VerifiedGap model	Trusted output contract
7.13	Explanation model	Structured why
7.14	Evidence deep dive	UI/API-ready evidence
7.15	Audit trail	Reproducibility
7.16	Grounding benchmark	Trust metrics
7.17	Adversarial tests	Evidence attacks
7.18	Maria gate	Golden evidence path
7.19	Red-team	Trust-layer attack
7.20	Freeze	evidence-v1
7.5 Trust Contract

Freeze these principles before implementation.

Trust Principle 1

Every positive factual assertion must have supporting provenance.

Example:

Oncology referral placed April 18.

requires:

source document
+
source span

Trust Principle 2

Absence is not quoted like a positive fact.

Example:

No completed oncology consultation was found by June 5.

There is no source sentence saying:

"No consultation exists."

Instead this is a deterministic absence assertion across the canonical event store.

We must represent those differently.

This distinction is extremely important.

Trust Principle 3

A valid citation doesn't automatically prove the entire gap.

Example:

Referral source proves:

oncology referral placed.

It does not independently prove:

no consult happened.

That requires event-store completeness relative to the benchmark inputs.

Trust Principle 4

Evidence verification does not equal clinical validation.

Continua can prove:

Its displayed gap follows from the data and frozen rules.

It cannot claim:

The gap is clinically correct in arbitrary real-world healthcare.

7.6 Canonical Evidence Model

Use explicit evidence types.

type EvidenceItem =
  | PositiveSourceEvidence
  | AbsenceEvidence
  | PolicyEvidence;


This is better than pretending every reasoning step maps to a quoted document.

7.7 Positive Source Evidence

Conceptually:

type PositiveSourceEvidence = {
  evidence_id: string;

  kind: "source_span";

  patient_id: string;

  event_id: string;
  source_doc_id: string;

  quoted_span: string;

  span_start: number;
  span_end: number;

  verification_method:
    | "exact"
    | "fuzzy";

  verification_score: number;

  verified: boolean;
};

7.8 Absence Evidence

This is crucial for follow-up/monitoring gaps.

type AbsenceEvidence = {
  evidence_id: string;

  kind: "absence";

  patient_id: string;

  search_definition: {
    event_types: string[];
    normalized_identity: string;
    start_date: string;
    end_date: string;
  };

  matching_event_count: number;

  event_store_version: string;
  evaluation_as_of_date: string;

  verified: boolean;
};


Example:

Search:
consult/follow-up
specialty = oncology
2026-04-18 → 2026-06-02

Matches:
0


Now:

"No matching oncology consult found"

has a real machine-readable basis.

7.9 Policy Evidence

Some conclusions depend on frozen benchmark policies.

Example:

Referral expected within 45 days.


If 45 days came directly from source:

use source evidence.

If it came from a benchmark fallback:

represent:

type PolicyEvidence = {
  kind: "policy";

  policy_id: string;
  policy_version: string;

  rule: string;

  source:
    | "benchmark_policy"
    | "document_extracted";

  verified: boolean;
};


This prevents Continua from pretending a synthetic benchmark rule came from the clinician's note.

7.10 Evidence Bundle

Each candidate gap gets an EvidenceBundle.

type EvidenceBundle = {
  gap_id: string;
  patient_id: string;

  positive: PositiveSourceEvidence[];
  absence: AbsenceEvidence[];
  policy: PolicyEvidence[];

  verification_status:
    | "verified"
    | "failed";

  failures: VerificationFailure[];
};


No ambiguous:

mostly verified


for user-facing eligibility.

Internally we can track partial failures.

Final gap:

VERIFIED or SUPPRESSED

7.11 Document Existence Check

For every cited source:

source_doc_id
↓
exists?


If not:

EV-001 DOCUMENT_NOT_FOUND


Candidate fails.

This should almost never happen after Phase 5, which makes it valuable as a regression guard.

7.12 Patient Ownership

Check:

document.patient_id == candidate.patient_id


If false:

EV-002 PATIENT_MISMATCH


Hard rejection.

This prevents cross-patient evidence contamination.

7.13 Event Ownership

Similarly:

event.patient_id == candidate.patient_id


and:

event.source_doc_id == evidence.source_doc_id


where relevant.

7.14 Exact Span Verification

Preferred verification:

normalize line endings;
normalize duplicate whitespace;
preserve lexical content;
locate source span;
calculate offsets.

Successful:

verification_method = exact
verification_score = 1.0

7.15 Fuzzy Verification

Use only for formatting/OCR-like differences from the synthetic corpus if those exist.

Threshold remains:

>= 0.85


However, I'd introduce a second safeguard:

Fuzzy span length must be substantial enough to identify a meaningful passage.

Otherwise tiny phrases such as:

"follow-up"


could match many places accidentally.

Set a minimum meaningful span size, for example a configurable character/token threshold, and freeze it before evaluation.

7.16 Fuzzy Verification Must Not Become Semantic Search

This is important.

Rejected:

Source:

"Cardiology follow-up completed."

Candidate:

"Oncology follow-up outstanding."

Even an embedding model might call these semantically related.

We are not doing that.

Evidence-span verification should be lexical/support-oriented, not free-form semantic similarity.

7.17 Span Offset Calculation

Calculate offsets server-side.

Store:

span_start
span_end


Now Phase 12 can highlight exactly:

“Referral to Medical Oncology…”

inside the record.

This becomes a strong visual trust moment.

7.18 Source Excerpt

UI may need context around the exact span.

Store/derive:

N characters before
+
quoted span
+
N characters after


But:

source_text_excerpt


is display context.

The verified exact span remains separate.

7.19 Event-to-Source Consistency

Imagine canonical event says:

specialty = oncology


while source span says:

Cardiology referral.

This should never pass because the event normalization or provenance is wrong.

Evidence layer should verify critical fields against:

raw extracted field;
normalization mapping;
supporting span.

At minimum for determinant fields.

7.20 Critical Fields By Gap Type

Not every field requires equally strict support.

Missed follow-up

Critical:

referral exists;
referral specialty;
referral date;
completion window source.
Duplicate test

Critical:

diagnostic occurrence #1;
test/imaging identity #1;
date #1;
diagnostic occurrence #2;
identity #2;
date #2;
explicit-series state where used.
Medication monitoring

Critical:

medication start;
medication identity;
start date;
stop status if applicable;
monitoring event absence/presence;
monitoring policy identity.

All must be provenance-safe.

7.21 Positive Evidence Verification: Missed Follow-Up

Example:

Candidate:
missed oncology follow-up


Evidence bundle requires:

Positive

Referral event source:

Referral to Medical Oncology...

Policy
45-day window


from either:

document source, or
benchmark policy.
Absence

Search:

consult/followup
specialty oncology
referral_date → due_date


result:

0 qualifying completions


Only then can the gap become verified.

7.22 Critical Nuance: Completeness

Absence reasoning assumes:

We searched the event store produced from the documents supplied to Continua.

It does NOT prove:

No consultation ever happened anywhere in the healthcare system.

Therefore user-facing language must say:

"No qualifying oncology follow-up was found in the available records."

Not:

"The patient did not see oncology."

This language distinction is non-negotiable.

Excellent safety and trust design.

7.23 Duplicate-Test Evidence

A verified duplicate-test candidate requires:

Occurrence A

source + supported identity/date.

Occurrence B

source + supported identity/date.

Structural rule

same frozen diagnostic identity.

Temporal rule

inside duplicate window.

Exclusion check

no explicit series safeguard.

User-facing language should be:

"Possible repeat CBC identified within 8 days; review whether the repeat was intended."

Not:

"Unnecessary CBC."

Because Continua doesn't establish medical necessity.

7.24 Medication-Monitoring Evidence

Requires:

Positive

Medication-start source.

Policy

Monitoring expectation from frozen benchmark registry.

Absence

No qualifying monitoring event found by due date.

Copy:

"No qualifying monitoring result was found in available records by the benchmark due date."

Not:

"Patient failed monitoring."

Again, careful scope.

7.25 Evidence Verification Outcomes

Internally use richer statuses:

VERIFIED
SOURCE_MISSING
PATIENT_MISMATCH
SPAN_FAILED
EVENT_MISMATCH
POLICY_MISSING
ABSENCE_QUERY_INVALID
INSUFFICIENT_SUPPORT


But user-facing eligibility remains binary:

verified
suppressed

7.26 VerifiedGap Contract

Phase 7's main output.

Conceptually:

type VerifiedGap = {
  schema_version: "verified-gap-v1";

  gap_id: string;
  patient_id: string;

  gap_type: GapType;

  severity: GapSeverity;

  title: string;

  candidate: CandidateGap;

  evidence_bundle: EvidenceBundle;

  grounded: true;

  rationale: StructuredRationale;

  recommended_coordinator_action: CoordinatorAction;

  verification: {
    evidence_version: "evidence-v1";
    verified_at: string;
  };
};


Notice:

grounded


is literally always:

true


for VerifiedGap.

Ungrounded candidates don't become this type.

This is useful type-level design.

7.27 Type-Level Trust Boundary

This is an excellent architecture choice:

CandidateGap


can be unsafe/unverified.

VerifiedGap


cannot exist unless evidence verification passes.

Then:

Phase 8 accepts only VerifiedGap[].

Not candidate gaps.

This prevents later developers from accidentally ranking unverified claims.

7.28 Data Flow Constraint

Freeze dependency:

Phase 6
CandidateGap
    ↓
Phase 7
VerifiedGap
    ↓
Phase 8
Intervention Priority


Phase 8 should not even accept a CandidateGap type.

Compiler-level safety is better than documentation.

7.29 Verification Score

We need to be careful here.

Earlier designs used:

confidence = 0.96


This could look like clinical certainty.

I recommend replacing user-visible generic confidence with:

Evidence Quality

Internally it can aggregate factual support properties, but should not be interpreted as probability.

7.30 Do We Need a Composite Evidence Score?

Maybe not.

For hackathon simplicity, stronger is:

Evidence: VERIFIED
Sources: 2
Span matches: 2/2


rather than:

Confidence 96%


That 96% looks more scientific than it really is.

Recommendation

Remove generic user-visible confidence: 0.96.

Retain internal:

extraction confidence;
span verification score.

Display:

Verified evidence


instead.

That actually strengthens trust.

7.31 Evidence Quality Components

If needed internally:

source_validity
span_validity
critical-field coverage
absence-query validity
policy validity


All required critical checks must pass.

No weighted average should rescue a failed critical check.

Example:

98% score


cannot compensate for:

wrong patient source.

7.32 Claim Coverage

For each gap, define required claims.

Example follow-up:

C1 Referral exists
C2 Specialty is oncology
C3 Referral date = X
C4 Due window = W
C5 No qualifying completion found by due date


Evidence layer verifies:

5/5 required claims


If:

4/5


the gap is suppressed.

This is much more defensible than a probabilistic trust score.

7.33 Structured Rationale

Instead of storing only prose:

{
  "rule": "referral_without_matching_completion",
  "claims": [
    {
      "claim": "referral_exists",
      "evidence_id": "..."
    },
    {
      "claim": "specialty",
      "value": "oncology",
      "evidence_id": "..."
    },
    {
      "claim": "qualifying_completion_count",
      "value": 0,
      "evidence_id": "absence-..."
    }
  ]
}


UI prose becomes a deterministic rendering of this structure.

7.34 Deterministic Explanation Rendering

Example:

Referral to Medical Oncology recorded Apr 18.
Expected follow-up window: 45 days.
No completed oncology consultation was found in the available records by Jun 2.


No LLM required.

This is excellent for reproducibility.

7.35 Evidence Deep-Dive Model

Phase 7 should prepare the exact data that the evidence drawer later needs.

For each source:

document type;
provider;
document date;
exact span;
surrounding excerpt;
event type;
normalization explanation if relevant.

Example:

Source
R4 · Referral
Dr A. Patel
Apr 18, 2026

"...Referral to Medical Oncology for
post-surgical evaluation. Please schedule
within 45 days..."

Normalized:
"Medical Oncology" → oncology


Very strong judge-facing detail.

7.36 Absence Deep Dive

Absence needs a different visual.

Example:

Search performed

Events:
Consult / Follow-up

Specialty:
Oncology

Window:
Apr 18 → Jun 2

Completed matches:
0


That makes absence reasoning inspectable rather than magical.

7.37 Policy Deep Dive

If the window came from benchmark policy:

UI should say:

Benchmark demo policy: 30-day referral window

not imply it came from the source record.

If document itself says:

within 45 days

then:

Source-defined follow-up window: 45 days

Different provenance class.

7.38 Evidence API

The Phase-0 contract had:

GET /api/evidence/{gapId}


Now freeze its semantics around VerifiedGap.

A successful request should expose:

{
  "gap_id": "...",
  "verification_status": "verified",
  "claims": [],
  "sources": [],
  "absence_checks": [],
  "policy_checks": [],
  "disclaimer": "Synthetic demo data. For coordinator verification only. Not medical advice."
}

7.39 Suppressed Gap API Behavior

A suppressed candidate:

must not appear


in standard /gaps or queue results.

Developer/evaluation tooling can inspect suppression logs separately.

Don't expose partially trusted claims to coordinator UI.

7.40 Suppression Log

For development:

{
  "gap_id": "...",
  "status": "suppressed",
  "failure_code": "EV-SPAN-FAILED",
  "event_id": "...",
  "source_doc_id": "...",
  "evidence_version": "evidence-v1"
}


Useful for Phase 9 evaluation.

7.41 Over-Suppression Risk

Trust architecture can improve precision at cost of recall.

That's okay to a point.

Therefore benchmark:

Before evidence gating

Candidate-gap metrics.

After evidence gating

Verified-gap metrics.

This shows the tradeoff.

Example hypothetical pattern:

Candidate precision: 0.84
Candidate recall:    0.82

Verified precision: 0.91
Verified recall:    0.78


Do not fabricate values.

But this analysis is valuable.

7.42 Phase 7 Metrics

Primary:

Verified-gap grounding rate
user-visible gaps with complete verified evidence
/
user-visible gaps


Target:

100%

Citation validity

Valid source document + correct patient.

Target:

100%

Span support rate

Verified span / required positive source spans.

Target:

100%


for user-visible gaps.

Required-claim coverage

Target:

100%


for user-visible gaps.

Unsupported-claim rate

Target:

0%


for user-visible gaps.

7.43 Additional Metrics

Track:

candidate gaps received;
candidates verified;
candidates suppressed;
suppression rate;
suppression reasons;
exact span rate;
fuzzy span rate;
absence-check validation rate;
policy-check validation rate.

These tell us whether the trust layer is functioning or hiding widespread upstream failure.

7.44 Grounding Accuracy Definition

Freeze precisely:

A verified gap counts as grounding-correct only if:

all required positive documents exist;
all belong to patient;
every required source span verifies;
all determinant normalized fields correspond to support;
absence check is valid;
required benchmark policy exists/version matches.

All six.

Not merely:

one citation exists

7.45 Phase 7 Evaluation Sets

Use three sets.

A. Valid candidate set

Known well-grounded candidates.

Should:

100% verify

B. Corrupted candidate set

Intentionally mutate evidence.

Should:

100% reject critical corruption

C. Real Phase-6 candidates

Measure practical verification/suppression rate.

This triangulation is stronger than evaluating only happy-path evidence.

7.46 Evidence Mutation Tests

Create mutations.

EV-M1

Change source doc ID to nonexistent.

→ suppress

EV-M2

Change source to another patient.

→ suppress

EV-M3

Change quoted span.

→ suppress

EV-M4

Change normalized specialty while source remains original.

→ suppress

EV-M5

Remove required policy.

→ suppress

EV-M6

Modify absence query window.

→ verification failure

EV-M7

Add matching consult event but keep absence evidence at zero.

→ absence verification fails

EV-M8

Change evidence ordering only.

→ no semantic change

These are extremely strong tests.

7.47 Trust Metamorphic Tests
TM-01

Adding irrelevant document must not invalidate existing verified evidence.

TM-02

Reordering documents must not change verification.

TM-03

Adding a valid completing consult must cause missed-follow-up evidence verification to fail because the gap itself is no longer structurally supported.

Strictly this should ideally be caught by rerunning Phase 6 first, but Phase 7 should independently refuse stale absence evidence.

TM-04

Adding another supporting citation should not weaken verification.

TM-05

Changing display text must not affect evidence correctness.

7.48 Stale Candidate Detection

This is important.

Suppose Phase 6 produced a candidate.

Then event store changes.

Phase 7 must detect candidate version mismatch.

Candidate should carry:

event_store_hash
detector_version
policy_version


Verifier checks current event-store identity.

If stale:

SUPPRESS / REQUIRE RECOMPUTE


Never verify against different state.

7.49 Evidence Version Metadata

Every verification result records:

evidence_version = evidence-v1
clinical_event_schema = clinical-event-v1
extractor_version
detector_version
gap_policy_version
dataset_version
event_store_hash
evaluation_as_of_date


This gives fully traceable judge-facing outputs.

7.50 Audit Trail

For each verified gap:

Candidate created
        ↓
Evidence collected
        ↓
Documents verified
        ↓
Spans checked
        ↓
Fields checked
        ↓
Absence query executed
        ↓
Policies checked
        ↓
Verified


Store minimally structured audit records.

No need for blockchain.

No need for event-sourcing theater.

Simple immutable-ish application log/artifact is enough for hackathon purposes.

7.51 No Chain-of-Thought Exposure

Do not expose hidden model reasoning.

We don't need it anyway.

Our explanation is:

deterministic structured rationale.

That's clearer and safer.

7.52 Evidence Failure Taxonomy

Freeze:

EV-001

Document not found.

EV-002

Patient mismatch.

EV-003

Event/source mismatch.

EV-004

Exact/fuzzy span failed.

EV-005

Critical normalized field unsupported.

EV-006

Policy missing.

EV-007

Policy version mismatch.

EV-008

Absence query invalid.

EV-009

Absence contradicted by matching event.

EV-010

Required claim unsupported.

EV-011

Stale event-store version.

EV-012

Malformed evidence bundle.

7.53 Maria Evidence Package

Maria becomes the flagship trust demonstration.

For missed oncology follow-up:

Claim 1

Referral exists.

Evidence:

R4 exact span.

Claim 2

Specialty = medical oncology.

Evidence:

R4.

Claim 3

Window = 45 days.

Evidence:

R4 source-defined text.

Claim 4

No completed oncology consultation found in available records by due date.

Evidence:

verified absence query over canonical event store.

Output
VERIFIED

7.54 Maria Duplicate-Test Evidence

Must show:

CBC occurrence 1

R5.

CBC occurrence 2

R6.

Identity normalization

Both → cbc.

Interval

8 days.

Series safeguard

No explicit-series evidence.

Copy

"Possible repeat CBC identified 8 days apart. Review whether the repeat was intended."

Not:

"Unnecessary test."

7.55 Maria Monitoring Evidence

Using the corrected Phase-2 monitoring scenario:

valid medication start;
frozen benchmark monitoring target;
due date passed;
no qualifying monitoring result found in available records.

The old not-yet-due tamoxifen case must never return.

Add a regression test specifically ensuring that.

7.56 The Judge-Facing Trust Moment

This should eventually be one of the strongest demo interactions.

Judge sees:

Missed oncology follow-up

Click:

Why?

Continua opens:

SOURCE
Referral · Apr 18

"Referral to Medical Oncology...
Please schedule within 45 days."

WINDOW
Apr 18 → Jun 2

RECORD CHECK
Completed oncology consults found: 0

STATUS
Verified from available synthetic records


This makes Continua visibly different from:

LLM says something.

7.57 Phase 7 Red-Team

Attack it hard.

Attack A: Plausible but unsupported source span

Must reject.

Attack B: Correct source span, wrong patient

Reject.

Attack C: Correct referral evidence, but matching consult exists

Reject stale/miscomputed follow-up gap.

Attack D: Correct two CBC sources, but one is copied representation of same event

Reject candidate support downstream or force recomputation.

Attack E: Modified benchmark window

Policy-version mismatch.

Attack F: Source text changed after extraction

Event-store/document hash mismatch.

Attack G: Fuzzy span at 0.84

Reject.

Attack H: Tiny generic phrase fuzzy-matches elsewhere

Reject through minimum-span/content rules.

Attack I: Model unavailable

No effect.

Phase 7 requires no LLM calls.

Attack J: Ground truth unavailable

No effect.

Runtime verification must work without labels.

7.58 LLM Independence

Just like Phase 6:

Phase 7 LLM calls = 0


No provider key required.

Evidence verification is:

structured;
lexical;
deterministic;
policy-based.

This is a very strong design characteristic.

7.59 Performance

Evidence verification should be local and fast.

Measure:

verification p50/gap
verification p95/gap
full-panel verification


If it's slow, likely we're repeatedly loading/searching large documents inefficiently.

Index by:

document ID
patient ID
event ID


No need for vector databases.

7.60 File Structure

Expected:

lib/evidence/
├── types.ts
├── evidence-bundle.ts
├── collect.ts
├── verify-document.ts
├── verify-patient.ts
├── verify-span.ts
├── verify-fields.ts
├── verify-absence.ts
├── verify-policy.ts
├── verify-gap.ts
├── suppress.ts
├── rationale.ts
├── audit.ts
├── ids.ts
└── version.ts

lib/domain/
└── verified-gap.ts

tests/evidence/
├── document.test.ts
├── ownership.test.ts
├── spans.test.ts
├── fields.test.ts
├── absence.test.ts
├── policy.test.ts
├── suppression.test.ts
├── stale-candidate.test.ts
├── mutation.test.ts
├── metamorphic.test.ts
├── adversarial.test.ts
└── maria.test.ts

scripts/
├── verify-gaps.ts
├── eval-grounding.ts
├── inspect-suppressions.ts
└── build-evidence-artifacts.ts

docs/evidence/
├── trust-contract.md
├── evidence-model.md
├── absence-evidence.md
├── verification-rules.md
├── suppression-policy.md
├── grounding-metrics.md
└── limitations.md

artifacts/evidence/
└── <run-id>/
    ├── metadata.json
    ├── candidate-gaps.json
    ├── verified-gaps.json
    ├── suppressed-gaps.json
    ├── evidence-bundles.json
    ├── grounding-report.json
    └── failures.json

7.61 Phase Execution Order

Follow this sequence:

7.0 Validate Phase-6 outputs
      ↓
7.1 Freeze trust contract
      ↓
7.2 Define EvidenceItem union
      ↓
7.3 Define EvidenceBundle
      ↓
7.4 Define VerifiedGap
      ↓
7.5 Build source-document verifier
      ↓
7.6 Build patient/event ownership checks
      ↓
7.7 Build exact-span verifier
      ↓
7.8 Build bounded fuzzy verifier
      ↓
7.9 Build determinant-field support checks
      ↓
7.10 Build absence-evidence queries
      ↓
7.11 Build policy-evidence checks
      ↓
7.12 Build claim-requirement maps for 3 gap types
      ↓
7.13 Build final verify/suppress gate
      ↓
7.14 Build structured rationale renderer
      ↓
7.15 Build audit trail
      ↓
7.16 Build evidence API contract fixtures
      ↓
7.17 Run valid-candidate benchmark
      ↓
7.18 Run corrupted-candidate benchmark
      ↓
7.19 Run Phase-6 real candidates
      ↓
7.20 Analyze suppression
      ↓
7.21 Maria evidence regression
      ↓
7.22 Mutation/metamorphic tests
      ↓
7.23 Red-team
      ↓
7.24 Freeze evidence-v1

7.62 Quantitative Gates
Metric	RequiredDisplayed gaps with valid source docs	100%
Displayed gaps with correct patient ownership	100%
Required positive spans verified	100%
Required claim coverage	100%
Unsupported user-visible claims	0
Known corrupted critical evidence accepted	0
Wrong-patient evidence accepted	0
Stale absence evidence accepted	0
LLM calls	0
Ground-truth runtime imports	0
Unverified gaps passed to Phase 8	0
Maria evidence failures	0
Evidence tests failing	0

Unlike our detection targets, these are architecture-level trust requirements. Most should truly be hard gates.

7.63 Grounding Report

At phase completion:

CONTINUA EVIDENCE LAYER V1

Input candidate gaps:          XXX
Verified gaps:                 XXX
Suppressed gaps:               XXX

Verification rate:             XX.X%
Suppression rate:              XX.X%

SOURCE INTEGRITY

Valid source docs:             100%
Correct patient ownership:     100%
Verified required spans:       100%

Span methods:
Exact:                         XX.X%
Fuzzy:                         XX.X%

REQUIRED CLAIMS

Fully supported displayed gaps: 100%
Unsupported displayed claims:    0

ABSENCE EVIDENCE

Queries evaluated:             XXX
Valid absence checks:          XXX
Contradicted/stale:            XXX

CORRUPTION RED-TEAM

Corrupted cases:               XX
Critical corruptions rejected: 100%

Maria trust regression:        PASS

LLM calls:                     0


Use actual counts only.

7.64 Acceptance Gates
Gate A: Provenance

Every final gap has complete source lineage.

PASS / FAIL

Gate B: Ownership

Cross-patient contamination impossible in tested paths.

PASS / FAIL

Gate C: Positive Evidence

Every trigger fact is source-supported.

PASS / FAIL

Gate D: Absence Evidence

"No matching event found" claims are deterministically reproducible.

PASS / FAIL

Gate E: Policy Transparency

Synthetic benchmark policy is never misrepresented as record-derived evidence.

PASS / FAIL

Gate F: Suppression

Any critical evidence failure blocks user-facing conversion.

PASS / FAIL

Gate G: Staleness

Mutated event/document state invalidates stale verification.

PASS / FAIL

Gate H: Safety Language

No verified gap states unsupported medical certainty.

PASS / FAIL

Gate I: Evaluation

Grounding/suppression metrics generated from actual artifacts.

PASS / FAIL

Gate J: Maria

All corrected Maria evidence chains are inspectable and valid.

PASS / FAIL

All ten pass.

7.65 Phase Failure Conditions

Stop before Phase 8 if:

"no consult found" is represented as a fake document quote;
source spans are optional for positive facts;
generic model confidence appears as clinical certainty;
wrong-patient citations can pass;
evidence verification silently ignores stale events;
benchmark-policy rules appear as if clinicians stated them;
Phase 7 requires an LLM;
suppressed candidates can enter the queue;
copied source records create apparently independent evidence;
user-facing copy says "did not happen" when we only know "not found in available records";
Maria uses the old invalid monitoring scenario.
7.66 Phase 7 Handoff

Phase 8 receives only:

VerifiedGap[]


plus:

patient_id
severity
structured gap metadata
evidence status
detector metadata
workflow action


Phase 8 will calculate Intervention Priority.

Crucially, Phase 8 must never see or rank:

CandidateGap


because an unverified claim should have no priority at all.

Phase 7 Definition of Done

Before freezing Phase 7, take any gap shown by Continua and ask five questions:

What facts caused this gap?

Visible.

Which record supports each positive fact?

Visible.

Where exactly in that record?

Visible.

If the claim depends on something being absent, what precisely did Continua search for and over what interval?

Visible.

What happens if any required evidence cannot be verified?

The gap disappears from the coordinator-facing product.

If all five answers are deterministic and inspectable, stamp:

CONTINUA PHASE 7: evidence-v1 + VerifiedGap v1 FROZEN

Master-plan next phase
Phase 8 — Intervention Priority Engine

That phase will solve the other half of our product thesis:

We don't merely show Sarah every verified issue. We determine, transparently and reproducibly, which five patients need her attention first, without pretending to predict clinical risk.Continua Phase 7: Evidence & Trust Layer

Phase 6 answers:

What continuity gaps do the deterministic rules believe exist?

Phase 7 answers the more important question:

Can Continua prove every user-facing claim from the underlying records?

This phase is what prevents Continua from becoming another healthcare-AI system that produces convincing-looking answers without showing why they should be trusted.

Phase 7 mission: Convert deterministic candidate gaps into verified, evidence-backed, inspectable claims, suppress anything that cannot be grounded, quantify evidence quality, and establish the human-verification contract for every surfaced intervention.

7.0 North Star

The invariant is:

Every claim
    ↓
Canonical event(s)
    ↓
Source document(s)
    ↓
Exact supporting span(s)
    ↓
Independent verification
    ↓
Coordinator can inspect it


Therefore:

CandidateGap
      ↓
Evidence Collection
      ↓
Document Ownership Check
      ↓
Span Verification
      ↓
Semantic/Structural Support Check
      ↓
Completeness Check
      ↓
Verification Result
      ↓
┌──────────────┬──────────────┐
│ VERIFIED     │ UNVERIFIED   │
│              │              │
▼              ▼              ▼
VerifiedGap   SUPPRESS     Audit Log
      ↓
Phase 8 Priority Engine

Fundamental safety rule

An ungrounded candidate gap never reaches the coordinator queue.

Not:

Show it with a warning.


Not:

Show it at lower confidence.


But:

SUPPRESS IT.

7.1 Inputs

Phase 7 receives only frozen artifacts:

continua-synth-v1
continua-eval-v1
clinical-event-v1
extractor-v1
gaps-v1
gap-policy-v1
canonical events
candidate gaps
event provenance
synthetic source documents
fixed evaluation date
Phase 3 grounding evaluation contract

No ground-truth label is available to the runtime verifier.

7.2 Outputs

Phase 7 produces:

evidence-v1

and:

VerifiedGap v1

along with:

evidence collection engine
document-ownership verifier
source-span verifier
absence-evidence representation
structural support evaluator
verification status model
suppression mechanism
evidence API model
audit trail
trust metrics
evidence benchmark report
Maria evidence package
7.3 Non-Goals

Phase 7 does not:

discover new care gaps;
change detector rules;
repair bad extraction using an LLM;
determine treatment;
assign intervention priority;
generate patient risk;
calculate ROI;
make unsupported evidence "sound better";
expose ground truth;
create new source facts;
decide medical necessity.

If Phase 7 finds insufficient evidence:

The correct output is no user-facing gap.

7.4 Phase Structure
Subphase	Workstream	Result7.0	Handoff validation	Inputs verified
7.1	Trust contract	Verification semantics
7.2	Evidence model	Canonical evidence objects
7.3	Evidence collection	Candidate→source graph
7.4	Ownership verification	Correct patient/document
7.5	Span verification	Exact/fuzzy support
7.6	Event support	Event↔source consistency
7.7	Positive evidence	Trigger verification
7.8	Absence evidence	Missing completion proof
7.9	Multi-document support	Composite claims
7.10	Verification scoring	Evidence confidence
7.11	Suppression	Unsafe gaps removed
7.12	VerifiedGap model	Trusted output contract
7.13	Explanation model	Structured why
7.14	Evidence deep dive	UI/API-ready evidence
7.15	Audit trail	Reproducibility
7.16	Grounding benchmark	Trust metrics
7.17	Adversarial tests	Evidence attacks
7.18	Maria gate	Golden evidence path
7.19	Red-team	Trust-layer attack
7.20	Freeze	evidence-v1
7.5 Trust Contract

Freeze these principles before implementation.

Trust Principle 1

Every positive factual assertion must have supporting provenance.

Example:

Oncology referral placed April 18.

requires:

source document
+
source span

Trust Principle 2

Absence is not quoted like a positive fact.

Example:

No completed oncology consultation was found by June 5.

There is no source sentence saying:

"No consultation exists."

Instead this is a deterministic absence assertion across the canonical event store.

We must represent those differently.

This distinction is extremely important.

Trust Principle 3

A valid citation doesn't automatically prove the entire gap.

Example:

Referral source proves:

oncology referral placed.

It does not independently prove:

no consult happened.

That requires event-store completeness relative to the benchmark inputs.

Trust Principle 4

Evidence verification does not equal clinical validation.

Continua can prove:

Its displayed gap follows from the data and frozen rules.

It cannot claim:

The gap is clinically correct in arbitrary real-world healthcare.

7.6 Canonical Evidence Model

Use explicit evidence types.

type EvidenceItem =
  | PositiveSourceEvidence
  | AbsenceEvidence
  | PolicyEvidence;


This is better than pretending every reasoning step maps to a quoted document.

7.7 Positive Source Evidence

Conceptually:

type PositiveSourceEvidence = {
  evidence_id: string;

  kind: "source_span";

  patient_id: string;

  event_id: string;
  source_doc_id: string;

  quoted_span: string;

  span_start: number;
  span_end: number;

  verification_method:
    | "exact"
    | "fuzzy";

  verification_score: number;

  verified: boolean;
};

7.8 Absence Evidence

This is crucial for follow-up/monitoring gaps.

type AbsenceEvidence = {
  evidence_id: string;

  kind: "absence";

  patient_id: string;

  search_definition: {
    event_types: string[];
    normalized_identity: string;
    start_date: string;
    end_date: string;
  };

  matching_event_count: number;

  event_store_version: string;
  evaluation_as_of_date: string;

  verified: boolean;
};


Example:

Search:
consult/follow-up
specialty = oncology
2026-04-18 → 2026-06-02

Matches:
0


Now:

"No matching oncology consult found"

has a real machine-readable basis.

7.9 Policy Evidence

Some conclusions depend on frozen benchmark policies.

Example:

Referral expected within 45 days.


If 45 days came directly from source:

use source evidence.

If it came from a benchmark fallback:

represent:

type PolicyEvidence = {
  kind: "policy";

  policy_id: string;
  policy_version: string;

  rule: string;

  source:
    | "benchmark_policy"
    | "document_extracted";

  verified: boolean;
};


This prevents Continua from pretending a synthetic benchmark rule came from the clinician's note.

7.10 Evidence Bundle

Each candidate gap gets an EvidenceBundle.

type EvidenceBundle = {
  gap_id: string;
  patient_id: string;

  positive: PositiveSourceEvidence[];
  absence: AbsenceEvidence[];
  policy: PolicyEvidence[];

  verification_status:
    | "verified"
    | "failed";

  failures: VerificationFailure[];
};


No ambiguous:

mostly verified


for user-facing eligibility.

Internally we can track partial failures.

Final gap:

VERIFIED or SUPPRESSED

7.11 Document Existence Check

For every cited source:

source_doc_id
↓
exists?


If not:

EV-001 DOCUMENT_NOT_FOUND


Candidate fails.

This should almost never happen after Phase 5, which makes it valuable as a regression guard.

7.12 Patient Ownership

Check:

document.patient_id == candidate.patient_id


If false:

EV-002 PATIENT_MISMATCH


Hard rejection.

This prevents cross-patient evidence contamination.

7.13 Event Ownership

Similarly:

event.patient_id == candidate.patient_id


and:

event.source_doc_id == evidence.source_doc_id


where relevant.

7.14 Exact Span Verification

Preferred verification:

normalize line endings;
normalize duplicate whitespace;
preserve lexical content;
locate source span;
calculate offsets.

Successful:

verification_method = exact
verification_score = 1.0

7.15 Fuzzy Verification

Use only for formatting/OCR-like differences from the synthetic corpus if those exist.

Threshold remains:

>= 0.85


However, I'd introduce a second safeguard:

Fuzzy span length must be substantial enough to identify a meaningful passage.

Otherwise tiny phrases such as:

"follow-up"


could match many places accidentally.

Set a minimum meaningful span size, for example a configurable character/token threshold, and freeze it before evaluation.

7.16 Fuzzy Verification Must Not Become Semantic Search

This is important.

Rejected:

Source:

"Cardiology follow-up completed."

Candidate:

"Oncology follow-up outstanding."

Even an embedding model might call these semantically related.

We are not doing that.

Evidence-span verification should be lexical/support-oriented, not free-form semantic similarity.

7.17 Span Offset Calculation

Calculate offsets server-side.

Store:

span_start
span_end


Now Phase 12 can highlight exactly:

“Referral to Medical Oncology…”

inside the record.

This becomes a strong visual trust moment.

7.18 Source Excerpt

UI may need context around the exact span.

Store/derive:

N characters before
+
quoted span
+
N characters after


But:

source_text_excerpt


is display context.

The verified exact span remains separate.

7.19 Event-to-Source Consistency

Imagine canonical event says:

specialty = oncology


while source span says:

Cardiology referral.

This should never pass because the event normalization or provenance is wrong.

Evidence layer should verify critical fields against:

raw extracted field;
normalization mapping;
supporting span.

At minimum for determinant fields.

7.20 Critical Fields By Gap Type

Not every field requires equally strict support.

Missed follow-up

Critical:

referral exists;
referral specialty;
referral date;
completion window source.
Duplicate test

Critical:

diagnostic occurrence #1;
test/imaging identity #1;
date #1;
diagnostic occurrence #2;
identity #2;
date #2;
explicit-series state where used.
Medication monitoring

Critical:

medication start;
medication identity;
start date;
stop status if applicable;
monitoring event absence/presence;
monitoring policy identity.

All must be provenance-safe.

7.21 Positive Evidence Verification: Missed Follow-Up

Example:

Candidate:
missed oncology follow-up


Evidence bundle requires:

Positive

Referral event source:

Referral to Medical Oncology...

Policy
45-day window


from either:

document source, or
benchmark policy.
Absence

Search:

consult/followup
specialty oncology
referral_date → due_date


result:

0 qualifying completions


Only then can the gap become verified.

7.22 Critical Nuance: Completeness

Absence reasoning assumes:

We searched the event store produced from the documents supplied to Continua.

It does NOT prove:

No consultation ever happened anywhere in the healthcare system.

Therefore user-facing language must say:

"No qualifying oncology follow-up was found in the available records."

Not:

"The patient did not see oncology."

This language distinction is non-negotiable.

Excellent safety and trust design.

7.23 Duplicate-Test Evidence

A verified duplicate-test candidate requires:

Occurrence A

source + supported identity/date.

Occurrence B

source + supported identity/date.

Structural rule

same frozen diagnostic identity.

Temporal rule

inside duplicate window.

Exclusion check

no explicit series safeguard.

User-facing language should be:

"Possible repeat CBC identified within 8 days; review whether the repeat was intended."

Not:

"Unnecessary CBC."

Because Continua doesn't establish medical necessity.

7.24 Medication-Monitoring Evidence

Requires:

Positive

Medication-start source.

Policy

Monitoring expectation from frozen benchmark registry.

Absence

No qualifying monitoring event found by due date.

Copy:

"No qualifying monitoring result was found in available records by the benchmark due date."

Not:

"Patient failed monitoring."

Again, careful scope.

7.25 Evidence Verification Outcomes

Internally use richer statuses:

VERIFIED
SOURCE_MISSING
PATIENT_MISMATCH
SPAN_FAILED
EVENT_MISMATCH
POLICY_MISSING
ABSENCE_QUERY_INVALID
INSUFFICIENT_SUPPORT


But user-facing eligibility remains binary:

verified
suppressed

7.26 VerifiedGap Contract

Phase 7's main output.

Conceptually:

type VerifiedGap = {
  schema_version: "verified-gap-v1";

  gap_id: string;
  patient_id: string;

  gap_type: GapType;

  severity: GapSeverity;

  title: string;

  candidate: CandidateGap;

  evidence_bundle: EvidenceBundle;

  grounded: true;

  rationale: StructuredRationale;

  recommended_coordinator_action: CoordinatorAction;

  verification: {
    evidence_version: "evidence-v1";
    verified_at: string;
  };
};


Notice:

grounded


is literally always:

true


for VerifiedGap.

Ungrounded candidates don't become this type.

This is useful type-level design.

7.27 Type-Level Trust Boundary

This is an excellent architecture choice:

CandidateGap


can be unsafe/unverified.

VerifiedGap


cannot exist unless evidence verification passes.

Then:

Phase 8 accepts only VerifiedGap[].

Not candidate gaps.

This prevents later developers from accidentally ranking unverified claims.

7.28 Data Flow Constraint

Freeze dependency:

Phase 6
CandidateGap
    ↓
Phase 7
VerifiedGap
    ↓
Phase 8
Intervention Priority


Phase 8 should not even accept a CandidateGap type.

Compiler-level safety is better than documentation.

7.29 Verification Score

We need to be careful here.

Earlier designs used:

confidence = 0.96


This could look like clinical certainty.

I recommend replacing user-visible generic confidence with:

Evidence Quality

Internally it can aggregate factual support properties, but should not be interpreted as probability.

7.30 Do We Need a Composite Evidence Score?

Maybe not.

For hackathon simplicity, stronger is:

Evidence: VERIFIED
Sources: 2
Span matches: 2/2


rather than:

Confidence 96%


That 96% looks more scientific than it really is.

Recommendation

Remove generic user-visible confidence: 0.96.

Retain internal:

extraction confidence;
span verification score.

Display:

Verified evidence


instead.

That actually strengthens trust.

7.31 Evidence Quality Components

If needed internally:

source_validity
span_validity
critical-field coverage
absence-query validity
policy validity


All required critical checks must pass.

No weighted average should rescue a failed critical check.

Example:

98% score


cannot compensate for:

wrong patient source.

7.32 Claim Coverage

For each gap, define required claims.

Example follow-up:

C1 Referral exists
C2 Specialty is oncology
C3 Referral date = X
C4 Due window = W
C5 No qualifying completion found by due date


Evidence layer verifies:

5/5 required claims


If:

4/5


the gap is suppressed.

This is much more defensible than a probabilistic trust score.

7.33 Structured Rationale

Instead of storing only prose:

{
  "rule": "referral_without_matching_completion",
  "claims": [
    {
      "claim": "referral_exists",
      "evidence_id": "..."
    },
    {
      "claim": "specialty",
      "value": "oncology",
      "evidence_id": "..."
    },
    {
      "claim": "qualifying_completion_count",
      "value": 0,
      "evidence_id": "absence-..."
    }
  ]
}


UI prose becomes a deterministic rendering of this structure.

7.34 Deterministic Explanation Rendering

Example:

Referral to Medical Oncology recorded Apr 18.
Expected follow-up window: 45 days.
No completed oncology consultation was found in the available records by Jun 2.


No LLM required.

This is excellent for reproducibility.

7.35 Evidence Deep-Dive Model

Phase 7 should prepare the exact data that the evidence drawer later needs.

For each source:

document type;
provider;
document date;
exact span;
surrounding excerpt;
event type;
normalization explanation if relevant.

Example:

Source
R4 · Referral
Dr A. Patel
Apr 18, 2026

"...Referral to Medical Oncology for
post-surgical evaluation. Please schedule
within 45 days..."

Normalized:
"Medical Oncology" → oncology


Very strong judge-facing detail.

7.36 Absence Deep Dive

Absence needs a different visual.

Example:

Search performed

Events:
Consult / Follow-up

Specialty:
Oncology

Window:
Apr 18 → Jun 2

Completed matches:
0


That makes absence reasoning inspectable rather than magical.

7.37 Policy Deep Dive

If the window came from benchmark policy:

UI should say:

Benchmark demo policy: 30-day referral window

not imply it came from the source record.

If document itself says:

within 45 days

then:

Source-defined follow-up window: 45 days

Different provenance class.

7.38 Evidence API

The Phase-0 contract had:

GET /api/evidence/{gapId}


Now freeze its semantics around VerifiedGap.

A successful request should expose:

{
  "gap_id": "...",
  "verification_status": "verified",
  "claims": [],
  "sources": [],
  "absence_checks": [],
  "policy_checks": [],
  "disclaimer": "Synthetic demo data. For coordinator verification only. Not medical advice."
}

7.39 Suppressed Gap API Behavior

A suppressed candidate:

must not appear


in standard /gaps or queue results.

Developer/evaluation tooling can inspect suppression logs separately.

Don't expose partially trusted claims to coordinator UI.

7.40 Suppression Log

For development:

{
  "gap_id": "...",
  "status": "suppressed",
  "failure_code": "EV-SPAN-FAILED",
  "event_id": "...",
  "source_doc_id": "...",
  "evidence_version": "evidence-v1"
}


Useful for Phase 9 evaluation.

7.41 Over-Suppression Risk

Trust architecture can improve precision at cost of recall.

That's okay to a point.

Therefore benchmark:

Before evidence gating

Candidate-gap metrics.

After evidence gating

Verified-gap metrics.

This shows the tradeoff.

Example hypothetical pattern:

Candidate precision: 0.84
Candidate recall:    0.82

Verified precision: 0.91
Verified recall:    0.78


Do not fabricate values.

But this analysis is valuable.

7.42 Phase 7 Metrics

Primary:

Verified-gap grounding rate
user-visible gaps with complete verified evidence
/
user-visible gaps


Target:

100%

Citation validity

Valid source document + correct patient.

Target:

100%

Span support rate

Verified span / required positive source spans.

Target:

100%


for user-visible gaps.

Required-claim coverage

Target:

100%


for user-visible gaps.

Unsupported-claim rate

Target:

0%


for user-visible gaps.

7.43 Additional Metrics

Track:

candidate gaps received;
candidates verified;
candidates suppressed;
suppression rate;
suppression reasons;
exact span rate;
fuzzy span rate;
absence-check validation rate;
policy-check validation rate.

These tell us whether the trust layer is functioning or hiding widespread upstream failure.

7.44 Grounding Accuracy Definition

Freeze precisely:

A verified gap counts as grounding-correct only if:

all required positive documents exist;
all belong to patient;
every required source span verifies;
all determinant normalized fields correspond to support;
absence check is valid;
required benchmark policy exists/version matches.

All six.

Not merely:

one citation exists

7.45 Phase 7 Evaluation Sets

Use three sets.

A. Valid candidate set

Known well-grounded candidates.

Should:

100% verify

B. Corrupted candidate set

Intentionally mutate evidence.

Should:

100% reject critical corruption

C. Real Phase-6 candidates

Measure practical verification/suppression rate.

This triangulation is stronger than evaluating only happy-path evidence.

7.46 Evidence Mutation Tests

Create mutations.

EV-M1

Change source doc ID to nonexistent.

→ suppress

EV-M2

Change source to another patient.

→ suppress

EV-M3

Change quoted span.

→ suppress

EV-M4

Change normalized specialty while source remains original.

→ suppress

EV-M5

Remove required policy.

→ suppress

EV-M6

Modify absence query window.

→ verification failure

EV-M7

Add matching consult event but keep absence evidence at zero.

→ absence verification fails

EV-M8

Change evidence ordering only.

→ no semantic change

These are extremely strong tests.

7.47 Trust Metamorphic Tests
TM-01

Adding irrelevant document must not invalidate existing verified evidence.

TM-02

Reordering documents must not change verification.

TM-03

Adding a valid completing consult must cause missed-follow-up evidence verification to fail because the gap itself is no longer structurally supported.

Strictly this should ideally be caught by rerunning Phase 6 first, but Phase 7 should independently refuse stale absence evidence.

TM-04

Adding another supporting citation should not weaken verification.

TM-05

Changing display text must not affect evidence correctness.

7.48 Stale Candidate Detection

This is important.

Suppose Phase 6 produced a candidate.

Then event store changes.

Phase 7 must detect candidate version mismatch.

Candidate should carry:

event_store_hash
detector_version
policy_version


Verifier checks current event-store identity.

If stale:

SUPPRESS / REQUIRE RECOMPUTE


Never verify against different state.

7.49 Evidence Version Metadata

Every verification result records:

evidence_version = evidence-v1
clinical_event_schema = clinical-event-v1
extractor_version
detector_version
gap_policy_version
dataset_version
event_store_hash
evaluation_as_of_date


This gives fully traceable judge-facing outputs.

7.50 Audit Trail

For each verified gap:

Candidate created
        ↓
Evidence collected
        ↓
Documents verified
        ↓
Spans checked
        ↓
Fields checked
        ↓
Absence query executed
        ↓
Policies checked
        ↓
Verified


Store minimally structured audit records.

No need for blockchain.

No need for event-sourcing theater.

Simple immutable-ish application log/artifact is enough for hackathon purposes.

7.51 No Chain-of-Thought Exposure

Do not expose hidden model reasoning.

We don't need it anyway.

Our explanation is:

deterministic structured rationale.

That's clearer and safer.

7.52 Evidence Failure Taxonomy

Freeze:

EV-001

Document not found.

EV-002

Patient mismatch.

EV-003

Event/source mismatch.

EV-004

Exact/fuzzy span failed.

EV-005

Critical normalized field unsupported.

EV-006

Policy missing.

EV-007

Policy version mismatch.

EV-008

Absence query invalid.

EV-009

Absence contradicted by matching event.

EV-010

Required claim unsupported.

EV-011

Stale event-store version.

EV-012

Malformed evidence bundle.

7.53 Maria Evidence Package

Maria becomes the flagship trust demonstration.

For missed oncology follow-up:

Claim 1

Referral exists.

Evidence:

R4 exact span.

Claim 2

Specialty = medical oncology.

Evidence:

R4.

Claim 3

Window = 45 days.

Evidence:

R4 source-defined text.

Claim 4

No completed oncology consultation found in available records by due date.

Evidence:

verified absence query over canonical event store.

Output
VERIFIED

7.54 Maria Duplicate-Test Evidence

Must show:

CBC occurrence 1

R5.

CBC occurrence 2

R6.

Identity normalization

Both → cbc.

Interval

8 days.

Series safeguard

No explicit-series evidence.

Copy

"Possible repeat CBC identified 8 days apart. Review whether the repeat was intended."

Not:

"Unnecessary test."

7.55 Maria Monitoring Evidence

Using the corrected Phase-2 monitoring scenario:

valid medication start;
frozen benchmark monitoring target;
due date passed;
no qualifying monitoring result found in available records.

The old not-yet-due tamoxifen case must never return.

Add a regression test specifically ensuring that.

7.56 The Judge-Facing Trust Moment

This should eventually be one of the strongest demo interactions.

Judge sees:

Missed oncology follow-up

Click:

Why?

Continua opens:

SOURCE
Referral · Apr 18

"Referral to Medical Oncology...
Please schedule within 45 days."

WINDOW
Apr 18 → Jun 2

RECORD CHECK
Completed oncology consults found: 0

STATUS
Verified from available synthetic records


This makes Continua visibly different from:

LLM says something.

7.57 Phase 7 Red-Team

Attack it hard.

Attack A: Plausible but unsupported source span

Must reject.

Attack B: Correct source span, wrong patient

Reject.

Attack C: Correct referral evidence, but matching consult exists

Reject stale/miscomputed follow-up gap.

Attack D: Correct two CBC sources, but one is copied representation of same event

Reject candidate support downstream or force recomputation.

Attack E: Modified benchmark window

Policy-version mismatch.

Attack F: Source text changed after extraction

Event-store/document hash mismatch.

Attack G: Fuzzy span at 0.84

Reject.

Attack H: Tiny generic phrase fuzzy-matches elsewhere

Reject through minimum-span/content rules.

Attack I: Model unavailable

No effect.

Phase 7 requires no LLM calls.

Attack J: Ground truth unavailable

No effect.

Runtime verification must work without labels.

7.58 LLM Independence

Just like Phase 6:

Phase 7 LLM calls = 0


No provider key required.

Evidence verification is:

structured;
lexical;
deterministic;
policy-based.

This is a very strong design characteristic.

7.59 Performance

Evidence verification should be local and fast.

Measure:

verification p50/gap
verification p95/gap
full-panel verification


If it's slow, likely we're repeatedly loading/searching large documents inefficiently.

Index by:

document ID
patient ID
event ID


No need for vector databases.

7.60 File Structure

Expected:

lib/evidence/
├── types.ts
├── evidence-bundle.ts
├── collect.ts
├── verify-document.ts
├── verify-patient.ts
├── verify-span.ts
├── verify-fields.ts
├── verify-absence.ts
├── verify-policy.ts
├── verify-gap.ts
├── suppress.ts
├── rationale.ts
├── audit.ts
├── ids.ts
└── version.ts

lib/domain/
└── verified-gap.ts

tests/evidence/
├── document.test.ts
├── ownership.test.ts
├── spans.test.ts
├── fields.test.ts
├── absence.test.ts
├── policy.test.ts
├── suppression.test.ts
├── stale-candidate.test.ts
├── mutation.test.ts
├── metamorphic.test.ts
├── adversarial.test.ts
└── maria.test.ts

scripts/
├── verify-gaps.ts
├── eval-grounding.ts
├── inspect-suppressions.ts
└── build-evidence-artifacts.ts

docs/evidence/
├── trust-contract.md
├── evidence-model.md
├── absence-evidence.md
├── verification-rules.md
├── suppression-policy.md
├── grounding-metrics.md
└── limitations.md

artifacts/evidence/
└── <run-id>/
    ├── metadata.json
    ├── candidate-gaps.json
    ├── verified-gaps.json
    ├── suppressed-gaps.json
    ├── evidence-bundles.json
    ├── grounding-report.json
    └── failures.json

7.61 Phase Execution Order

Follow this sequence:

7.0 Validate Phase-6 outputs
      ↓
7.1 Freeze trust contract
      ↓
7.2 Define EvidenceItem union
      ↓
7.3 Define EvidenceBundle
      ↓
7.4 Define VerifiedGap
      ↓
7.5 Build source-document verifier
      ↓
7.6 Build patient/event ownership checks
      ↓
7.7 Build exact-span verifier
      ↓
7.8 Build bounded fuzzy verifier
      ↓
7.9 Build determinant-field support checks
      ↓
7.10 Build absence-evidence queries
      ↓
7.11 Build policy-evidence checks
      ↓
7.12 Build claim-requirement maps for 3 gap types
      ↓
7.13 Build final verify/suppress gate
      ↓
7.14 Build structured rationale renderer
      ↓
7.15 Build audit trail
      ↓
7.16 Build evidence API contract fixtures
      ↓
7.17 Run valid-candidate benchmark
      ↓
7.18 Run corrupted-candidate benchmark
      ↓
7.19 Run Phase-6 real candidates
      ↓
7.20 Analyze suppression
      ↓
7.21 Maria evidence regression
      ↓
7.22 Mutation/metamorphic tests
      ↓
7.23 Red-team
      ↓
7.24 Freeze evidence-v1

7.62 Quantitative Gates
Metric	RequiredDisplayed gaps with valid source docs	100%
Displayed gaps with correct patient ownership	100%
Required positive spans verified	100%
Required claim coverage	100%
Unsupported user-visible claims	0
Known corrupted critical evidence accepted	0
Wrong-patient evidence accepted	0
Stale absence evidence accepted	0
LLM calls	0
Ground-truth runtime imports	0
Unverified gaps passed to Phase 8	0
Maria evidence failures	0
Evidence tests failing	0

Unlike our detection targets, these are architecture-level trust requirements. Most should truly be hard gates.

7.63 Grounding Report

At phase completion:

CONTINUA EVIDENCE LAYER V1

Input candidate gaps:          XXX
Verified gaps:                 XXX
Suppressed gaps:               XXX

Verification rate:             XX.X%
Suppression rate:              XX.X%

SOURCE INTEGRITY

Valid source docs:             100%
Correct patient ownership:     100%
Verified required spans:       100%

Span methods:
Exact:                         XX.X%
Fuzzy:                         XX.X%

REQUIRED CLAIMS

Fully supported displayed gaps: 100%
Unsupported displayed claims:    0

ABSENCE EVIDENCE

Queries evaluated:             XXX
Valid absence checks:          XXX
Contradicted/stale:            XXX

CORRUPTION RED-TEAM

Corrupted cases:               XX
Critical corruptions rejected: 100%

Maria trust regression:        PASS

LLM calls:                     0


Use actual counts only.

7.64 Acceptance Gates
Gate A: Provenance

Every final gap has complete source lineage.

PASS / FAIL

Gate B: Ownership

Cross-patient contamination impossible in tested paths.

PASS / FAIL

Gate C: Positive Evidence

Every trigger fact is source-supported.

PASS / FAIL

Gate D: Absence Evidence

"No matching event found" claims are deterministically reproducible.

PASS / FAIL

Gate E: Policy Transparency

Synthetic benchmark policy is never misrepresented as record-derived evidence.

PASS / FAIL

Gate F: Suppression

Any critical evidence failure blocks user-facing conversion.

PASS / FAIL

Gate G: Staleness

Mutated event/document state invalidates stale verification.

PASS / FAIL

Gate H: Safety Language

No verified gap states unsupported medical certainty.

PASS / FAIL

Gate I: Evaluation

Grounding/suppression metrics generated from actual artifacts.

PASS / FAIL

Gate J: Maria

All corrected Maria evidence chains are inspectable and valid.

PASS / FAIL

All ten pass.

7.65 Phase Failure Conditions

Stop before Phase 8 if:

"no consult found" is represented as a fake document quote;
source spans are optional for positive facts;
generic model confidence appears as clinical certainty;
wrong-patient citations can pass;
evidence verification silently ignores stale events;
benchmark-policy rules appear as if clinicians stated them;
Phase 7 requires an LLM;
suppressed candidates can enter the queue;
copied source records create apparently independent evidence;
user-facing copy says "did not happen" when we only know "not found in available records";
Maria uses the old invalid monitoring scenario.
7.66 Phase 7 Handoff

Phase 8 receives only:

VerifiedGap[]


plus:

patient_id
severity
structured gap metadata
evidence status
detector metadata
workflow action


Phase 8 will calculate Intervention Priority.

Crucially, Phase 8 must never see or rank:

CandidateGap


because an unverified claim should have no priority at all.

Phase 7 Definition of Done

Before freezing Phase 7, take any gap shown by Continua and ask five questions:

What facts caused this gap?

Visible.

Which record supports each positive fact?

Visible.

Where exactly in that record?

Visible.

If the claim depends on something being absent, what precisely did Continua search for and over what interval?

Visible.

What happens if any required evidence cannot be verified?

The gap disappears from the coordinator-facing product.

If all five answers are deterministic and inspectable, stamp:

CONTINUA PHASE 7: evidence-v1 + VerifiedGap v1 FROZEN

Master-plan next phase
Phase 8 — Intervention Priority Engine

That phase will solve the other half of our product thesis:

We don't merely show Sarah every verified issue. We determine, transparently and reproducibly, which five patients need her attention first, without pretending to predict clinical risk.
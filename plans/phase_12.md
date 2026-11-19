Continua Phase 12: Coordinator UX

Phases 0–11 built the intelligence, trust, benchmark, cache, and API foundation. Phase 12 is where that engineering finally becomes a product.

This phase has one job:

Make a care coordinator understand, trust, and act on Continua within seconds, while giving a judge an immediately memorable product experience.

We are not building a healthcare dashboard.

We are building a continuity intervention workbench.

12.0 Mission

Transform continua-api-v1 into a polished desktop-first workflow where a coordinator can answer four questions:

Who should I review first?
What appears unresolved?
Why does Continua think that?
What coordination action should I take?

Core interaction:

80 patients
      ↓
5 prioritized interventions
      ↓
Open patient
      ↓
Understand journey
      ↓
See verified gap
      ↓
Inspect evidence
      ↓
Take coordinator action


The product should be understandable without explaining:

LLMs
F1
FHIR
EHR interoperability
embeddings
agents
architecture

Those belong in methodology, not the primary workflow.

12.1 Phase Outcome

Phase 12 produces:

Continua Coordinator Workbench UX v1

with:

application shell
panel home
Top-5 intervention queue
patient directory
patient journey
verified gap cards
evidence drawer
priority explanation
impact view
evaluation/methodology view
loading/empty/error states
responsive behavior
accessibility baseline
judge-mode optimized navigation
complete UI regression suite
12.2 Primary Persona
Sarah, Care Coordinator

Synthetic persona used solely to define workflow.

Her problem:

Large patient panel
+
Fragmented records
+
Limited outreach capacity
=
Hard to know where to start


Continua should eliminate:

"Which chart do I open first?"

It should not attempt to eliminate:

clinical judgment.

12.3 Secondary Persona

Nurse navigator.

Same broad workflow:

inspect patient journey
recognize unresolved coordination issue
inspect source
coordinate next step

Do not build separate nurse-navigator screens.

12.4 Judge Persona

There is effectively another user:

A judge seeing Continua for roughly 1–2 minutes.

The design must therefore work simultaneously at:

2 seconds

Understand what product does.

15 seconds

Understand why it matters.

30 seconds

See workflow intelligence.

60 seconds

See trust/evidence.

90 seconds

Understand technical and business differentiation.

That's a stringent UX requirement.

12.5 Phase Structure
Subphase	Deliverable12.0	UX constitution
12.1	Information architecture
12.2	Visual system
12.3	App shell
12.4	Panel overview
12.5	Top-5 queue
12.6	Patient directory
12.7	Patient header
12.8	Longitudinal timeline
12.9	Verified gap cards
12.10	Evidence drawer
12.11	Priority explanation
12.12	Coordinator actions
12.13	Impact view
12.14	Evaluation view
12.15	Methodology view
12.16	Empty/loading/error states
12.17	Accessibility
12.18	Responsive behavior
12.19	Judge mode
12.20	Usability testing
12.21	Visual QA
12.22	Performance
12.23	UX red-team
12.24	Freeze
12.6 UX Constitution

Freeze these rules before building screens.

Rule 1: Action before analytics

Homepage answers:

Who should I review?

Not:

Here's a dashboard with 14 charts.

Rule 2: One primary task per screen

Don't create a NASA control room.

Rule 3: Progressive disclosure

Show:

Issue
↓
Reason
↓
Evidence
↓
Methodology


not every detail simultaneously.

Rule 4: Evidence is one click away

Any gap:

Gap → Evidence


maximum one meaningful interaction.

Rule 5: No clinical-risk visual language

Avoid:

"mortality red"
danger meters
"patient at risk"
predictive gauges

Priority is workflow priority.

Rule 6: Color never carries meaning alone

Use:

P1 · Act first


not just a red badge.

Rule 7: No AI theater

No fake:

AI thinking...
Scanning 80 patients...
Deep reasoning...


when loading cached data.

12.7 Product Positioning in the UI

Working brand:

Continua

Descriptor:

Continuity intelligence for care coordinators

Primary promise:

From a full patient panel to the next coordination actions that deserve review.

For demo storytelling we can still use the punchier:

80 patients. 5 actions.

But formal UI should avoid implying the other 75 clinically need nothing.

12.8 Navigation Architecture

Keep navigation minimal.

Recommended sidebar:

Continua

Today
Patients

Insights
Evaluation
Methodology


Potential bottom section:

Synthetic Demo
v1


No:

Billing
Administration
Integrations
Settings maze
Chat
AI Copilot

unless later genuinely needed.

12.9 Core Screens

I recommend six primary screens, not nine.

Screen 1

Today / Coordinator Queue

Screen 2

All Patients

Screen 3

Patient Workspace

Screen 4

Impact

Screen 5

Evaluation

Screen 6

Methodology

Evidence should be a drawer/modal within Patient Workspace rather than another top-level screen.

This makes the product feel tighter.

12.10 Global Banner

Persistent but non-obstructive:

Synthetic demonstration data · No real patient information · Coordinator decision support only

Do not cover 15% of viewport with a warning box.

Use a thin, polished notice.

12.11 Screen 1: Today

This is Continua's most important screen.

Above the fold:

Good morning, Sarah

80 patients in your panel
5 prioritized for review


Then:

Review first

The Top-5 queue.

Not charts.

Not architecture.

Not F1.

12.12 Hero Metric Discipline

Avoid huge numbers like:

$12.4M saved


unless genuinely derived and relevant.

Homepage metrics can be:

80 patients
XX with verified continuity gaps
5 prioritized for review


These come directly from application data.

12.13 Top-5 Queue Card

Each card needs only what Sarah requires.

#1
Maria Chen · 54

P1 · Act first

Oncology follow-up unresolved
3 days overdue

3 verified coordination issues

Verify referral status and coordinate follow-up.

[Review patient]


Maria's actual rank/band must come from Phase 8.

This example is structural, not a promised rank.

12.14 Queue Visual Hierarchy

From top to bottom:

rank
person
workflow-priority label
top issue
brief reason
action
verified-evidence indicator

Do not prioritize:

score = 82


over:

Oncology follow-up unresolved


A coordinator cares about the issue, not the mathematical score.

12.15 Show Score or Not?

I'd make the numeric score secondary.

Primary:

P1 · Act first


Optional:

Priority details

reveals:

Patient priority: 82 / 100


Why?

A large "82" can easily look like a clinical-risk probability.

The workflow label is safer.

12.16 Queue Evidence Marker

A small treatment:

✓ Verified evidence


This is important.

It immediately communicates:

This isn't an unsupported AI suggestion.

Don't turn it into a giant green compliance badge.

12.17 Queue Sorting

UI receives authoritative order from API.

It must not sort by:

gap count
age
name
score independently

unless user explicitly chooses another allowed view later.

Default = Phase-8 ranked order.

12.18 Panel Compression Visual

One subtle visual can make:

80 → 5


memorable.

For instance:

80 panel patients     →     5 review first
████████████████              █████


But avoid an ornamental chart that consumes space.

A simple textual progression is enough:

80 patients → 17 with verified gaps → 5 prioritized for review

using actual generated counts.

That is stronger.

12.19 Screen 2: All Patients

Purpose:

Show this is a real panel tool, not five hardcoded demo cards.

Header:

All Patients
80 patients


Search:

Search patient


Filters:

Gap type
Workflow priority


Optional:

Verified issues only

12.20 Patient Table

Columns:

Patient
Primary condition
Last contact
Verified issues
Priority
Top issue


Avoid 14 columns.

No raw medical data dump.

12.21 Row Interaction

Click anywhere on row:

Patient Workspace.

Keyboard focusable.

No tiny hidden action icon required.

12.22 No-Gap Patients

Show:

No verified continuity issues found


not:

Healthy
Safe
Low risk


This distinction is essential.

12.23 Screen 3: Patient Workspace

This is the core "wow" screen.

Recommended structure:

┌────────────────────────────────────────────┐
│ Maria Chen               P? Workflow      │
│ 54F · Breast cancer — post-surgical       │
│ Last available record: Apr 28             │
└────────────────────────────────────────────┘

┌──────────────────────┬─────────────────────┐
│                      │                     │
│ Patient Journey      │ Verified Issues     │
│                      │                     │
│ Timeline             │ Gap Cards           │
│                      │                     │
└──────────────────────┴─────────────────────┘


Desktop-first split layout.

12.24 Patient Header

Show:

name
age/sex
primary synthetic condition
last record date
workflow priority
verified gap count

Do not show:

clinical risk
probability
prognosis
AI confidence
12.25 Timeline

The timeline answers:

What happened?

Each event:

Apr 18

Medical Oncology Referral
Dr. A. Patel · Primary Care

Post-surgical oncology evaluation

[Source]


Use icons sparingly.

Timeline should visually distinguish:

surgery
imaging
referral
consult
labs
medication
follow-up

But text remains the primary signal.

12.26 Timeline Styling

Use one vertical line with event nodes.

Avoid excessive cards around every event.

For each node:

date
event
provider
1-line summary
source chip


That's enough.

12.27 Continuity Gap Visualization

This is a unique opportunity.

For Maria:

Apr 18
Oncology referral
      │
      │ expected follow-up window
      │
Jun 2
Expected by
      │
      │ no matching completed consult
      ▼
Jun 5
Available record cutoff


This makes the gap visible without requiring paragraphs.

This should be one of our best UX elements.

12.28 Don't Fake Future Events

The timeline cannot invent:

Oncology appointment missed


if all we know is:

no completed consult found.

Display:

Expected follow-up window ended


That's truthful.

12.29 Verified Gap Panel

Right side:

VERIFIED ISSUES

P1
Oncology follow-up unresolved

No completed oncology consultation was found
in available records by the expected date.

[View evidence]

Coordinator action
Verify referral status and coordinate follow-up.


Then next gaps beneath.

12.30 Gap Card Anatomy

Each gap:

Header

Gap type + workflow priority.

Statement

Precisely scoped.

Why

1–2 lines.

Evidence

"2 verified sources" or equivalent.

Action

Coordinator workflow action.

Details

Evidence drawer trigger.

12.31 Gap Copy Style

Use:

Appears unresolved

Possible repeat

Not found in available records

Verify

Review

Coordinate

Avoid:

Failed care

Dangerous

Unnecessary treatment

Should prescribe

Patient noncompliant

Language must avoid blame and unsupported clinical conclusions.

12.32 Evidence Drawer

This is likely our strongest design differentiator.

Click:

View evidence

Right-side drawer appears.

Sections:

Why Continua surfaced this

1. Source evidence
2. Search window / absence check
3. Rule used
4. What Continua is NOT claiming

12.33 Evidence Drawer: Source Section

Example:

Referral · Apr 18, 2026
Dr. A. Patel · Primary Care

"Referral to Medical Oncology for
post-surgical adjuvant therapy evaluation.
Please schedule within 45 days."


Highlight exact supporting span.

Under:

✓ Exact source match

12.34 Absence Check Section
Follow-up check

Specialty
Oncology

Window
Apr 18 → Jun 2

Completed qualifying consults found
0


Then:

Search is limited to the available synthetic records.

That's very powerful.

12.35 Rule Section
Rule

An unresolved referral becomes a coordination
gap after its expected follow-up window passes
without a matching completed specialist consult.


No obscure formula.

Maybe:

Detector: followup-v1


under "Technical details".

12.36 "Not Claiming" Section

Small but excellent:

Continua does not diagnose a condition or determine treatment. This issue is surfaced for coordinator verification.

This demonstrates Responsible AI instead of merely mentioning it in README.

12.37 Duplicate-Test Evidence UX

Show both occurrences side by side:

Apr 20                         Apr 28
CBC                            CBC
Metro Lab                     Primary Care

[Source]                       [Source]

              8 days apart


Then:

No explicit scheduled series was found.


Copy:

Review whether the repeat was intended.

Don't write:

Waste detected.

12.38 Monitoring Evidence UX

Display:

Medication start
        ↓
Expected monitoring window
        ↓
Due date
        ↓
No qualifying result found


Again, source/policy distinction visible.

If expectation came from benchmark demo policy:

label it explicitly.

12.39 Priority Explanation

Click workflow-priority badge:

Why P1?

Top verified issue
Oncology follow-up unresolved

Workflow severity
High

Overdue
45 days

Coordinator actionability
Direct

Other verified issues
2

Priority model
priority-v1


Use actual gap numbers.

No:

AI confidence 96%.

12.40 Priority Explanation Visual

Don't create a mysterious gauge.

A simple factor list or compact bars is better.

Example:

Workflow severity     High
Time overdue          45 days
Actionability         Direct
Secondary issues      2


Then:

Deterministic workflow priority. Not a clinical-risk score.

Excellent.

12.41 Coordinator Action

At minimum display:

Verify referral status and coordinate follow-up.

P1 optional button:

Mark reviewed


or:

Mark contacted


If mutable workflow isn't implemented, don't fake a button.

A disabled/fake control is worse than no control.

12.42 Action Completion

If P1 state exists:

Contacted
Reviewed
Acknowledged


Changing action state should visually mark:

Workflow status

and never change benchmark intelligence.

12.43 Impact View

Screen 4.

This is primarily for administrators/judges, not Sarah's daily workflow.

Structure:

What Continua changes

Then clearly separate four categories.

12.44 Measured

Examples from system benchmark:

Held-out Macro F1
Displayed-gap grounding
Hard-negative pass rate
Live processing latency
Cached response latency


Only actual values.

12.45 Modeled

Example:

Potential coordinator time redirected


with formula visible.

Label:

Modeled

Don't place it next to measured F1 without distinction.

12.46 Scenario Assumptions

Example:

Manual chart review baseline:
12 minutes/patient


Label:

Demo scenario assumption

No ambiguity.

12.47 External Research

If used:

Care coordination costs...


separate area:

Industry context

with citations in final submission/docs.

Do not present external statistics as product validation.

12.48 Impact Visuals

At most 2–3.

Possible:

Funnel
80 patients
↓
XX with verified issues
↓
5 prioritized

Before/after workflow
Manual panel scan → prioritized review queue

Benchmark score bars

Maybe.

Avoid chart soup.

12.49 Evaluation View

Screen 5.

This is for the technical judge.

Title:

How we tested Continua

First show:

80 synthetic patients
XXX documents
XXX planted benchmark gaps
Held-out evaluation


using actual values.

12.50 Evaluation Hero

Four headline results:

Gap Macro F1
Hard-negative pass
Grounding rate
Top-5 truth precision


Maximum four.

Then details.

12.51 Per-Type Performance

Simple table:

Detector	Precision	Recall	F1Follow-up	actual	actual	actual
Repeat testing	actual	actual	actual
Monitoring	actual	actual	actual

No decorative radar chart.

Tables are clearer.

12.52 Architecture Comparison

If Phase 9 ran LLM-only baseline:

Show:

Naive
LLM-only
Continua hybrid


Metrics.

Could be very powerful.

But only if results actually support meaningful interpretation.

Don't force a visual if hybrid loses.

Report honestly.

12.53 Evaluation Limitations

Visible:

Synthetic benchmark only.

Not clinically validated.

No real-EHR evaluation.

No patient-outcome claims.

Don't hide this at bottom in 8pt text.

Confidence comes from transparent scope.

12.54 Methodology View

Screen 6.

Purpose:

Answer:

What's actually happening under the hood?

Simple sequence:

Records
   ↓
Structured AI extraction
   ↓
Canonical events
   ↓
Deterministic gap rules
   ↓
Evidence verification
   ↓
Intervention priority


Highlight:

AI extracts facts. Deterministic rules decide gaps.

That's likely the strongest technical sentence in the whole product.

12.55 Methodology Details

Expandable sections:

Extraction

LLM converts messy documents to typed events.

Gap engine

No LLM.

Evidence

Every displayed gap has source-backed evidence.

Priority

Deterministic workflow priority.

Data

Synthetic only.

This screen becomes excellent for Q&A after the demo.

12.56 Don't Build a Chatbot

There is still no reason for one.

A chat input would:

dilute focused workflow
introduce arbitrary AI responses
increase hallucination surface
look like every other hackathon project

Keep Continua opinionated.

12.57 Application Shell

Desktop-first.

Recommended:

Sidebar ~220–240 px
Top context bar
Main content


Avoid huge top nav.

Care-coordination tools are desktop workflows.

12.58 Visual Direction

Continua should look closer to:

polished clinical operations software

than:

AI startup landing page.

Recommended design attributes:

light neutral background
crisp white/tonal surfaces
dark slate text
restrained blue/teal accent
warm amber for workflow attention
red only for actual UI error, not medical severity
generous whitespace
8px-ish spacing system
subtle borders
minimal shadows
12.59 Color Semantics

For workflow priority:

P1

Amber/orange rather than emergency-red.

P2

Blue-violet or darker neutral accent.

P3

Neutral blue/gray.

P4

Light neutral.

Why?

We don't want P1 visually interpreted as:

patient in medical emergency.

12.60 Green Semantics

Reserve green for:

Verified
Complete
Resolved


not:

healthy.

12.61 Typography

Choose one clean system/web-safe font supported by the application stack.

Don't spend time on custom typography loading unless worth it.

Hierarchy:

Page title
Section title
Patient name
Issue title
Body
Metadata
Caption


Consistent.

12.62 Icons

Use established icon library already compatible with the stack if available.

Icons can represent:

referral
lab
medication
imaging
evidence

But every important icon must have text/accessible label.

No custom icon-drawing project.

12.63 Component System

Build reusable:

AppShell
SideNav
SyntheticBanner
PageHeader
MetricCard
QueueCard
PriorityBadge
VerifiedBadge
PatientTable
PatientHeader
Timeline
TimelineEvent
GapCard
EvidenceDrawer
EvidenceSpan
AbsenceCheck
PriorityExplanation
EmptyState
ErrorState
LoadingState


This is enough.

12.64 One Design Token Source

Define tokens for:

spacing
radius
colors
typography
border
surface


Don't scatter arbitrary:

#1d4ed8
#1e40af
#2563eb


through components.

Tailwind theme/CSS variables can centralize it.

12.65 Responsive Strategy

Primary target:

Laptop / desktop


But still remain functional at:

~768px tablet


and down to narrow mobile widths without horizontal page overflow.

On narrow screens:

Timeline
↓
Verified issues


instead of side-by-side.

12.66 Don't Build Mobile-Specific Product

No separate mobile navigation/product.

Scope says desktop-first.

Responsive degradation is enough.

12.67 Loading States

Because cache is fast, loading states may be brief.

Use skeletons:

Loading queue...


not:

AI is thinking...


If live recompute exists separately:

then processing stage labels are valid.

12.68 Empty States

Examples:

No verified issues

No verified continuity issues found for this patient in the available synthetic records.

No search results

No patients match these filters.

Evaluation not run

No completed benchmark run is available.

No fake fallback data.

12.69 Error States

API error:

We couldn't load this patient. Try again.

Methodology/technical details can expose request ID, not stack trace.

Cache-invalid:

The demo snapshot couldn't be validated.

Explicit, useful.

12.70 Accessibility: Semantic Structure

Use:

nav
main
proper headings
buttons for actions
links for navigation
table semantics
dialog semantics for evidence drawer

No clickable div when a button is appropriate.

12.71 Keyboard Navigation

A coordinator should be able to:

Tab through queue
Enter patient
Tab to gaps
Open evidence
Close evidence with Escape


Drawer must trap/manage focus appropriately.

12.72 Screen Reader Labels

Examples:

Bad:

button ">"


Good:

View evidence for oncology follow-up issue


Priority badge:

"P1, Act first workflow priority."

12.73 Contrast

Meet WCAG AA-level contrast where practical.

Especially:

gray metadata
amber priority colors
green verification indicators
focus outlines

Never use pale-gray-on-white because it looks sleek.

12.74 Reduced Motion

Any animations should respect:

prefers-reduced-motion


Do not make demo depend on elaborate animations.

12.75 Motion Strategy

Use only subtle:

drawer slide
hover/focus transition
timeline reveal maybe

No:

glowing AI blobs
animated neural networks
particle backgrounds

Continua's wow is the information, not CSS fireworks.

12.76 Judge Mode

I recommend a subtle optional:

Demo


entry point, not a fake alternate product.

Example:

/demo


It guides:

Today
→ Maria
→ flagship gap
→ evidence
→ impact
→ evaluation


But uses real application screens/components.

12.77 Judge Mode Rules

Must not:

alter ranking
hide inconvenient data
replace metrics
bypass API
inject hidden facts

May:

navigate directly
highlight a target card
preload routes
provide "Next" presentation controls

This improves demo reliability without becoming fake.

12.78 Demo Highlight

When opening Maria through judge mode:

a subtle temporary highlight around the relevant flagged gap is acceptable.

Not:

changing her data.

12.79 Preloading

Judge mode may preload:

queue route
Maria details
Maria timeline
Maria gaps
flagship evidence

to eliminate click latency.

Good presentation engineering.

12.80 UX Performance Targets

Suggested targets:

Cached route → content

<500 ms perceived/typical target.

Evidence drawer

<200 ms after data available.

Navigation

No full page reload.

Layout shift

Minimal.

Largest initial page

Avoid sending all records/patients.

Actual measurements later.

12.81 Browser Targets

At minimum test latest:

Chrome
Edge

Given Microsoft Copilot/Microsoft ecosystem is irrelevant to hackathon judging itself, don't overfocus on a browser-specific experience.

Safari/Firefox basic sanity if time allows.

12.82 Usability Tests

We should test actual comprehension, not "looks nice."

Find 3–5 people unfamiliar with the system if possible.

Give no explanation.

Ask:

Test A

"What does this product do?"

Target answer within ~15 seconds:

Helps coordinators know which patients/issues to review first.

Test B

"Why was this patient prioritized?"

User finds answer in ≤2 interactions.

Test C

"How do you know this issue isn't made up?"

User finds evidence in ≤1 interaction from gap.

Test D

"What should the coordinator do?"

Visible without hunting.

Test E

"Does this mean the patient is clinically high risk?"

Correct UI should discourage that interpretation.

12.83 Judge Comprehension Test

Give a new viewer 30 seconds.

Then ask:

Who uses Continua?
What problem does it solve?
What was found for Maria?
What makes it trustworthy?

If they miss 2+:

design isn't clear enough.

12.84 Demo-Time Test

Navigate:

Today
→ Patient
→ Gap
→ Evidence
→ Impact
→ Evaluation


Must comfortably fit within:

90 seconds


without rushed scrolling.

This is a Phase-12 UX benchmark.

12.85 Click Budget

Golden workflow:

Today
1 click → Patient
1 click → Evidence


Two core clicks.

Impact/evaluation after.

If Maria requires five nested clicks just to see the problem, redesign.

12.86 Visual Regression

Capture screenshots at stable view sizes for:

Today
Patients
Maria workspace
Evidence drawer
Impact
Evaluation
Methodology
error state

Use whatever lightweight approach fits the test stack.

This catches accidental CSS breakage late.

12.87 UX Acceptance Tests

Examples:

UX-001

Global synthetic banner on every application screen.

UX-002

Top-5 list has exactly API-provided order.

UX-003

No numeric score labeled risk.

UX-004

Every gap exposes evidence control.

UX-005

Evidence drawer exact quote corresponds to API.

UX-006

Absence is described as "not found in available records."

UX-007

No treatment-action terminology.

UX-008

Evaluation numbers equal API exactly.

UX-009

Metric classification maintained.

UX-010

No fake AI loading animation.

UX-011

Empty/error states expose no fabricated data.

UX-012

Keyboard can open/close drawer.

UX-013

No horizontal page overflow at 320px.

UX-014

Priority isn't communicated by color alone.

UX-015

Maria rank exactly matches API.

12.88 UX Safety Linter

Extend existing safety script to scan visible product copy for:

risk score
AI diagnosed
needs treatment
unnecessary test
patient failed
clinically validated
Epic connected


Some phrases may appear in methodology disclaimers.

Contextual allowlist where appropriate.

12.89 UI/API Contract Discipline

Do not do:

const priority = gapCount * 20;


in React.

No business calculations.

React renders API results.

If a value is wrong, fix backend/intelligence.

Not the UI.

12.90 Analytics

Not necessary for hackathon.

Do not instrument patient-specific interaction analytics unless needed.

If adding basic usage telemetry, never send synthetic record content unnecessarily.

But honestly:

skip it.

12.91 Product Identity / Naming

Working name Continua is good enough for build.

Do not spend Phase 12 debating 50 names again.

A lightweight logo/wordmark is fine.

No week-long branding sprint.

12.92 Product Copy Freeze

Freeze a small copy system.

Product

Continua

Descriptor

Continuity intelligence for care coordinators

Queue

Review first

Evidence

Verified evidence

Priority

Workflow priority

Action

Coordinator action

Disclaimer

Synthetic demonstration data. No real patient information. For coordinator verification only.

Consistency makes product feel intentional.

12.93 Avoid "AI" Everywhere

We should mention AI in:

methodology
product description
submission

But UI doesn't need:

AI Priority
AI Timeline
AI Evidence
AI Gap


The product should sell the outcome.

Not constantly remind people of implementation.

12.94 Phase 12 Red-Team

Attack as different users.

Care coordinator

"There's too much information."

If true, simplify.

Physician

"You're telling me what treatment to do."

If UI implies that, fix.

CIO

"Where did this claim come from?"

Evidence should answer instantly.

AI researcher

"Is this just an LLM summary?"

Methodology/benchmark must show architecture.

Business judge

"So what?"

Top workflow + impact must answer.

Hackathon judge

"I have watched 20 demos."

First 15 seconds must be immediately legible.

12.95 Visual Failure Modes

Do not ship:

giant gradient backgrounds
glassmorphism everywhere
tiny gray text
20 dashboard cards
pie charts for three numbers
decorative line charts with no decision value
excessive red
unreadable evidence drawers
fake metrics
fake users/photos
overlong animations

Polish means restraint.

12.96 Phase File Structure

Expected:

app/
├── page.tsx
├── patients/
│   ├── page.tsx
│   └── [patientId]/page.tsx
├── impact/page.tsx
├── evaluation/page.tsx
├── methodology/page.tsx
└── demo/page.tsx

components/
├── layout/
│   ├── AppShell.tsx
│   ├── SideNav.tsx
│   └── SyntheticBanner.tsx
├── queue/
│   ├── QueueList.tsx
│   └── QueueCard.tsx
├── patient/
│   ├── PatientHeader.tsx
│   ├── PatientTable.tsx
│   ├── Timeline.tsx
│   └── TimelineEvent.tsx
├── gaps/
│   ├── GapCard.tsx
│   └── GapList.tsx
├── evidence/
│   ├── EvidenceDrawer.tsx
│   ├── EvidenceSpan.tsx
│   ├── AbsenceCheck.tsx
│   └── PolicyEvidence.tsx
├── priority/
│   ├── PriorityBadge.tsx
│   └── PriorityExplanation.tsx
├── evaluation/
│   └── ...
└── shared/
    ├── EmptyState.tsx
    ├── ErrorState.tsx
    └── LoadingState.tsx

tests/ui/
├── today.test.ts
├── patient.test.ts
├── evidence.test.ts
├── evaluation.test.ts
├── accessibility.test.ts
├── responsive.test.ts
├── safety-copy.test.ts
└── demo-flow.test.ts

12.97 Execution Order

Use this order:

12.0 Freeze UX constitution
       ↓
12.1 Freeze information architecture
       ↓
12.2 Define visual tokens
       ↓
12.3 Build application shell
       ↓
12.4 Build synthetic-data banner
       ↓
12.5 Build Today / Top-5 queue
       ↓
12.6 Build Patients view
       ↓
12.7 Build Patient Workspace shell
       ↓
12.8 Build timeline
       ↓
12.9 Build verified-gap cards
       ↓
12.10 Build evidence drawer
       ↓
12.11 Build priority explanation
       ↓
12.12 Implement coordinator actions if P1
       ↓
12.13 Build Impact view
       ↓
12.14 Build Evaluation view
       ↓
12.15 Build Methodology view
       ↓
12.16 Integrate empty/loading/error states
       ↓
12.17 Accessibility pass
       ↓
12.18 Responsive pass
       ↓
12.19 Build judge-mode navigation
       ↓
12.20 Add safe preloading
       ↓
12.21 Usability tests
       ↓
12.22 Judge comprehension test
       ↓
12.23 90-second workflow test
       ↓
12.24 Visual regression
       ↓
12.25 UX red-team
       ↓
12.26 Freeze Coordinator UX v1

12.98 Quantitative Gates
Requirement	GateQueue items matching API order	100%
User-facing unverified gaps	0
Evidence access from each gap	≤1 interaction
Patient access from queue	1 interaction
Clinical-risk terminology	0
Treatment-prescriptive actions	0
Evaluation-metric mismatches	0
Unclassified impact claims	0
Synthetic banner coverage	100% screens
Priority color-only meanings	0
Keyboard-inaccessible P0 actions	0
Known blocking contrast failures	0
Horizontal page overflow at 320px	0
Fake AI loading states	0
Maria rank/UI mismatch	0
Core judge path	<90 sec target
12.99 Acceptance Gates
Gate A: Comprehension

New viewer understands who/what Continua is within seconds.

PASS / FAIL

Gate B: Workflow

Coordinator can move from panel → patient → evidence with minimal interaction.

PASS / FAIL

Gate C: Trust

Every issue has obvious evidence access and precise language.

PASS / FAIL

Gate D: Safety

No UI implies diagnosis, treatment recommendation or clinical-risk prediction.

PASS / FAIL

Gate E: Integrity

UX never recalculates or modifies backend intelligence.

PASS / FAIL

Gate F: Benchmark

Evaluation UI reproduces frozen benchmark values exactly.

PASS / FAIL

Gate G: Claims

Measured/modeled/assumption/research metrics remain distinguishable.

PASS / FAIL

Gate H: Accessibility

Critical workflow is keyboard-accessible and semantically structured.

PASS / FAIL

Gate I: Responsive

Product remains functional on supported widths.

PASS / FAIL

Gate J: Demo

Core narrative comfortably fits the judging window.

PASS / FAIL

All ten must pass.

12.100 Exit Report

At Phase 12 completion:

CONTINUA COORDINATOR UX V1

Primary screens:                  6
Core demo clicks:                 X
Evidence interactions from gap:   1

API data mismatch:                0
Unverified gaps rendered:         0
Clinical-risk labels:             0
Prescriptive clinical actions:    0

Accessibility:
Keyboard critical path:           PASS
Drawer focus management:          PASS
Color-only priority semantics:    0
Known blocking contrast issues:   0

Responsive:
Desktop:                          PASS
Tablet:                           PASS
320px overflow:                   0

Usability:
Participants:                     X
Correct product comprehension:    X/X
Evidence discoverability:         X/X

Judge-flow duration:
— seconds

Maria rank/API match:
PASS

Evaluation values/API match:
PASS

UX safety-copy scan:
PASS


Only actual measured results.

12.101 Phase Failure Conditions

Do not proceed if:

users think workflow priority is clinical risk;
evidence takes several screens to find;
dashboard becomes analytics-first;
Maria is visually promoted above her real queue rank;
methodology dominates the main product;
UI claims "no visit occurred" instead of "not found in available records";
impact assumptions look like measured savings;
benchmark numbers are manually entered;
unsupported action buttons are fake;
the 90-second path requires scrolling through 10 sections;
product looks like generic "AI analytics" rather than a care-coordination workflow.
12.102 Handoff to Phase 13

Once Phase 12 is frozen, Continua becomes a usable product.

Phase 13 then does something different:

Optimize the complete flagship experience specifically for judging without corrupting product truth.

It receives:

frozen API
frozen UI
real queue ordering
real Maria data
verified evidence UX
measured benchmark
impact view
methodology

and builds the polished Oncology Flagship Experience:

Problem
→ Sarah
→ 80 patients
→ Top 5
→ Maria
→ invisible continuity gap becomes visible
→ source evidence
→ next action
→ measured proof


That becomes the unforgettable story.

Phase 12 Definition of Done

Phase 12 is complete when a person who knows nothing about Continua can open it and, without narration:

understand that it helps coordinators prioritize continuity work,
identify the patients/issues to review first,
open a patient,
understand the journey,
see what appears unresolved,
inspect exactly why Continua surfaced it,
understand that a human still verifies the action,
distinguish workflow priority from clinical risk,
see benchmark evidence without confusing it for clinical validation.

When all nine are true:

CONTINUA PHASE 12: COORDINATOR UX v1 FROZEN

Next: Phase 13 — Oncology Flagship Experience, where this product is transformed into the tight, memorable judging sequence that wins attention in the first 15 seconds and earns credibility by the 90th.
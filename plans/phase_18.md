Continua Phase 18: Product Polish & Visual Identity

Phase 17 froze a correct, reliable, fast, demo-hardened release candidate. Phase 18 is finally where we can obsess over how Continua feels.

But this phase has a strict constraint:

We may improve perception, clarity, hierarchy, consistency, and memorability. We may not change intelligence, workflow semantics, benchmark results, rankings, or evidence.

The goal is not to make Continua flashy.

The goal is to make it feel like a product that a healthcare organization could plausibly take seriously.

18.0 Phase Mission

Transform the release candidate into a visually coherent, judge-ready product with:

clear brand identity;
professional healthcare visual language;
excellent information hierarchy;
refined queue;
refined patient journey;
exceptional evidence experience;
consistent interaction patterns;
polished empty/loading/error states;
accessibility preserved;
screenshot-quality layouts;
zero demo-performance regression.

Target reaction:

"This doesn't look like a weekend AI dashboard."

Not:

"Wow, lots of gradients."

18.1 Inputs

Phase 18 consumes frozen:

continua-demo-release-candidate-v1
continua-api-v1
Coordinator UX v1
Oncology Flagship Experience v1
Proof & Impact Experience v1
continua-safety-v1
continua-reliability-v1


plus:

frozen product copy;
actual Maria position;
actual benchmark values;
actual evidence;
supported viewports;
performance budgets.
18.2 Outputs

Phase 18 produces:

Continua Visual System v1

and:

Continua Product Polish v1

including:

brand foundation
color system
typography system
spacing/layout system
elevation/border system
iconography rules
component visual states
refined queue
refined patient workspace
refined timeline
refined gap cards
refined evidence experience
refined evaluation experience
polished responsive layouts
accessibility QA
screenshot system
visual regression suite
final product asset package
18.3 Non-Goals

Phase 18 does not add:

another healthcare workflow;
chatbot;
dark-mode project unless trivial;
another gap detector;
new analytics;
new AI;
new scoring;
new patient scenario;
custom illustration ecosystem;
elaborate 3D graphics;
animation system;
mobile app;
design-system package for hypothetical future teams.

We're polishing this product, not building Figma.

18.4 Phase Map
Subphase	Workstream	Outcome18.0	Visual audit	Existing inconsistencies identified
18.1	Brand principles	Visual personality frozen
18.2	Wordmark	Continua identity
18.3	Color	Semantic palette
18.4	Typography	Hierarchy
18.5	Spacing/grid	Layout rhythm
18.6	Surfaces	Borders/radii/elevation
18.7	Iconography	Consistent symbols
18.8	Navigation	Shell refinement
18.9	Queue	Primary screen polish
18.10	Table	Patient list polish
18.11	Patient header	Identity/context clarity
18.12	Timeline	Journey visualization
18.13	Gap cards	Issue hierarchy
18.14	Evidence	Signature interaction
18.15	Priority	Workflow-priority presentation
18.16	Evaluation	Technical proof visuals
18.17	Impact	Claim-type clarity
18.18	Methodology	Architecture polish
18.19	System states	Loading/error/empty
18.20	Interaction	Hover/focus/motion
18.21	Responsive	Supported viewport polish
18.22	Accessibility	Visual + interaction audit
18.23	Screen-share QA	Judge visibility
18.24	Screenshot package	Submission visuals
18.25	Visual regression	Stability
18.26	Design red-team	Restraint/clarity
18.27	Freeze	Visual System v1
18.5 Brand Personality

Continua should feel:

CALM
TRUSTWORTHY
PRECISE
HUMAN
OPERATIONAL
MODERN


It should not feel:

FUTURISTIC
DIAGNOSTIC
ALARMIST
SCI-FI
CONSUMER WELLNESS
CRYPTO DASHBOARD
GENERIC AI STARTUP


This distinction drives everything else.

18.6 Visual Concept

The brand metaphor is:

Keeping the thread of care intact.

That connects naturally to:

continuity;
longitudinal timelines;
handoffs;
keeping patients from disappearing between providers.

Do not over-literalize it with rope illustrations everywhere.

A subtle continuous-line motif is enough.

18.7 Name

Keep:

Continua

unless a real naming/legal conflict forces a later controlled change.

Functional descriptor:

Continuity intelligence for care coordinators

No more naming sprint during the build.

18.8 Wordmark

Keep it extremely simple.

Recommended:

Continua


with a small continuity mark.

Potential concept:

two or three connected points
joined by one continuous curve


This can reference:

provider → provider → coordinator


without becoming a medical cross cliché.

18.9 Avoid Healthcare Logo Clichés

Do not create:

heart + AI nodes
medical cross + circuit
brain + stethoscope
glowing DNA
robot doctor
shield + heart

They make sophisticated healthcare software look generic.

18.10 Primary Color Strategy

Use a restrained cool palette.

Example starting system:

Primary        Deep teal / blue-teal
Accent         Clear cyan-teal
Background     Warm/cool off-white
Surface        White
Text           Deep slate
Muted          Slate-gray


Why teal?

It can evoke healthcare/trust without falling directly into generic hospital-blue everywhere.

Exact tokens must pass contrast QA before freeze.

18.11 Suggested Token Direction

Illustrative starting point only:

--bg:              #F7F9F9
--surface:         #FFFFFF
--surface-muted:   #F1F5F4

--text:            #152321
--text-secondary:  #52615F
--border:          #D8E1DF

--brand-700:       #125B58
--brand-600:       #16706C
--brand-100:       #DDF1EF

--verified:        #237A57
--attention:       #A86416
--error:           #B42318


These are design candidates, not immutable values.

Test contrast.

18.12 Priority Colors

Workflow priority cannot look like emergency triage.

Recommended:

P1 · Act first

Warm amber.

P2 · High priority

Deep blue/teal.

P3 · Review

Slate-blue.

P4 · Low priority

Neutral gray.

NONE

Muted neutral.

Do not use:

blood-red P1


unless signaling an actual technical error.

18.13 Error Red

Reserve red for:

API failure
invalid cache
destructive UI state
validation problem

Not workflow priority.

That helps preserve the distinction between:

operational priority

and:

clinical emergency.

18.14 Verified Green

Green means:

Evidence verified
Completed
Resolved


Not:

patient healthy


Maintain this semantic discipline.

18.15 Claim Classification Colors

Phase 14 introduced:

MEASURED
MODELED
ASSUMPTION
EXTERNAL
TARGET


Use subtle chips.

For example:

Measured      Teal
Modeled       Violet
Assumption    Amber
External      Blue/gray
Target        Neutral outline


But always include the text label.

Color is secondary.

18.16 Typography

Target:

high-density information that still feels calm.

Use one primary font family.

System UI stack is perfectly acceptable.

Suggested scale:

Display       32–36
H1            28–32
H2            22–24
H3            18–20
Body          15–16
Metadata      13–14
Micro         12 only sparingly


Never make evidence text tiny to fit more content.

18.17 Numeric Typography

For benchmark metrics:

Use tabular numerals if font supports them.

Example:

0.84
91%
5/5


align cleanly.

Do not make every metric a 64px hero number.

18.18 Information Hierarchy

Each product surface gets exactly one dominant question.

Today

Who should I review?

Patient

What happened and what appears unresolved?

Evidence

Why did Continua surface this?

Impact

What could this change operationally?

Evaluation

How well does the system perform?

Methodology

How does it work?

If a screen visually answers two different primary questions, simplify.

18.19 Spacing System

Use consistent tokens.

Example:

4
8
12
16
24
32
48
64


Most component spacing should use:

8 / 12 / 16 / 24


Avoid arbitrary:

17px
23px
29px


unless specific layout demands it.

18.20 Radius

Healthcare operations software should not look like a toy.

Use moderate radii:

6–10px


Cards.

Pills only for badges/chips.

Don't make every panel a 24px bubble.

18.21 Shadows

Minimal.

Prefer:

border + subtle surface distinction


Use stronger shadow primarily for:

evidence drawer;
modal/overlay.

Avoid floating-card overload.

18.22 Grid

Desktop:

12-column conceptual grid
max useful content width
comfortable gutters


Patient Workspace:

roughly:

60–65% Timeline
35–40% Issues


depending on actual content.

Evidence drawer overlays at perhaps:

420–520 px


on large desktop.

Measure.

18.23 Sidebar

Keep compact.

Approx:

220–240px


Elements:

Continua

Today
Patients

Insights
Evaluation
Methodology

────────
Synthetic Demo


Current section unmistakable.

No drawer full of icons without labels.

18.24 Sidebar Brand

Top:

[mark] Continua
Continuity intelligence


Small.

Don't waste 150px vertically on a logo.

18.25 Today Screen Polish

This is our highest-priority visual.

Top structure:

Good morning, Sarah

Review first

80 patients · XX with verified continuity issues


Then queue.

18.26 Remove Dashboard Noise

Don't insert:

4 pie charts
trend chart
line graph
map
revenue graph

above the actual work.

The queue is the hero.

18.27 Queue Card Design

Suggested anatomy:

┌──────────────────────────────────────────────────┐
│ #2    Maria Chen                P1 · Act first   │
│       54 · Breast cancer                         │
│                                                  │
│       Oncology follow-up unresolved              │
│       3 days past expected follow-up window      │
│                                                  │
│       ✓ Verified evidence · 3 issues             │
│                                                  │
│       Verify referral status and coordinate      │
│       follow-up.                       Review →   │
└──────────────────────────────────────────────────┘


Actual priority/rank from release artifact.

18.28 Queue Card Density

A card should be readable at a glance.

Target:

~100–140px height


rather than 250px.

We want five cards to be visually accessible without excessive scrolling at 1440×900 if possible.

18.29 Queue Rank

Rank should be noticeable but not dominant.

Use:

#1
#2
#3


small left rail/token.

Do not turn rank into giant sports-score graphics.

18.30 Priority Badge

Example:

P1  Act first


Badge should expose both code and meaning.

Screen reader:

"P1, Act first workflow priority."

18.31 Verified Badge

Visual:

✓ Verified evidence


This becomes a recurring trust cue.

Use the same component everywhere.

18.32 All-Patients Table

Refine readability.

Headers:

Patient
Primary context
Last record
Verified issues
Priority
Top issue


Use generous row height:

56–64px


Maybe 48 if layout proves readable.

18.33 Table Sorting

Indicate actual sort state clearly.

Default:

Intervention priority


if API supports.

No hidden sorting through row colors.

18.34 Patient Workspace Header

Example:

Maria Chen

54 · F
Breast cancer — post-surgical

Last available record Apr 28

P1 · Act first
3 verified continuity issues


But actual priority label from system.

18.35 Patient Header Safety

Include subtly:

Workflow priority

near badge if ambiguity remains.

Never just:

P1


with no explanation.

18.36 Timeline Polish

The timeline should become Continua's visual signature.

Use:

Date
│
●  Event title
│  Provider · specialty
│  concise factual summary
│  Source
│
● ...


Quiet, precise.

18.37 Timeline Phase Treatment

Instead of giant phase headers, use subtle separators:

SURGERY
RADIOLOGY
FOLLOW-UP


only where they improve scanning.

Remember phase is presentation-derived, not clinical truth.

18.38 Timeline Icons

Possible:

Referral        arrow/share
Lab             flask
Imaging         scan/image
Medication      pill
Consult         clinician/user
Surgery         procedure icon
Follow-up       calendar/check


Text labels remain.

18.39 Gap-in-Timeline Visualization

For missed follow-up:

Highlight the temporal connection:

Apr 18 referral
       │
       │ 45-day expected window
       │
Jun 2 due
       │
       ▼
Jun 5 available-record cutoff


Use a dashed annotation lane.

This must not create a fake event at June 2.

Label:

Expected follow-up window ended

18.40 Verified-Gap Card

Refined hierarchy:

P1 · Act first

Oncology follow-up unresolved

No completed oncology consultation was found
in available records by the expected date.

✓ Verified evidence

Coordinator action
Verify referral status and coordinate follow-up.

View evidence →


No paragraphs.

18.41 Evidence Drawer Is the Signature

Spend disproportionate design time here.

It needs to look better than anything else because it proves the core trust proposition.

Structure:

WHY CONTINUA SURFACED THIS
─────────────────────────

1. SOURCE EVIDENCE

   Referral
   Apr 18, 2026
   Dr A. Patel

   "...exact highlighted quote..."

   ✓ Exact source match


2. FOLLOW-UP CHECK

   Specialty      Oncology
   Window         Apr 18 – Jun 2
   Completed
   consults       0

   Available synthetic records only


3. RULE

   Referral window passed without a
   matching completed specialist consult.


For coordinator verification only.

18.42 Evidence Quote Styling

Make quote visually distinct, but not giant.

Use:

slightly tinted verified surface
left border
exact matched words highlighted gently

Avoid neon highlighter yellow.

18.43 Exact Source Match Presentation

Use:

✓ Exact source match


not:

Confidence 100%


Excellent distinction.

18.44 Fuzzy Match Presentation

If a displayed verified source used fuzzy verification:

Don't show something alarming like:

87% confident


Potential:

✓ Source verified


Technical details:

Method: fuzzy text match


available on expansion.

18.45 Absence Evidence Styling

Different component from source quote.

For example:

RECORD CHECK

Oncology consult
Apr 18 – Jun 2

0 completed matches found

Search limited to available records.


This teaches users that absence evidence is computational rather than quoted.

18.46 Duplicate-Test Comparison

Side-by-side evidence is ideal.

APR 20                         APR 28

CBC                            CBC
Metro Lab                      Primary Care

[exact source]                 [exact source]

──────────── 8 days ─────────────


Below:

No explicit scheduled series was identified in the supporting records.

Then:

Review whether the repeat was intended.

This is much better than an abstract alert.

18.47 Monitoring Visualization

Use a compact timing line:

Medication start
       ↓
Monitoring window
       ↓
Due
       ↓
No qualifying result found


Source and policy separately labeled.

18.48 Evidence Drawer Width

At 1440px:

aim around:

440–520px


This preserves patient context behind it.

At tablet/narrow:

drawer becomes nearly/full width.

Focus management remains from Phase 12.

18.49 Priority Explanation Polish

Do not use circular gauge.

Use a factor breakdown.

WORKFLOW PRIORITY

P1 · Act first

Top issue
Follow-up unresolved

Workflow severity       High
Overdue                  45 days
Coordinator action      Direct

2 additional verified issues


Then:

Deterministic workflow prioritization. Not a clinical-risk score.

18.50 Why No Gauge?

A gauge implies:

precision
continuous risk
calibrated model

We don't have that.

A factor list is more honest and more elegant.

18.51 Evaluation Screen Polish

Structure:

How Continua performs

Frozen held-out synthetic benchmark

[Metric] [Metric] [Metric] [Metric]

Per-detector performance
[table]

Hard negative performance
Trust & grounding

Pipeline funnel

Limitations


Don't lead with architecture.

Lead with results.

18.52 Evaluation Metric Cards

Each card:

0.84
Macro F1

3 supported gap types
Held-out synthetic benchmark


Small classification/context label.

No ambiguous "accuracy."

18.53 Tables Over Charts

For P/R/F1:

table wins.

Judges can read exact numbers.

Use micro horizontal bars only if they add quick comparison without sacrificing values.

18.54 Trust Scorecard

Visual emphasis can be:

VERIFIED OUTPUT

Displayed gaps grounded         100%
Unsupported displayed claims    0
Wrong-patient citations         0


if actual results support that.

Give this section a slight green/teal verified treatment.

18.55 Failure Analysis Styling

Do not hide it in red warning boxes.

Use thoughtful neutral section:

Where Continua still fails

1. ...
2. ...
3. ...


This reads like research maturity, not product defect panic.

18.56 Impact Screen Polish

Visually distinguish:

Measured
Modeled
Assumption
External


Maybe a left rail or badge.

For a modeled time figure:

3.2 h/day
MODELED

Based on:
80 patients
X min manual review
Y min assisted review


not just giant 3.2.

18.57 Methodology Screen

Make the architecture the hero.

Records
  ↓
AI extraction
  ↓
Typed events
  ↓
Deterministic rules
  ↓
Evidence verification
  ↓
Workflow priority


Under:

AI extracts facts. Deterministic rules detect gaps.

This deserves strong visual typography.

18.58 Architecture Colors

Differentiate:

Probabilistic

One subtle color, e.g. violet/blue.

Deterministic

Brand teal.

Human

Warm neutral/amber.

Example:

AI Extraction       violet
Rules/Evidence      teal
Coordinator         amber


Then architecture instantly reads correctly.

18.59 Safety Treatment

Avoid huge legal disclaimer box.

Contextual:

Global

Synthetic demo.

Priority

Workflow, not clinical risk.

Evidence

Available records only.

Methodology

Not clinical validation.

This is much more sophisticated.

18.60 Button Hierarchy

Use only three levels.

Primary

One action per view.

Example:

Review patient

Secondary
View evidence

Tertiary/Text
Technical details


Don't make everything a colored button.

18.61 Interaction States

Every clickable element needs:

default
hover
focus
active
disabled where relevant

Focus must be visually obvious.

No style outline: none without replacement.

18.62 Hover Must Not Carry Critical Meaning

Tooltips can explain.

But a touch/keyboard user should not lose essential information.

18.63 Tooltip Discipline

Tooltips only for:

unfamiliar icons
technical abbreviations

Not for information core to decision-making.

If Sarah needs it, put it in the page.

18.64 Motion

Allowed:

drawer opening
subtle timeline highlight
queue card hover
demo spotlight

Recommended duration:

120–240ms


No long entrance animation.

18.65 Demo Spotlight

Judge mode can briefly emphasize:

top queue
oncology referral
gap card
evidence quote
benchmark metric

Use CSS class for a soft border/background transition.

No pulsing indefinitely.

18.66 Reduced Motion

All spotlight/drawer transitions respect:

prefers-reduced-motion


No loss of meaning.

18.67 Empty States

Polish them without cartoons.

Example:

No verified continuity issues

Continua did not find a verified issue in
the available synthetic records for this patient.


Then:

View timeline


No confetti.

18.68 Error States

Example:

Evidence couldn't be loaded

The verified issue is still available,
but its source detail couldn't be retrieved.

Retry
Request ID: ...


No robot illustration.

18.69 Loading States

Keep shell stable.

Use muted skeletal rows where needed.

Do not write:

AI analyzing.

When data is simply loading from cache.

18.70 Partial Analysis State

If Phase 16 permits display of partial patient state:

visually distinctive neutral warning:

Partial analysis

One or more records could not be processed.
Absence-based issues are suppressed.


Excellent trust behavior.

18.71 Responsive Desktop

At ≥1280px:

Patient workspace split:

Timeline | Issues


At ~1024:

narrow split or collapsible issue pane.

At tablet:

stack.

At mobile:

single column.

18.72 320px Requirement

Must remain functional:

no page-level horizontal scroll
evidence drawer fits
table converts/scolls within contained element or uses cards where necessary
global banner fits
buttons tappable

This is robustness, not primary presentation target.

18.73 Patient Table on Mobile

Don't squeeze six columns into 320px.

Switch to compact rows/cards:

Maria Chen
P1 · Act first
3 verified issues
Top: Oncology follow-up unresolved


Phase 12 set the responsive requirement. Phase 18 makes it polished.

18.74 Evidence Mobile Layout

Full-screen sheet.

Source context readable.

Close button obvious.

Keyboard/focus behavior preserved on desktop.

18.75 Accessibility Visual Audit

Check:

Contrast

All token combinations.

Focus

Every interactive element.

Motion

Reduced-motion.

Text

Zoom to 200%.

Color

Remove color mentally/screenshot grayscale.

Does priority still make sense?

Evidence

Quotation and check status screen-reader understandable.

18.76 Priority Without Color Test

Turn CSS colors off or inspect grayscale.

Still should show:

P1 · Act first


Pass.

18.77 Verified Without Icon Test

Screen reader gets:

Verified evidence.

Not merely:

✓

18.78 Zoom Test

At browser 200%:

Core flow should remain usable.

Not necessarily visually perfect.

But:

no clipped controls
evidence readable
navigation accessible
18.79 Screen-Share Polish

This gets its own gate.

Test actual application over compressed sharing.

Increase if necessary:

evidence quote font
metadata contrast
queue spacing
badge clarity

What looks subtle locally may disappear over Teams/Zoom compression.

18.80 Screenshot Composition

Submission screenshots should not be arbitrary browser captures.

For every canonical screenshot:

correct viewport
no browser chrome if not needed
consistent dataset state
same demo snapshot
no hover artifacts
clear focal point
visible synthetic disclaimer where appropriate
real benchmark values
18.81 Screenshot 1: Product Hero

Today screen.

Must communicate:

Continua
80 patients
Top-5 queue
verified evidence


This may be the Devpost thumbnail.

18.82 Screenshot 2: Patient Journey

Maria workspace.

Show:

timeline
referral lane
verified issue
18.83 Screenshot 3: Evidence

Evidence drawer.

Exact source quote visible.

This should probably be our strongest technical/product image.

18.84 Screenshot 4: Evaluation

Actual benchmark.

Shows technical depth.

18.85 Screenshot 5: Architecture

Methodology.

Useful for README/submission.

18.86 Visual QA Checklist

Every screen:

 alignment
 spacing
 typo
 copy consistency
 badge consistency
 no clipped text
 focus visible
 responsive
 no orphan heading
 no empty awkward region
 no fake data
 no stale metric
 disclaimer present where required
18.87 Content Density Test

If page requires a judge to read more than about:

5–7 distinct text blocks


during the demo step, simplify.

The full product can have detail.

Flagship viewport must stay focused.

18.88 Product Copy Audit

Search for inconsistent terms:

care gap
continuity gap
verified issue
risk
priority
critical
AI
confidence
followup/follow-up


Freeze vocabulary.

Recommended:

User-facing

verified continuity issue

Technical

gap

User priority

workflow priority

Technical priority

intervention priority

18.89 Avoid "Care Gap" Where It Confuses

"Care gap" can mean HEDIS/preventive-care gaps in healthcare.

Our product is broader continuity coordination.

Use:

Continuity issue

in most UI.

Keep GapType technical internally.

This improves product differentiation.

18.90 Visual Regression Suite

Snapshot canonical viewports:

Today 1440×900
Today 1280×720
Patient 1440×900
Evidence open 1440×900
Evaluation 1440×900
Impact 1440×900
Methodology 1440×900
Mobile patient 390×844
Error state
Partial state


Review intentionally.

18.91 Diff Threshold

Don't automatically approve large screenshot diffs.

For release:

Any material diff requires:

expected visual change?
yes → review/accept
no → bug


This protects against last-minute CSS regression.

18.92 Performance Preservation

After polish measure:

JS bundle
CSS
LCP
INP
evidence timing
demo timing

Visual upgrades cannot undo Phase 17.

18.93 Bundle Growth Gate

Target:

No material unexplained growth.

If adding a design library adds 300 KB:

reject it unless value is exceptional.

Use existing Tailwind CSS and components.

18.94 No Remote Asset Dependencies

All critical polish assets local.

logo
icons if available through package
fonts local/system

A pretty product that loses its font/icons on venue Wi-Fi isn't polished.

18.95 Product-Polish Red-Team

Ask:

Does this look like generic AI SaaS?

If yes, remove gradients/glowing AI motifs.

Does this look like a hospital EHR clone?

If yes, simplify and modernize.

Does P1 look like patient danger?

If yes, fix semantics/color.

Is evidence the strongest-looking interaction?

It should be.

Can a judge identify primary action within 2 seconds?

If not, hierarchy wrong.

Are benchmark numbers more visually dramatic than patient workflow?

If yes, product priority is backward.

Does the product rely on perfect screen resolution?

Test alternatives.

18.96 "Delete 20%" Pass

After initial polish:

Try removing 20% of:

labels
borders
cards
colors
icons
helper copy

If comprehension remains:

keep it removed.

Restraint will make Continua look much more professional.

18.97 Design Consistency Metrics

We don't need fake aesthetic scores.

Use concrete gates:

Undefined colors outside token system
Arbitrary radii
Inconsistent priority labels
Inconsistent verified labels
Unapproved typography sizes
Visible accessibility violations
Screenshot regression failures
Performance regressions


Goal:

0 release-blocking inconsistencies

18.98 Files

Expected:

app/
├── globals.css
└── ... polished screens

components/ui/
├── Button.tsx
├── Badge.tsx
├── Card.tsx
├── Drawer.tsx
├── Table.tsx
├── Tooltip.tsx
└── Skeleton.tsx

components/brand/
├── ContinuaMark.tsx
└── ContinuaWordmark.tsx

lib/design/
├── tokens.ts
├── priority.ts
├── claims.ts
└── version.ts

public/
├── continua-mark.svg
└── ... minimal assets

tests/visual/
├── today.spec.ts
├── patient.spec.ts
├── evidence.spec.ts
├── evaluation.spec.ts
├── impact.spec.ts
├── methodology.spec.ts
├── responsive.spec.ts
└── accessibility.spec.ts

docs/design/
├── brand-principles.md
├── visual-system.md
├── color.md
├── typography.md
├── components.md
├── copy-style.md
├── screenshot-guide.md
└── accessibility.md

artifacts/visual/
├── screenshots/
├── visual-regression/
└── visual-audit.json

18.99 Execution Order

Follow this order:

18.0 Verify Phase-17 release candidate
       ↓
18.1 Perform current visual audit
       ↓
18.2 Freeze brand principles
       ↓
18.3 Finalize wordmark/mark
       ↓
18.4 Freeze color tokens
       ↓
18.5 Freeze typography tokens
       ↓
18.6 Freeze spacing/surface tokens
       ↓
18.7 Normalize core UI primitives
       ↓
18.8 Polish AppShell/navigation
       ↓
18.9 Polish Today/queue
       ↓
18.10 Polish All Patients
       ↓
18.11 Polish Patient Workspace
       ↓
18.12 Polish timeline
       ↓
18.13 Polish continuity issue cards
       ↓
18.14 Deep-polish Evidence Drawer
       ↓
18.15 Polish priority explanation
       ↓
18.16 Polish Evaluation
       ↓
18.17 Polish Impact
       ↓
18.18 Polish Methodology
       ↓
18.19 Polish loading/empty/error/partial states
       ↓
18.20 Refine interactions/motion
       ↓
18.21 Responsive refinement
       ↓
18.22 Accessibility visual audit
       ↓
18.23 Screen-share audit
       ↓
18.24 Delete-20-percent simplification pass
       ↓
18.25 Capture canonical screenshots
       ↓
18.26 Run visual regression
       ↓
18.27 Re-run performance budgets
       ↓
18.28 Product polish red-team
       ↓
18.29 Freeze Continua Visual System v1

18.100 Quantitative Gates
Requirement	GateHardcoded unapproved colors	0 target
Inconsistent priority semantics	0
Clinical-risk visual semantics	0
Color-only priority meanings	0
Inconsistent Verified labels	0
Critical accessibility failures	0
Flagship screen-share readability blockers	0
Visual regression unexplained diffs	0
Benchmark value mismatches	0
Maria rank mismatches	0
Fake/presentation-only clinical data	0
Remote critical asset dependencies	0
Phase-17 performance hard regressions	0
Canonical submission screenshots	≥5
Supported P0 viewports	100% functional
18.101 Acceptance Gates
Gate A: Brand

Continua has a distinct, restrained, professional identity.

PASS / FAIL

Gate B: Hierarchy

Every core screen has one immediately obvious primary question/action.

PASS / FAIL

Gate C: Workflow

Visual polish strengthens rather than obscures coordinator workflow.

PASS / FAIL

Gate D: Trust

Evidence is visually the strongest credibility interaction.

PASS / FAIL

Gate E: Responsible priority

Workflow priority cannot reasonably be mistaken for clinical acuity.

PASS / FAIL

Gate F: Proof

Evaluation and impact distinguish measured/modeled/assumed evidence clearly.

PASS / FAIL

Gate G: Accessibility

Visual system preserves keyboard, contrast, zoom, and non-color semantics.

PASS / FAIL

Gate H: Responsiveness

All required viewports remain usable.

PASS / FAIL

Gate I: Submission assets

Canonical screenshots are accurate, polished, and current.

PASS / FAIL

Gate J: Performance

Polish does not break Phase-17 hardening budgets.

PASS / FAIL

All ten must pass.

18.102 Exit Report

Use actual measurements/audits:

CONTINUA PRODUCT POLISH & VISUAL IDENTITY v1

Visual system:
continua-visual-v1

Canonical screens:
6

Core component variants:
XX


DESIGN CONSISTENCY

Unapproved raw colors:              0
Priority-label inconsistencies:     0
Verified-label inconsistencies:     0
Clinical-risk visual semantics:     0


ACCESSIBILITY

Blocking contrast failures:         0
Critical keyboard regressions:      0
Color-only meanings:                0
200% zoom critical failures:        0


RESPONSIVE

1440×900:                         PASS
1280×720:                         PASS
1024×768:                         PASS
390×844:                          PASS
320×568:                          PASS


VISUAL REGRESSION

Canonical snapshots:               XX
Unexpected final diffs:              0


PERFORMANCE

LCP before/after:                  — / —
Bundle before/after:               — / —
Evidence open before/after:        — / —
Demo runtime:                      — sec


ASSETS

Product hero screenshot:          PASS
Patient journey screenshot:       PASS
Evidence screenshot:              PASS
Evaluation screenshot:            PASS
Methodology screenshot:           PASS

Screen-share QA:
PASS

Overall:
PASS / FAIL

18.103 Phase Failure Conditions

Do not freeze if:

polish reintroduces performance issues;
P1 looks like medical emergency severity;
verified evidence becomes visually hidden;
numbers/metrics differ from API;
slides/screenshots contain old Maria ranks;
product starts looking like a generic AI template;
UI now requires more interaction than Phase 12;
tiny text improves aesthetics at the expense of readability;
external fonts/assets create network fragility;
screenshot states have been manually altered from real product state;
design introduces inaccessible color dependencies;
visual clutter overwhelms the core queue.
18.104 Handoff to Phase 19

At Phase 18 exit, the application should now be:

Technically deep
+
Evidence-grounded
+
Safe
+
Fast
+
Reliable
+
Visually memorable


The next risk is no longer product quality.

It is:

Can someone else understand, run, inspect, and evaluate what we've built without us standing next to them?

Phase 19 will therefore package the entire system into evaluator-ready technical documentation.

Next: Phase 19 — Documentation & Reproducibility

That phase will produce:

evaluator README
architecture documentation
installation guide
clean-environment reproduction
data/benchmark cards
API documentation
Responsible-AI documentation
benchmark reproduction instructions
troubleshooting guide
architecture diagrams
repository navigation
judge quick-start

so the repository itself becomes part of the submission quality.

Phase 18 Definition of Done

Phase 18 is complete when we can put Continua in front of someone with no narration and the interface itself communicates:

who needs review, what appears unresolved, why Continua surfaced it, how the evidence supports it, and what the coordinator should verify next.

And when someone takes a screenshot of any flagship screen, it looks intentional enough to use in the submission without redesigning it for marketing.

The signature experience should now be unmistakable:

80 patients → prioritized review queue → patient journey → verified continuity issue → exact evidence → coordinator action.

When visual design reinforces that chain rather than distracting from it:

CONTINUA PHASE 18: VISUAL SYSTEM v1 + PRODUCT POLISH v1 FROZEN

Next: Phase 19 — Documentation & Reproducibility.
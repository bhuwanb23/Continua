Continua Phase 20: Submission Package & Compliance

Phase 19 makes Continua independently understandable and reproducible. Phase 20 makes sure all of that work actually reaches the judges in the correct form.

This phase has a different rule from nearly every earlier phase:

Submission requirements are external truth. We do not guess them.

Because the exact 2026 CodeForDFW/hackathon submission instructions, sponsor requirements, track rules, deadlines, and platform fields can change, the final compliance freeze must be generated from the official rules available at submission time. Until those official requirements are available, we build a complete submission package and maintain the rule-dependent items as explicit open gates rather than inventing requirements.

20.0 Phase Mission

Package Continua into an evaluator-ready submission containing:

Polished Product
+
Public/accessible Demo
+
Evaluator-ready Repository
+
Demo Video
+
Submission Story
+
Architecture/Technical Proof
+
Measured Results
+
Responsible-AI Disclosure
+
Required Team/Credit Information
+
Sponsor/Track Compliance
+
Final Submission Evidence


with:

zero missing mandatory requirements and zero claims inconsistent with the frozen product.

20.1 Phase Inputs

Phase 20 consumes frozen:

Demo Release Candidate
Continua Visual System v1
Continua Documentation Package v1
Reproducibility Package v1
continua-benchmark-v1
continua-safety-v1
continua-reliability-v1
Approved Claim Registry
90-second demo
Canonical screenshots
Fallback video
Architecture diagrams
System card
Dataset card
Benchmark card


No new technical capability should be introduced during submission packaging.

20.2 Outputs

Phase 20 produces:

Continua Submission Package v1

containing:

compliance matrix
official-rules snapshot
final project description
short description
public repository/release
live demo URL
final demo video
canonical screenshots
architecture image
technical description
AI/technology disclosure
Responsible-AI disclosure
evaluation summary
limitations statement
team credits
third-party acknowledgments
licenses
sponsor/track evidence
final submission-form values
submitted-artifact manifest
compliance evidence
submission receipt/snapshot
20.3 Phase Structure
Subphase	Workstream	Outcome20.0	Rule acquisition	Official requirements captured
20.1	Compliance matrix	Every requirement accounted for
20.2	Track selection	Correct judging category
20.3	Sponsor requirements	Technology obligations verified
20.4	Eligibility	Team/project eligibility checked
20.5	Submission story	Core narrative frozen
20.6	Short description	One-line/short copy
20.7	Long description	Full project story
20.8	Technical description	Architecture explained
20.9	Evaluation section	Proof packaged
20.10	Responsible AI	Safety disclosed
20.11	Repository release	Public evaluator artifact
20.12	Demo deployment	Final live URL
20.13	Video	Final submission video
20.14	Screenshots	Visual submission package
20.15	Architecture assets	Technical visuals
20.16	Credits/licensing	Attribution complete
20.17	External claims	Sources reverified
20.18	Form assembly	Exact answers prepared
20.19	Artifact validation	Links/access tested
20.20	Dry-run submission	Form rehearsed
20.21	Compliance red-team	Independent audit
20.22	Final submission	Requirements fulfilled
20.23	Submission evidence	Receipt/snapshot retained
20.24	Freeze	Submission Package v1
20.4 Compliance Matrix Is the Master Artifact

Create:

docs/submission/compliance-matrix.md


Every official requirement becomes one row.

Recommended fields:

ID	Requirement	Source	Mandatory	Artifact	Status	Evidence	OwnerSUB-001	Project title	Official rules	Yes	Form	PASS	screenshot/link	...
SUB-002	Repository	Official rules	Yes	GitHub	PASS	URL	...
SUB-003	Demo video	Official rules	Yes	Video	PASS	URL/file	...

Statuses:

NOT_STARTED
IN_PROGRESS
READY
VERIFIED
SUBMITTED
BLOCKED
NOT_APPLICABLE

20.5 External Rule Authority

Priority hierarchy:

1. Official hackathon rules
2. Official submission platform instructions
3. Official sponsor/track requirements
4. Official organizer announcements
5. Organizer clarification


Not:

Reddit
old hackathon blog
another participant's interpretation
memory from last year


If official sources disagree:

Stop and resolve that specific requirement before final submission.

20.6 Capture Rule Snapshot

Rules can change.

At final compliance freeze record:

retrieved_at
source URL
relevant requirement
deadline/timezone
version/update date if available


Optionally save PDF/screenshot for internal records.

This gives us an audit trail.

20.7 Deadline Handling

Record deadline as:

official date
official time
official timezone
converted Chennai time


Since you're in Chennai, this matters.

Do not submit based purely on mentally converted US timezone.

Have both displayed in the release checklist.

20.8 Internal Deadline

Do not target official cutoff.

Freeze submission package ideally:

At least 6–12 hours before the official cutoff.

Preferred:

24 hours before, if hackathon workflow allows.

Last-minute upload failures are not worth the risk.

20.9 Eligibility Audit

Check official rules for:

participant age restrictions
geography
team-size limit
student/professional rules
pre-existing code restrictions
hackathon-build-period rules
open-source requirements
sponsor technology requirements
prohibited content
intellectual property provisions

Every applicable item becomes compliance row.

20.10 Pre-Existing Work Disclosure

This is particularly important because Continua has extensive planning.

If rules restrict pre-hackathon development:

document honestly:

research/planning
code created during eligible period
pre-existing open-source dependencies


Do not risk disqualification by making ambiguous authorship claims.

20.11 Track Selection

Don't enter every track because possible.

Choose the strongest fit.

Evaluate:

Problem fit
Technology fit
Judging criteria fit
Sponsor requirements
Evidence we actually built
Competitive positioning


Then document why Continua belongs there.

20.12 Sponsor Technology Gate

If a sponsor requires:

use product X

we need executable evidence that product X is genuinely used.

Examples of unacceptable hackathon theater:

logo in architecture
unused SDK in package.json
one fake API call
mentioning sponsor in README


Use should be material and demonstrable.

If Continua doesn't genuinely satisfy a sponsor requirement:

Do not enter that track.

20.13 Submission Thesis

Freeze one sentence:

Continua is an evidence-grounded continuity-intelligence workbench that helps care coordinators prioritize unresolved coordination issues hidden across fragmented patient records.

Everything else should reinforce that.

20.14 Submission Story Framework

Use:

PROBLEM
↓
USER
↓
WHAT CONTINUA DOES
↓
FLAGSHIP EXAMPLE
↓
TECHNICAL DIFFERENCE
↓
TRUST
↓
MEASURED RESULTS
↓
FUTURE PATH


Not:

Tech stack
→ AI
→ more AI
→ problem

20.15 Short Description

Prepare variants based on field-length limits once official form is known.

~160 characters

Continua helps care coordinators find and verify continuity issues hidden across fragmented patient records, then prioritize what to review first.

~300 characters

Continua reconstructs fragmented records into a source-linked patient journey, uses deterministic rules to detect continuity issues, verifies every displayed issue against evidence, and prioritizes coordination work for human review.

Recalculate character counts against actual submission limits before finalizing.

20.16 Long Description

Recommended structure:

Problem

Care coordinators must review fragmented cross-provider information to discover unresolved follow-ups and other coordination issues.

Solution

Continua creates a unified patient journey and prioritized intervention queue.

How it works
AI extraction
→ typed events
→ deterministic gaps
→ evidence verification
→ workflow priority

Trust

Only verified issues reach coordinator.

Evaluation

Actual held-out synthetic benchmark.

Limitations

Synthetic-only prototype.

Future

Controlled real-EHR integration/validation.

20.17 Don't Lead With Oncology

Subtle distinction:

Product

General continuity intelligence.

Demo

Oncology.

Submission wording should make that clear.

Otherwise judges may think:

This is a narrow breast-cancer app.

Better:

The underlying architecture is general; the flagship demo uses oncology because cross-provider continuity is particularly visible there.

20.18 Technical Description

Use architecture we've built:

Synthetic fragmented records
        ↓
Structured LLM extraction
        ↓
ClinicalEvent v1
        ↓
Deterministic gap engines
        ↓
Evidence verification
        ↓
VerifiedGap
        ↓
Deterministic intervention priority
        ↓
Coordinator UX


That's the technical story.

20.19 Technology Stack

List only actual final stack.

Likely:

Next.js
TypeScript
Tailwind CSS
selected LLM API/provider
Vercel
Supabase only if actually retained for a feature

Do not list tools merely used briefly during research/development as product architecture.

20.20 AI Disclosure

Be precise.

AI does

extract structured facts from messy synthetic healthcare documents.

AI does not
decide care gaps
verify evidence
rank patients
diagnose
prescribe

This potentially scores more technical credibility than vaguely saying "AI powered."

20.21 Evaluation Section

Pull only from approved claim registry.

Recommended four headline measurements:

Held-out Macro F1
Hard-negative pass rate
Displayed-gap grounding
Top-5 truth precision


Then note:

synthetic benchmark.

No unapproved number enters submission form.

20.22 Evaluation Wording

Good:

"On continua-eval-v1, our held-out synthetic benchmark, Continua achieved [actual] Macro F1 across the three supported continuity-gap types."

Bad:

"Continua is [X]% accurate in healthcare."

20.23 Responsible-AI Submission Section

Concise:

Continua's model performs structured extraction only. Gap detection, evidence verification, and workflow priority are deterministic. Every displayed issue must pass source-evidence verification, all demo data are synthetic, and the coordinator remains the final decision-maker.

Then:

Prototype only, not clinical validation or medical advice.

20.24 Privacy Wording

Use:

Synthetic demonstration data; no real PHI is used by the MVP.

Do not:

HIPAA compliant.

Unless future evidence/legal/compliance conditions genuinely warrant such a statement, which this hackathon prototype does not.

20.25 Limitations

Submission should contain an explicit limitations statement.

For example:

synthetic benchmark
three supported gap types
no real EHR
not clinically validated
workflow heuristic priority
controlled normalization vocabulary
prospective real-world validation remains future work

Transparency is differentiating.

20.26 Future Path

Keep credible:

FHIR-based ingestion
↓
Retrospective health-system evaluation
↓
Coordinator shadow mode
↓
Human-factor testing
↓
Prospective pilot


Do not claim:

nationwide health information network.

20.27 Repository Release

Final public repository should be based on the same commit as the submitted demo whenever possible.

Tag:

v1.0.0-hackathon


or another clear immutable release tag.

20.28 Release Contents

Must include:

source
README
docs
synthetic dataset
deterministic demo cache where allowed
benchmark results
safety/system card
license if selected
acknowledgments
reproducibility scripts

Must not include:

secrets
private notes
stale drafts
real PHI
judge dossiers
unnecessary internal research files
personal environment configuration
20.29 Git History Security Audit

Before publishing:

search entire repository/history for:

API keys
tokens
personal credentials
private URLs
accidentally committed .env
real patient-like information

Deleting current file is not enough if secret existed in history.

Rotate any exposed key.

20.30 Repository Cleanliness

Root should not contain:

final-final-v2.md
notes.txt
random screenshots
temp.py
debug.json
old-demo/


Use:

docs/
artifacts/


intentionally.

Submission repo is part of judging.

20.31 GitHub About/Description

Prepare:

Evidence-grounded continuity intelligence for care coordinators.

Topics if useful:

healthcare
care-coordination
responsible-ai
nextjs
clinical-nlp


Don't keyword spam.

20.32 Live Demo URL

Final demo URL should:

use production build
open without authentication
not require judge account
load correct snapshot
expose synthetic banner
work incognito

Test from a device/browser not already authenticated.

20.33 Demo URL Stability

Avoid submission URL pointing at a temporary preview deployment likely to disappear.

Use stable production URL.

If custom domain available and trivial:

fine.

Not mandatory.

A stable Vercel URL is sufficient.

20.34 Final Demo Video

The video should not simply be synchronous screen recording with dead time.

Recommended length:

follow official maximum.

If no specific rule limits it, aim ~90–120 seconds.

Primary demo already has a 90-second story.

20.35 Video Story

Use Phase 13:

0–10      Problem
10–23     80 → 5
23–42     Maria
42–61     Gap
61–76     Evidence
76–90     Architecture + benchmark proof


Then optionally a 10–20 second close if format allows.

20.36 Video Requirements

Technical:

1080p preferred
legible text
clean audio
no notification popups
no personal tabs
no unlicensed music risk
no fake UI state
current benchmark
current ranking


Use captions if possible.

20.37 Audio

Clear voice matters more than background music.

Recommended:

quiet room
decent headset/mic
normalize levels
mild noise reduction only
no dramatic music drowning narration

No need for production studio.

20.38 Video Captions

Strongly recommended.

Reasons:

accessibility
judges may watch muted
accents/noisy environment
technical terminology clarity

Review generated captions manually.

Especially:

Continua
oncology
deterministic
grounding

20.39 Video Truth Gate

Before export compare:

queue ranking
Maria status
benchmark metrics
terminology
limitations

against final release.

An old screen recording from Phase 13 can become invalid later.

20.40 Canonical Screenshot Package

Minimum:

Today queue
Patient workspace
Evidence drawer
Evaluation
Methodology

Optional:

Impact

All from final release.

20.41 Screenshot Captions

Example:

Review first: Continua reduces an 80-patient synthetic panel into a ranked queue of verified coordination issues.

Evidence first: Every displayed continuity issue links to the exact supporting record and deterministic absence check.

These are more useful than:

Screenshot 1.

20.42 Thumbnail / Hero Image

If submission platform uses cards:

Create one clean 16:9 or platform-required thumbnail.

Likely strongest:

Today / Top-5 queue

with clear Continua branding.

Don't cram architecture and metrics into thumbnail.

20.43 Architecture Asset

One clean architecture image:

Records
↓
AI Extraction
↓
Typed Events
↓
Deterministic Gaps
↓
Evidence Verification
↓
Workflow Priority


Keep readable at submission-page size.

20.44 Team Credits

Prepare:

Name
Role
Contribution


No inflated titles needed.

Example:

Product & research
Data/benchmark
AI/extraction
Backend
Frontend/UX
Evaluation/demo


If one person did several, say so.

20.45 AI Assistance Disclosure

Check official rules for policies governing AI-assisted development.

If disclosure is required:

state honestly which tooling was used.

Do not hide material use.

Exact wording waits for official requirement.

20.46 Third-Party Assets

Audit:

icons
fonts
libraries
logos
images
external datasets
code snippets
AI models

Everything must be appropriately licensed/used.

Our synthetic data dramatically simplifies dataset rights.

20.47 Sponsor/Brand Usage

Do not put sponsor logos into product or submission unless permitted.

If showing third-party services:

text labels are usually enough.

Respect brand guidelines where relevant.

20.48 External Claim Reverification

Phase 14 registered external sources.

Before final submission:

recheck every external statistic still used.

Reason:

source may have changed
statistic may have been superseded
our interpretation may be too broad

Final submitted statement must match source scope.

20.49 Current Pricing Reverification

If submission references LLM/API pricing:

verify against current official provider pricing on submission day.

Do not reuse stale 2025/early-2026 numbers.

Pricing is time-sensitive.

20.50 Legal/Medical Claims Audit

Search submission text for:

HIPAA
FDA
clinical
diagnose
treat
save
prevent
accurate
guarantee
Epic
FHIR
real-time
hospital


Every match manually reviewed.

20.51 Preferred Wording

Use:

FHIR-based production path

not:

FHIR integrated

unless actually built.

Use:

synthetic benchmark

not:

clinical benchmark.

Use:

coordinator verification

not:

medical recommendation.

20.52 Form Response Source File

Do not write directly into submission website first.

Create:

docs/submission/form-responses.md


Containing exact answers for every field.

Advantages:

review
spellcheck
version control
no browser-loss disaster
easy copy/paste
compliance audit
20.53 Form-Response Structure
Project name:
Continua

Tagline:
...

Short description:
...

Long description:
...

Problem:
...

How we built it:
...

Challenges:
...

Accomplishments:
...

What we learned:
...

What's next:
...

GitHub:
...

Demo:
...

Video:
...


Actual field names match official form once known.

20.54 “Challenges We Ran Into”

Don't write generic:

Healthcare data is complex.

Use actual engineering challenges:

distinguishing copied records from duplicate care
representing absence evidence safely
separating probabilistic extraction from deterministic gap logic
preventing priority from masquerading as clinical risk
freezing an independent benchmark

These show depth.

20.55 “What We Learned”

Possible final themes:

extraction and reasoning should have different trust boundaries
absence claims require completeness/evidence handling
explainability is more useful when tied to exact sources
evaluation needs difficult negatives, not only planted positives

Specific.

20.56 “Accomplishments”

Use actual achievements.

Examples if completed:

frozen 80-patient synthetic benchmark
three deterministic detectors
verified-evidence layer
held-out evaluation
offline deterministic demo
reproducible benchmark

Include only things that pass final gate.

20.57 “What's Next”

Credible roadmap:

1. Real standards-based ingestion
2. Retrospective evaluation with de-identified health-system data
3. Clinical/workflow governance
4. Coordinator shadow-mode pilot
5. Prospective evaluation


No grandiose:

revolutionize global healthcare.

20.58 Submission Links Matrix

Track:

Repository
Demo
Video
Architecture
Documentation


For each test:

public?
incognito?
mobile?
latest?
permission?
correct content?

20.59 Incognito Test

Every submitted URL opened in incognito.

This catches:

private repo
authenticated Vercel deployment
restricted video
private Google Drive link
expired preview link

Mandatory.

20.60 Second-Network Test

If possible test from:

phone hotspot
second device/network

Ensures access isn't limited by local session/DNS/cache.

20.61 Repository Permission Test

Evaluator should not need:

GitHub organization access
invite
SSO
API secret

to inspect repository.

If repository must remain private per rules, validate organizer access specifically.

20.62 Demo Account

Avoid requiring judge credentials.

Synthetic read-only product doesn't need login.

Good.

20.63 Video Permission

If hosted on YouTube:

public/unlisted according to rules.

Ensure embedding works if platform needs it.

If another service required, follow official instructions.

20.64 Submission Dry Run

Before actual submission:

Someone other than primary form-filler uses:

form-responses.md


to simulate filling every field.

Check:

character limits
link fields
upload formats
required dropdowns
track selection
video embedding

This reveals gaps early.

20.65 Character Limits

For every form text field:

record:

limit
actual character count


Aim under limit with margin.

Don't discover a 500-character cap after writing 2,000 characters.

20.66 Markdown/Formatting Test

Submission platforms may support partial Markdown.

Preview final rendering.

Check:

headings
bullet lists
images
links
code

Don't assume GitHub Markdown rendering.

20.67 Submission Browser Reliability

Store final responses locally.

If browser/form crashes:

nothing lost.

Don't compose long answers directly in browser.

20.68 Submission Receipt

After completion retain:

confirmation page screenshot
submitted timestamp
confirmation email where available
submission URL
artifact versions
final form snapshot

This proves exact submission state.

20.69 Post-Submission Mutation Rule

After submission:

Do not change functional deployment dramatically unless rules allow.

If you fix a critical bug:

record:

what
when
why
whether allowed


Ideally final release is frozen before submission.

20.70 Release Manifest

Create:

{
  "submission_version": "continua-submission-v1",
  "git_commit": "...",
  "git_tag": "...",
  "demo_url": "...",
  "video_url": "...",
  "benchmark_run_id": "...",
  "cache_version": "...",
  "docs_version": "...",
  "safety_version": "...",
  "submitted_at": "...",
  "official_deadline": "..."
}


This becomes historical record.

20.71 Submission Artifact Directory
artifacts/submission/
├── submission-manifest.json
├── form-responses.md
├── compliance-matrix.md
├── approved-claims.json
├── screenshots/
├── architecture/
├── video/
├── links.json
├── credits.md
└── submission-receipt/


Keep final artifacts together.

20.72 Compliance Testing Script

Build:

npm run validate:submission


Checks what can be automated:

required artifacts present
repo clean
release tag
claim consistency
screenshot existence
benchmark validity
video file existence/hash
links format
no secrets
no stale terms
no unsupported claims

External URLs may need separate active-link validation where network available.

20.73 Submission Preflight

Before form opens:

Product release PASS
Benchmark PASS
Safety PASS
Reliability PASS
Demo PASS
Docs PASS
Links PASS
Claims PASS
Assets PASS
Compliance matrix PASS


Only then submit.

20.74 Compliance Red-Team

Assign somebody to try to disqualify us.

Questions:

Did we meet all mandatory fields?
Does demo URL actually work?
Is repo accessible?
Are we entering an ineligible track?
Did we use sponsor tech materially?
Are all assets ours/licensed?
Did any code/data violate timeframe rules?
Is our video under required limit?
Do we exaggerate healthcare validation?
Are team details correct?
Is project name consistent?
Are all links final?

This mindset is valuable.

20.75 Submission Claim Red-Team

Attack phrases:

"AI automatically prevents missed care."

Rewrite.

"HIPAA-safe."

Remove.

"Clinically validated."

Remove.

"Integrated with EHRs."

Remove unless actually true.

"14 hours saved."

Rewrite as modeled/experimentally measured according to evidence.

"100% accurate."

Never.

20.76 Product-Version Consistency

The following must refer to same release:

Live demo
Video
README
Screenshots
Form description
Benchmark
Architecture diagram
Submission metrics


No video from an older UI with old score/rank.

20.77 Screenshot-Version Stamp

Internally record metadata:

git_commit
cache_version
captured_at


No need to display on image.

Useful when replacing assets late.

20.78 Video-Version Stamp

Same:

release commit
benchmark run
recording date


Store alongside final file.

20.79 Phase Quantitative Gates
Requirement	GateMissing mandatory submission requirements	0
Unverified rule assumptions	0 before final submit
Broken submitted links	0
Private/inaccessible required artifacts	0
Character-limit violations	0
Unsupported final claims	0
Benchmark-value mismatches	0
Video/release data mismatches	0
Screenshot/release mismatches	0
Stale Maria/rank references	0
Secret/PHI exposure	0
Unattributed third-party assets	0
Ineligible sponsor/track claims	0
Missing synthetic-data disclosure	0
Clinical-validation claims	0
Required team members omitted	0
Incognito access tests	100% pass
Compliance matrix mandatory rows	100% VERIFIED/SUBMITTED
20.80 Acceptance Gates
Gate A: Official compliance

Every applicable official requirement is traced to evidence.

PASS / FAIL

Gate B: Eligibility

Team, project, timeframe and selected tracks comply.

PASS / FAIL

Gate C: Product integrity

Submission describes the product that actually exists.

PASS / FAIL

Gate D: Claim integrity

All quantitative/technical claims match approved evidence.

PASS / FAIL

Gate E: Access

Judges can open repository, demo, video and documentation.

PASS / FAIL

Gate F: Demo assets

Video/screenshots match final release.

PASS / FAIL

Gate G: Technical credibility

Architecture and evaluation are concise but inspectable.

PASS / FAIL

Gate H: Responsible healthcare positioning

Synthetic scope, human oversight and non-clinical-validation status are obvious.

PASS / FAIL

Gate I: Attribution

Licenses, dependencies, assets and team contributions are correctly credited.

PASS / FAIL

Gate J: Submission evidence

We retain confirmation of exactly what was submitted.

PASS / FAIL

All ten must pass.

20.81 Exit Report

Populate from the actual submission process:

CONTINUA SUBMISSION PACKAGE V1

Submission version:
continua-submission-v1

Git commit:
...

Release tag:
...

Official deadline:
...

Submitted:
...


COMPLIANCE

Official requirements:              XX
Mandatory verified:                 XX/XX
Optional completed:                 XX/XX
Blocked:                                0

Eligibility:
PASS

Selected track(s):
...


ARTIFACTS

Repository:                         PASS
Live demo:                          PASS
Video:                              PASS
Screenshots:                        PASS
Architecture:                       PASS
Documentation:                      PASS
Benchmark:                          PASS
System card:                        PASS


ACCESS

Incognito links:                    X/X PASS
Second-network check:               PASS
Demo auth required:                 NO


CLAIMS

Approved quantitative claims:        XX
Mismatches:                            0
Unsupported claims:                    0
Clinical-validation claims:            0
Modelled-as-measured claims:            0


SECURITY / RIGHTS

Secrets exposed:                       0
Real PHI:                              0
Unattributed assets:                    0
License blockers:                       0


SUBMISSION

Dry run:                            PASS
Character limits:                  PASS
Final form review:                 PASS
Confirmation received:             PASS
Submission receipt archived:       PASS

FINAL:
PASS / FAIL

20.82 Failure Conditions

Do not submit if:

any rule is being guessed rather than verified;
judge links require your login;
repository and demo describe different versions;
video contains stale F1/rank;
benchmark values differ from approved claim registry;
a sponsor track requires technology we didn't actually use;
a mandatory upload is missing;
team eligibility is unresolved;
submission says clinically validated;
submission claims real PHI/EHR use;
source/license ownership is unclear;
repository includes secrets;
final video exceeds official restrictions;
required fields remain TBD;
compliance matrix has a mandatory row below VERIFIED.
20.83 Handoff to Phase 21

After Phase 20, the submission itself is complete and compliant.

Now the final competitive variable is human performance:

Can we tell this story calmly, memorably, answer skeptical questions, and recover instantly when challenged?

Phase 21 takes:

final release
final submission
actual measured results
flagship story
judge Q&A
architecture
business model
limitations

and builds:

Phase 21 — Demo, Storytelling & Judge Defense

That phase will cover:

final pitch structure
exact speaker script
speaker roles
timing
live interaction choreography
judge-specific question bank
skeptical technical questions
healthcare objections
competition/market questions
architecture defense
benchmark defense
responsible-AI defense
sponsor questions
hostile Q&A drills
backup answers
final rehearsal scoring

so the project is not merely submitted, but defended like a winning technical product.

Phase 20 Definition of Done

Phase 20 is complete when we know, rather than assume:

Every mandatory rule is satisfied.
Every required artifact is accessible.
Every number comes from an approved source.
Every screenshot/video matches the submitted release.
Every sponsor/track claim is legitimate.
Every healthcare claim stays inside demonstrated evidence.
Every team/rights/licensing requirement is accounted for.
Every evaluator link works without our account.
The form has actually been submitted.
We possess evidence of exactly what was submitted.

Then stamp:

CONTINUA PHASE 20: SUBMISSION PACKAGE v1 — VERIFIED & SUBMITTED

Next: Phase 21 — Demo, Storytelling & Judge Defense.
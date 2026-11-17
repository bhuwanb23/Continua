# Architecture & Product Planning — Stage Index

> Stage status: Research ✅ · Define ✅ · Refine ✅ · Ideation ✅ · **Architecture & Product Planning ✅ (this folder)** · Build ⏳

This folder holds the architecture and product planning outputs that convert the locked problem into a buildable, demoable hackathon project. No code has been written yet.

## Decision Lock (final, from Ideation decision gate)

The Ideation stage left one open strategic decision (Option A / B / C). **Option C is formalized here: Oncology Continuity Workbench.**

| Option | Verdict |
|---|---|
| A — Generic Continuity Workbench | Rejected for hackathon: too broad, weaker demo moment, harder ROI metric. |
| B — Referral Radar (sharp tool) | Absorbed as the *ROI layer* (quantified leakage metric) inside Option C. |
| C — Oncology Continuity Workbench | **LOCKED.** Combines Continuity Workbench architecture + Referral Intelligence's quantified leakage metric + Oncology's emotional depth + the "wow" moment + a brandable name. |

### What "Oncology Continuity Workbench" means (and what it does NOT mean)

- The **architecture is general continuity** (any patient panel, any coordinator). The workbench ingests fragmented cross-provider records, reconstructs a unified timeline, detects the 3 locked gap types, prioritizes patients, and recommends actions with evidence.
- The **demo vertical is oncology / high-risk patients.** The 90-second story uses a cancer-patient journey (surgery → radiology → oncology → labs → follow-ups) because it carries the strongest emotional impact, the strongest AI-depth signal, and the strongest alignment with judge Shreyansh (UTSA CARE AI fellow, AAAI 2026 co-author).
- The **3 gap types are unchanged** (missed specialist follow-up, duplicate testing, medication monitoring gap). Only the *examples* in the demo are oncology-flavored (missed oncology follow-up after imaging, duplicate CBC, missing tumor-marker/monitoring lab).
- This is a **demo scoping decision, not a product narrowing.** The build stays general; the demo is oncology. If a non-healthcare sponsor is assigned, the framework (messy data → ranked intervention queue → measurable impact) transfers; only the domain changes (refine-stage §9).

### What stays locked (unchanged from Refine stage)

- **Primary user:** Care Coordinator. Secondary: Nurse Navigator. Future: Population Health teams.
- **Core problem:** Care coordinators cannot efficiently identify which patients are falling through continuity gaps.
- **Core outcome:** From 80 patients → 5 requiring intervention today, with why + next action.
- **3 gap types only:** missed specialist follow-up · duplicate testing · medication monitoring gap.
- **Demo length:** 90 seconds.
- **Data:** Synthetic / de-identified only (HIPAA-safe).
- **Stack skeleton:** Next.js + Tailwind + Supabase + LLM API + Vercel.

### What is NOT locked (still)

- **Product brand name.** Working name for these docs: **Continua** (short, brandable, evokes continuity). Functional descriptor: "Oncology Continuity Workbench for Care Coordinators." Other candidates still on the table: Catch, Triage, CloseLoop, Lumen, and the descriptive "Continuity Workbench." Final name can change at build/sponsor time (refine-stage §9). All docs here use "Continua" as the working name for consistency.
- **Final tech-stack details** beyond the skeleton — confirmed in `ai-pipeline.md` and `build-plan.md`.
- **Sponsor alignment** — case study not yet released.

## The "Wow" Line (locked, from demo-memorability.md)

> *"Sarah spent 12 minutes on this chart yesterday. She missed this. The system found it in 8 seconds."*

Every scene in the demo storyboard exists to set up this line. The oncology version of the same line:

> *"Sarah reviewed Maria's chart for 12 minutes yesterday. She missed that Maria hadn't seen oncology in 45 days after her imaging. The system found it in 8 seconds."*

## Files in this folder

| File | Deliverable |
|---|---|
| `README.md` | This index + decision lock. |
| `prd.md` | Full Product Requirements Document. |
| `user-journey.md` | End-to-end user journey (current state vs. with Continua). |
| `ux-flow.md` | Screen-by-screen UX flow (9 screens). |
| `mvp-features.md` | MVP feature list (Must / Should / Nice). |
| `ai-pipeline.md` | AI pipeline architecture + data flow. |
| `data-schema.md` | Data model / schema. |
| `evaluation-metrics.md` | Evaluation metrics + technical-depth signal (grounding/eval). |
| `demo-storyboard.md` | 90-second demo storyboard (6 scenes). |
| `build-plan.md` | Hackathon build plan (phases, owners, time budget). |
| `out-of-scope.md` | What NOT to build (scope guardrails). |

## Cross-references

- Problem/evidence: `research/problems/care-continuity.md`
- Define: `research/define/define-stage.md`
- Refine (locked v2): `research/refine/refine-stage.md` (+ competitor-analysis, care-gap-types, care-coordinator-workflow)
- Ideation (validation): `research/ideation/` (red-team, alternative-visions, judge-simulation, demo-memorability, naming-sprint, README)
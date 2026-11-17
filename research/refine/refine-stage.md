# Refine Stage — Locked Output (v2)

> The Define stage determines ~80% of final ranking. Research → Define → **Refine** → Select Problem → Build.
>
> **Status: LOCKED (problem space).** Product name is a *working thesis* only — not a locked brand (per user decision: lock the problem, not the product). See §9 for the explicit "not locked" list.

## 1. The Real Enemy (the bottleneck we are attacking)

```
Care Coordinator
        ↓
   Too Many Patients
        ↓
   Limited Time
        ↓
   Missed Problems
        ↓
   Patient Leakage
        ↓
   Higher Cost
```

The user is **not** paid to summarize charts. The user is paid to close care gaps, improve continuity, prevent leakage, and coordinate treatment. The summary only *enables* that.

The most important finding in all the research:

> *"More patients than time to outreach."* (PMC care-coordinator study)

That is the actual problem. Not summaries. Not timelines. Not records. Not interoperability.

## 2. What Changed from v1 (Care Continuity Pivot)

| | v1 (Define stage) | v2 (this file) |
|---|---|---|
| Level | Patient-level synthesis | **Coordinator-level prioritization** |
| Core question | "What happened to this patient across providers?" | **"Of my 80 patients, which 5 need me TODAY, why, and what should I do?"** |
| Output | Unified timeline + care-gap alerts for one patient | **Ranked patient queue + per-patient evidence + recommended action** |
| Value | Save 12 min of chart reading | **Recover leaked patients + avoid duplicate tests + close monitoring gaps across a whole panel** |
| Demo climax | "8 seconds instead of 12 minutes" | **"Which 5 of 80 patients need me today — and why"** |

v1 is still true and is the engine; v2 is the *product*. The timeline/gap detection from v1 becomes the per-patient evidence layer underneath the coordinator queue.

## 3. Locked Decisions

| Decision | Locked value |
|---|---|
| **Primary user** | ✅ Care Coordinator (in a primary-care or multi-specialty clinic; Nurse Navigator acceptable as variant). NOT physician, NOT hospital, NOT patient. |
| **Core problem** | ✅ Care coordinators cannot efficiently identify which patients are falling through continuity gaps. |
| **Core value** | ✅ Transform fragmented cross-provider records into a prioritized, actionable intervention queue. |
| **Three gaps only** | ✅ (1) Missed specialist follow-up · (2) Duplicate testing · (3) Medication monitoring gap. No more. |
| **Demo length** | ✅ 90 seconds. |
| **Data** | ✅ Synthetic / de-identified only (HIPAA-safe). |

## 4. Product Thesis v2 (working name — not locked)

> **An AI-powered Continuity Workbench that identifies, prioritizes, and explains the patients most at risk of falling through the cracks.**

Working name: **AI Continuity Workbench for Care Coordinators** (a provider-facing system that ingests fragmented cross-provider records, identifies the patients most likely to fall through continuity gaps, explains why, and recommends the next action with evidence).

Why this wording is stronger than "CareGap AI":
- "Workbench" implies a daily tool the coordinator *works in*, not a one-off summary.
- "Identifies, prioritizes, explains" names the three jobs (detection → ranking → evidence) instead of one vague verb.
- "Patients most at risk of falling through the cracks" is the outcome, not the mechanism.

## 5. The Winning Demo (6 scenes, ~90 sec)

| Scene | Beat |
|---|---|
| 1 | Meet Sarah — care coordinator, 80 patients, 3 hours of chart review daily. |
| 2 | Current process: open chart → read notes → read referral → read labs → read med history = 12 min. Still misses things. |
| 3 | Our system: upload records → unified timeline (dates, events, providers, meds). |
| 4 | System identifies: Missed Follow-up · Duplicate CBC · Missing A1c Monitoring — each with citations. |
| 5 | Dashboard prioritizes the High-Risk Patients: 1. John Smith · 2. Sarah Brown · 3. David Lee. |
| 6 | Results: 12 min review → 8 sec synthesis · 1 duplicate test avoided · 1 referral recovered · 1 monitoring gap caught. |

## 6. Measurable Outcomes (ROI story — for Jad)

- Chart review time: **12 min → 8 sec per patient.**
- Care gaps caught per 100 patients reviewed: **+X.**
- Referrals closed / completed: **+X%.**
- Duplicate tests avoided: **$X saved.**
- Panel-level: of 80 patients, surface the **top 5** needing attention today, with the reason and the next action.

## 7. Why Epic Can't Just Add This in Six Months (differentiation)

Epic exchanges *documents*; Abridge documents a *single encounter*. Neither synthesizes *across providers* to surface *what was missed* for the coordinator. We do not compete with data exchange (Epic Care Everywhere / CommonWell / Carequality) or documentation (Abridge / Ambience). We compete on the **cognitive synthesis** that happens (or fails to happen) *after* the data arrives — and on **prioritization across a whole panel**, which no single-encounter scribe or measure-centric VBC copilot does.

Competitor buckets (none is ours): ambient scribes (Abridge, Ambience, Nabla, Suki, Heidi) · VBC copilots (Navina) · data platforms (Innovaccer, Health Catalyst, Arcadia) · patient engagement (Memora/Commure) · inpatient ops (Pieces).

## 8. Scope Guardrails — What We Must NOT Build

❌ Patient portal
❌ Interoperability network / health exchange
❌ EHR replacement
❌ Doctor chatbot
❌ Symptom checker
❌ Appointment scheduler
❌ Multi-hospital system
❌ Multi-tenant SaaS

These will kill the clarity. Single patient view, one provider (coordinator) view, synthetic data, no scheduling, no patient portal, no hospital integration, no multi-tenant. AI is the product (summarization + extraction + gap detection + recommendation + prioritization), not a chatbot.

## 9. What Is NOT Locked (deliberately)

- **Product brand name.** "CareGap AI" and "AI Continuity Workbench" are both working names. The locked asset is the problem space + thesis, not the label. Final name can be chosen at build time / sponsor-alignment time.
- **Final tech stack details beyond the pre-decided skeleton** (Next.js + Tailwind + Supabase + LLM API + Vercel) — to be confirmed at architecture step.
- **Sponsor alignment** — healthcare sponsor case study not yet released (CodeForDFW case studies drop later). If a non-healthcare sponsor is assigned, the *framework* (messy data → ranked intervention queue → measurable impact) transfers; only the domain changes.

## 10. The Three Gaps — Detection Logic (for the build)

1. **Missed specialist follow-up:** extract referral events (date, specialty, reason) → search records for a matching consult note / visit / result within a window → if absent, flag as gap with evidence (referral doc citation) + recommended action (contact patient, schedule) + estimated impact (recovered referral).
2. **Duplicate diagnostic test:** extract lab/imaging orders (normalized test name, date, ordering provider) → group by normalized test → if same test ordered ≥2× within N days by ≥1 provider → flag as duplicate with evidence + estimated cost avoided.
3. **Missed medication monitoring:** extract medication starts (drug, date) + expected monitoring labs (drug → lab mapping, e.g., metformin → A1c/BMP) → check if expected lab ordered within window → if absent, flag as monitoring gap + recommended order.

Every gap cites its source record (evidence grounding — Shreyansh) and states a measurable impact (ROI — Jad).

## 11. Next Move

Architecture & build planning is the next authorized step (no code written yet, per the original research-only constraint). When the user says go:
1. Confirm sponsor case study (healthcare preferred; framework transfers if not).
2. Finalize working product name.
3. Scaffold the project skeleton (Next.js + Tailwind + Supabase + LLM API + Vercel).
4. Build the 90-second demo path first (input → timeline → gaps → prioritized queue → metric), then polish.

## 12. Supporting Research

- `research/refine/competitor-analysis.md` — 12-competitor white-space analysis.
- `research/refine/care-gap-types.md` — top care-gap types + demo selection.
- `research/refine/care-coordinator-workflow.md` — coordinator/navigator/referral-coordinator workflows.
- `research/problems/care-continuity.md` — Continuity of Care evidence base (costs, metrics, gaps).
- `research/define/define-stage.md` — Define-stage framework (rubric, archetypes, v1 pivot). v2 refines §8 of that file.
- `research/judges/*.md` — judge dossiers.
- `research/technologies/tech-landscape.md` — tech landscape.
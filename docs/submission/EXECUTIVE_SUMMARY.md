# Continua: Executive Summary

**Code For DFW 2026** · Repository: https://github.com/bhuwanb23/Continua · Live demo: LIVE_DEMO_URL · Video: VIDEO_URL

---

## 1. Case study

| | |
|---|---|
| **Sponsor case study** | **[SPONSOR NAME]** (healthcare practice / care-coordination team) |
| **Tier** | **[Easy / Medium / Hard]** |
| **Focus area** | Patient follow-up and care continuity across multiple providers |

[SPONSOR NAME]'s care team is responsible for making sure patients complete the next step in their care: the specialist visit after a referral, the lab after a new medication, the follow-up after surgery. Their patients are seen by several providers whose records live in different places, so the team has no single view of whether each hand-off actually happened.

## 2. Problem statement

**The visible symptom** is patients "falling through the cracks": a referral that's never scheduled, a medication whose safety lab is never drawn, a test repeated because the first result sat in another system.

**The underlying problem** isn't missing data. It's that **every individual record is complete, and the failure only exists between records.** A referral note saying *"schedule oncology within 45 days"* isn't wrong. The problem is that no oncology visit exists anywhere afterward. No single system flags that, so a coordinator has to find it by reading every chart by hand.

This creates three business problems:

1. **Coordinator time goes to searching, not acting.** With a panel of patients, most review time is spent rebuilding each patient's story across sources before any action is taken.
2. **The most urgent cases aren't surfaced first.** Charts are reviewed in whatever order they come, not by which missed hand-off is most overdue or most actionable.
3. **Alerts aren't trusted.** Generic reminder tools and AI summaries raise flags without showing *why*. Coordinators re-check every one, or start ignoring them.

A useful solution must therefore **find gaps between records, prove each one, and rank them**, without asking staff to trust a black box.

## 3. Solution: what we built

**Continua** is a working web application that turns a coordinator's patient panel into a short, ranked list of verified continuity issues, each with its supporting evidence.

| Problem | How Continua addresses it |
|---|---|
| Records scattered across providers | **Journey reconstruction:** merges records from primary care, surgery, imaging, labs and medications into one de-duplicated timeline per patient. Every event links back to its source document. |
| Gaps exist *between* records | **Three deterministic gap detectors:** *missed follow-up* (referral window passed, no completed visit), *medication monitoring* (required lab never resulted), *duplicate test* (same test repeated within a short window). |
| Alerts aren't trusted | **Evidence verification:** every displayed gap carries the exact source quote, the source-defined time window, and an explicit search of the patient's records showing zero matches. If evidence can't be verified, **the gap isn't shown.** |
| Urgent cases aren't surfaced first | **Intervention-priority queue:** a transparent score (severity × days overdue × actionability) over verified gaps only. The coordinator opens the app to "Review first: these 5." |
| Findings don't become action | **Plain-language next steps** (e.g. *"Verify referral status and coordinate follow-up"*) plus acknowledged / contacted / reviewed tracking. |

**Key design decision: AI extracts facts, rules make decisions.** A language model can be used to turn messy clinical notes into structured events, but whether a gap *exists* is decided by deterministic, unit-tested rules. The output is therefore reproducible and auditable, and a change to a prompt can never quietly change what counts as a missed follow-up.

**What's in the build:** Next.js 15 + TypeScript web app with a coordinator dashboard, patient timeline, evidence drawer, evaluation page and guided demo; a versioned read-only REST API (11 routes plus an OpenAPI document); 805 automated tests; and a single `npm run validate` quality gate run in CI.

## 4. Results

Evaluated on a frozen benchmark of synthetic patients, scored on a **held-out set of 60 patients and 41 known gaps**, including adversarial "hard negative" cases designed to trigger false alarms.

| Metric | Continua | Naive keyword rules |
|---|---|---|
| Gap-detection macro F1 (3 gap types) | **1.00** | 0.44 |
| Hard-negative pass rate | **29 / 29** | 62% |
| Displayed gaps grounded in a real source | **100%** | n/a |
| Top-5 queue verified and correct | **5 / 5** | n/a |
| Demographic-invariance violations | **0** | n/a |

**Modeled impact (scenario assumption, not measured):** for a coordinator reviewing 20 patients a day, saving 2 minutes per patient (8 → 6 min) on search and triage frees about **40 minutes per day, or roughly 13 hours per month**, for patient outreach.

*Results reflect synthetic data and replayed extraction. They show the detection, verification and ranking logic is correct; they don't measure live-AI accuracy or clinical outcomes.*

## 5. Practical viability: how the practice would adopt it

- **Cost:** about $0 to run. The demo deploys to Vercel's free tier with no database, no API keys and no paid services. Optional AI extraction costs only cents per batch.
- **Skills needed:** a standard Next.js/TypeScript stack. Clear docs and one command (`npm run validate`) to confirm everything still works after a change.
- **Data they already have:** referral notes, lab results and medication lists, the same records staff already read. A CSV / PDF referral import is the next step, so the practice can try it on its own exports; FHIR integration with the EHR comes later.
- **Pilot path:** (1) run on a de-identified export of last quarter's referrals; (2) compare Continua's list with what the team caught by hand; (3) move to real data only with HIPAA-ready hosting and a business associate agreement.
- **Safe by design:** decision support only. It never diagnoses or recommends treatment, and every flag cites its evidence, so staff stay in control.

## 6. Limitations and next steps

Continua is a prototype on **100% synthetic data**. It isn't HIPAA-compliant, isn't clinically validated, and isn't connected to a live EHR. It covers three gap types. Next: CSV/PDF import, saved coordinator actions and team hand-offs, a live-AI extraction benchmark, more gap types (e.g. missed screenings), and a supervised pilot with [SPONSOR NAME]'s team.

## 7. Generative AI disclosure

Generative AI tools were used for brainstorming, coding assistance, debugging and documentation, as allowed by the rules. Full disclosure: [`AI_DISCLOSURE.md`](../../AI_DISCLOSURE.md).

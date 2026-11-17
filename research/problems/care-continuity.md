# Care Continuity Intelligence — Research

> **Context:** This document is the Define-stage research output. It captures the pivot from a "universal healthcare platform" concept to a narrower, demonstrable **Continuity of Care Intelligence** problem, plus the underlying cost/cause/evidence base. It directly answers the research task list in the Define-stage brief.

## 1. The Pivot: Why Not a Universal Healthcare Platform

The first idea (a shared intelligence layer connecting patients, providers, records, referrals, scheduling, emergencies) is essentially a re-implementation of a 10-year industry problem:
- Epic Care Everywhere / CommonWell / Carequality / Oracle Cerner interoperability
- Patient consent exchange, longitudinal record platforms

**Why it loses hackathons:**
- The architecture becomes a 12-step flow (Patient → Consent → Identity Matching → Hospital A → Hospital B → Provider Access → Medical History → Emergency Access → Referral Management → Scheduling → Decision Support → AI Layer).
- After one week, judges ask *"What exactly did you solve?"* — ambitious scope answers nothing.
- Demo becomes unfocused ("AI healthcare ecosystem connecting patients, hospitals, providers, records...").

**The real underlying problem is "Care Continuity":** a patient's journey is fragmented across providers. That is the bottleneck worth solving. The sharper statement:

> *"Providers lack a concise, trusted, actionable view of a patient's cross-provider treatment journey, causing delays, duplicated work, fragmented decisions, and poorer outcomes."*

**Why this is better:** specific pain (fragmented history), clear AI role (summarization, timeline generation, care-gap detection, risk identification, action recommendations), and alignment with all three judges (Jad = healthcare ops; Shreyansh = medical NLP; Sanjay = clean UX).

**Danger:** adding scheduling + referrals + records + hospitals + emergency + documents + analytics + patient portal → "Demo Hell." Keep the scope to: **inputs (records/visits/labs/referrals) → AI (timeline + care-gap + risk) → outputs (summary/recommendations/alerts)**.

## 2. Cost of Fragmented Patient Records

| Metric | Figure | Source |
|---|---|---|
| Annual waste from duplicate lab/imaging tests | ~$43B | PMC (2014–2018 study) |
| Annual cost of duplicate healthcare services | ≥$200B | Chief Healthcare Executive |
| Annual waste from administrative complexity (fragmentation-driven) | ~$265B (largest single waste category, JAMA 2019) | blueBriX |
| Total US healthcare waste/inefficiency/fragmentation | ~$3.5T annually (25–30% of $4.8T spending) | SuperTruth (Gartner/AHIP/NAM/Shilling) |
| Duplicate medical records per typical hospital | ~10% duplication rate | AHIMA |
| Duplicate records in hospitals without effective EMPI | up to 18–22% of records | Black Book / Texas hospital study |
| Cost per duplicate record | ~$96–$1,950 | HFMA / Black Book |
| Denied claims from inaccurate patient info (dupes) | ~33–35% | Black Book / 2021 study (1,500 health IT managers) |
| Malpractice cost from duplication annually | ~$1.7B | LeadSquared |
| Extra cost per high-fragmentation patient | ~$4,542/year | AJMC (patients with high-fragmentation providers) |
| High-fragmentation prevalence | 57.9% of US adults | 2025 population analysis (21,876 adults) |
| Duplicate records negatively impacting clinical care | 12–4% delay ED/surgical treatment or cause duplicate tests | Sage Growth Partners |
| Duplicate records increasing costs per patient | ~$1,100/patient | Sage Growth Partners |
| Bad health data waste overall | ~$3.5T | SuperTruth |

**Key takeaway for judges:** fragmentation is not a "nice-to-have" problem — it is the single largest cost driver in US healthcare, with quantifiable, per-patient, per-encounter numbers we can anchor a demo to.

## 3. Cost of Missed Specialist Follow-Ups / Discontinuity

| Metric | Figure | Source |
|---|---|---|
| Annual waste from failures of care coordination | $27B–$78B | Cigna Group |
| Annual cost of avoidable complications & readmissions from poor care transitions | $25B–$45B | Cigna Group |
| Referral loop failures (revenue loss) | ~$0.87M/year for a 400-bed system | Segeta/Innovaccer |
| Fragmented workflows (revenue loss) | ~$1.2M/year for a 400-bed system | Segeta/Innovaccer |
| Daily contribution margin lost to patient leakage (40-clinic specialty network) | ~$50K/day (~$1.5M/month) | Segeta |
| Daily cost of missed visits + lapsed follow-ups (40-clinic network) | ~$180K/day | Segeta |
| Specialist no-show rate | 8–14% (median 11%) | MGMA 2024 |
| Revenue per missed specialist slot | $280–$900 (avg ~$420) | MGMA / CMS fee schedule |
| Cardiology no-show | 11% rate, ~$315 loss/slot | NoShowCost.com |
| Surgery no-show | 8% rate, ~$700 loss/slot | NoShowCost.com |
| Higher PCP continuity → lower costs, fewer hospitalizations & ED visits | Consistent across 1–5 year lookback | JABFM 2026 |
| Higher-fragmentation care → +9.1% vs 7.1% preventable hospitalization | — | AJMC |

**Key takeaway for judges:** "missed follow-up" is a clean, countable, dollar-valued bottleneck — perfect for a 60-second demo with a before/after metric.

## 4. Causes of Treatment Discontinuity

From the research, discontinuity is driven by (in order of frequency):

1. **Information not following the patient** — tests repeated, medication changes uncommunicated, follow-up falls through cracks.
2. **Referral loop failures** — 56% of providers still send referrals by fax, 45% hand paper to patients, 26% give verbal instructions (Phreesia). Only 45% cite post-visit follow-up communication as a reason to choose a specialist.
3. **Provider (dis)continuity** — patients losing/changing providers → foregone care, delayed care, worse access (MEPS study, 10,714 adults).
4. **EMR usability** — information present but not easy to use; physicians spend ~86 minutes/day beyond expected searching for patient data (CMAJ, Canadian study).
5. **Vendor fragmentation** — Epic vs Cerner vs others; even same-vendor data is fragmented across instances; behavioral health, public health, rural/independent providers lag adoption.
6. **Patient burden** — patients left to coordinate their own care across doctors, pharmacies, benefits, support services (Cigna).
7. **Emergency-access failures** — see §6.

## 5. Continuity-of-Care Metrics Used by Hospitals

The academic/operational canon (useful for framing "what we improve"):

- **COCI (Continuity of Care Index)** — Bice-Boxerman: number of providers and % of care by each; 0 → all different providers, 1 → all same provider.
- **UPC (Usual Provider Continuity)** — % of visits to the most-seen provider.
- **MMCI / MCI** — Modified Continuity Index variants.
- **HHI (Herfindahl-Hirschman)** — concentration of visits across providers.
- **SECON (Sequential Continuity)** — consecutive visits to same provider.
- **Care Density** — patient-sharing between providers.
- **BB-COC (Bice-Boxerman COC)** — consistently differentiates PCPs across 1–5 year lookback; associated with lower costs, fewer hospitalizations and ED visits (JABFM 2026).
- **Three dimensions (Haggerty model):** relational (ongoing patient–provider relationship), informational (information follows patient), managerial (coherent care plan across providers).
- **Patient-reported measures:** NHHSUQ-derived 13-item scale (care site, provider duration, instrumental/affective).

**Hackathon framing:** we don't need to compute all of these — but citing that "higher continuity → lower cost/hospitalization" gives the AI output (care-gap alerts, timeline) a measurable outcome to point at.

## 6. Existing Solutions & Why They Still Fail

### Epic Care Everywhere
- Exchanges ~30M patient records/day; ~half of exchanges cross-vendor.
- **Strengths:** reach, volume, same-EHR fidelity.
- **Weaknesses (physician-reported):**
  - Matching fails silently — demographic mismatches return nothing; clinician may never know (Folio3 guide).
  - C-CDA / PDF summaries, not discrete data — medications/problems buried in PDFs don't flow into structured decision support; manual reconciliation required.
  - In a 30-patient CHIME study: HIE-only retrieval sufficient in only **20%** of cases; **~50%** had no meaningful digital data; 13% technically available but not clinically useful (fragmented/incomplete/extra review burden). Only 20% sufficient; 17% partial.
  - Care Everywhere opt-out is per-provider (Markup investigation) — consent/governance gaps.

### CommonWell Health Alliance
- Centralized record-location service (RLS) based on ADT (encounter) data; "deeper than broad."
- **Gaps:** Epic/GE/NextGen not members originally (broad-coverage gap); fee-based subscription; record location depends on encounter data quality.

### Carequality
- Federated framework + trust agreement; no central data repository.
- **Gaps:** no central repository → endpoint downtime = no retrieval; demographic matching errors miss records; C-CDA documents contain duplicated notes requiring clinician sorting; governance debates on third-party (non-treatment) access.

### Oracle Cerner Exchange
- Cerner Millennium-based exchange; same-vendor fidelity, weaker cross-vendor.

### Common thread of failure (SuperTruth, CHIME, JAMA, PMC)
1. **Transport ≠ trust.** Connectivity solved; data quality, provenance, consent, and usability are not.
2. **Documents, not data.** C-CDA/PDFs arrive; they aren't discrete, structured, or reconciled.
3. **Matching is fragile.** Demographic matching (no national patient ID) → silent misses.
4. **Clinician burden.** 64% still scan/manually enter (Hawaii HIE survey); physicians spend 86 min/day hunting data; "people just stop looking" (hospital rep).
5. **No synthesis.** Exchanged data is raw; nothing tells the clinician "what happened, what was missed, what's next."
6. **Low utilization.** CE used in only ~1.46% of ED encounters (PMC 2016); even where data exists, clinicians underuse it.
7. **Uneven adoption.** Behavioral health, public health, rural/independent providers lag; information blocking persists (CRS 2026).

**The white space:** existing tools exchange *documents*; nobody delivers a *concise, trusted, actionable patient journey* with care-gap detection. That is the hackathon opportunity.

## 7. What Physicians Say Is Still Missing

- **32% of PCPs** report frequently missing the patient's entire record (JAMA Network Open 2024).
- **<15%** of family physicians report "ideal interoperability" (obtain + find + reconcile external data in EHR) in 2024 (JAMA 2025).
- **85%** of ED physicians say external data is difficult/very difficult to obtain; takes **avg 66 minutes**; attempts fail **half the time**; 56% attempt external data retrieval **<10% of the time** (PMC ED physician survey, n=216).
- **64%** of providers still scan or manually enter data despite interoperable EHRs (Hawaii HIE 2023).
- **42–50%** of every practice phenotype report commonly encountering external records with a large volume of low-value information (PMC 2025).
- **27/40 (68%)** of hospitals cite difficulty locating provider contact info and finding relevant patient health information as top barriers (SC HIE study).
- **58%** cite patient-matching difficulty; **65%** cite cross-vendor platform adaptation.
- **86 minutes/day** physicians spend beyond expected looking for necessary patient data (CMAJ).
- **Cardiologists** estimate MAs/staff still chase records not on the exchange in 50–60% of cases despite Care Everywhere (CHIME).

**Physician wish list (from interviews/surveys):** Google-like search across the record; a repository with all data in one place; consistent stylistic presentation; discrete (not PDF) data; alerts/notifications for follow-up; care-gap surfacing; reduced click burden.

## 8. Emergency-Care Data Access Failures

- ED physicians: 63% say >1/4 of their patients would benefit from external info; 39% say >half would benefit — yet 85% find it difficult/very difficult to obtain; avg 66 min; 72% fail half the time; 56% attempt <10% of the time (PMC).
- CE used in only ~1.46% of ED encounters (PMC 2016 study); still avoided 560 duplicate diagnostic procedures + identified 28 drug-seeking cases over 6 months in that small usage.
- ED clinicians struggle to access current vital signs, point-of-care tests, and compare current vs previous ECGs (PMC ED dashboard study).
- Cross-institutional referral-loop closure: consultants can't find patient records; insufficient time to review before appointment (PMC 2024).
- Emergency referrals: 90.4% of ED physicians report referral difficulty; 82.7% report consultants asking for more tests before seeing patient; 76% cite endorsement-time refusal; difficulties peak on nights/weekends (PMC 2025).

## 9. Implications for the Hackathon Problem

### Does the data support "Continuity of Care Intelligence" over "Healthcare Scheduling"?
**Yes — and it's stronger, more unique, and still demoable in 90 seconds.**

| Criterion | Healthcare Scheduling (no-shows) | Continuity of Care Intelligence |
|---|---|---|
| Pain is expensive | $280–$900/slot, 8–14% rate | $43B duplicate tests, $27–78B coordination waste, $4,542/patient |
| Pain is measurable | no-show rate, recovered slots | duplicate-test count, care-gap count, time-to-summary |
| Demo in 60s | schedule → predict → fill | paste records → timeline → care-gap alert |
| AI has meaningful role | prediction | summarization + timeline + care-gap detection + risk + recommendation |
| Business could use tomorrow | yes (clinic) | yes (provider-facing summary tool) |
| Differentiation | common (many teams build schedulers) | rare — "Patient Journey Intelligence" |
| Judge alignment (Shreyansh) | moderate (tabular ML) | strong (medical NLP, summarization) |
| Judge alignment (Jad) | strong (ROI) | strong (ops + outcomes) |
| Judge alignment (Sanjay) | strong (clean UI) | strong (timeline UI) |

### Recommended scoped demo (90 seconds)
1. **Input:** paste/upload 3–5 messy cross-provider records (visit notes, labs, referral, imaging report) for one synthetic patient.
2. **AI:** generate a unified care timeline (dates, events, providers, meds).
3. **AI:** surface care gaps (e.g., "No cardiology follow-up in 120 days"; "Duplicate CBC ordered 3× in 30 days"; "Medication started 2/8, no follow-up labs").
4. **Output:** recommended actions + a 1-page provider summary + estimated savings (e.g., "1 duplicate test avoided = $X").
5. **Metric:** before/after — "clinician reads 5 records in 12 min → 1 summary in 8 seconds; 1 duplicate test avoided."

### Scope guardrails (to avoid Demo Hell)
- One patient journey, one provider view. No scheduling, no patient portal, no hospital integration, no emergency dispatch, no multi-tenant.
- Synthetic/de-identified data only (HIPAA-safe, no real PHI).
- AI is the product, not a chatbot: summarization + extraction + gap detection + recommendation.
- Demo shows before/after metric on screen.

### Risk to watch
- **Data quality caveat:** real exchanged data is messy (C-CDA/PDF, duplicates, missing). Lean into this — the demo's *input* being messy is the point; the AI cleaning it is the value. Use synthetic but realistic messy inputs.
- **"Is this just a summary tool?"** → No: it's a decision-support system that converts messy cross-provider information into actionable recommendations with measurable financial impact (the north-star thesis). The summary is the *delivery mechanism*; care-gap detection + recommendation is the *value*.

## 10. Sources

- PMC 9277638 — duplicate test duplication & EHR certification ($43B)
- LeadSquared — duplicate patient records ($1,950/record, 10% rate, $1.7B malpractice)
- Chief Healthcare Executive — $200B duplicate services
- blueBriX — $4,542/patient fragmentation cost, 57.9% prevalence
- Sage Growth Partners whitepaper — 20% duplicate records, $1,100/patient
- SuperTruth (2026) — $3.5T bad health data
- HFMA / Black Book — $96/duplicate, 18–22% rates, $1.95K/inpatient stay
- Cigna Group (2026) — $27–78B coordination waste, $25–45B readmissions
- Segeta/Innovaccer — patient leakage revenue figures
- NoShowCost.com / MGMA 2024 — specialist no-show rates & revenue
- JABFM 2026 — PCP continuity → lower costs/hospitalizations
- AJMC — high-fragmentation patients $4,542 higher spending
- PMC 10464216 — continuity metrics framework (relational/informational/managerial)
- Springer 2026 — continuity-of-care measures (COCI, UPC, MCI, MMCI, HHI, SECON, Care Density)
- PMC 4081743 — Care Everywhere ED study (1.46% usage, 560 dup tests avoided)
- SuperTruth (CommonWell/Carequality trust gap)
- Folio3 — Epic Care Everywhere guide (matching, C-CDA/PDF limits)
- CASRAI — Carequality limits (no central repo, demographic matching, reconciliation burden)
- CHIME HIE study — HIE sufficient in 20% of cases; ~50% no meaningful data
- JAMA Network Open 2024/2025 — 32% missing entire record; <15% ideal interoperability
- PMC ED physician survey (n=216) — 85% difficult, 66 min, 50% fail rate
- Hawaii HIE 2023 survey — 64% still scan/manually enter
- PMC (SC HIE study) — 68% difficulty finding info/contact, 58% matching difficulty
- CMAJ 2025 — 86 min/day physicians searching for data
- PMC 2025 referral study — 90.4% ED physicians report referral difficulty
- Phreesia — 56% fax, 45% paper, 26% verbal referrals
- PMC 2024 cross-institutional referral loop study
- CRS R49436 (2026) — interoperability barriers (uneven adoption, information blocking, TEFCA)
- AMA — CommonWell/Carequality coverage (90% acute EHR market)
- Epic interoperability page — 30M records/day

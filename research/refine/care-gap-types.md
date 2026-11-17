# Care-Gap Types (Refine Stage, Task 2)

> Goal: turn "care gap" from a buzzword into concrete, detectable, demoable gap types. Decide which are most common, easiest to detect from messy records, and easiest to demo in 90 seconds.

## 1. What a "Care Gap" Is

A care gap = the difference between care clinical guidelines recommend and care the patient actually received and had documented. NACHC groups root causes into 3 buckets:

1. **Data gaps** — services happened elsewhere (e.g., colonoscopy at outside OB/GYN) but never made it into the structured EHR field, so care *appears* missing.
2. **Service delivery gaps** — workflow/training/staffing issues (no standardized chart review before visit).
3. **Service engagement gaps** — patient-side barriers (transportation, language, unaware a screening is due).

Care gaps cluster into **5 recognizable categories** (Vital Interaction, ChartSpan, DeepCura):
1. Preventive screening gaps
2. Chronic disease management gaps
3. Medication adherence/treatment gaps
4. Follow-up & transition-of-care gaps
5. Immunization gaps

## 2. Top Care-Gap Types — Ranked for Our Use

Scoring: **Commonness** (how often it occurs), **Detectability** (can we detect it from messy cross-provider records with an LLM?), **Demoability** (can we show it clearly in 90 seconds?), **Judge impact** (does it land with Sanjay/Shreyansh/Jad?).

| # | Care-gap type | Category | Commonness | Detectability | Demoability | Judge impact | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Missed specialist follow-up** (referral sent, no consult note returned) | Follow-up/transition | Very high | High — referral + absence of consult note across records | Very high — "referral on 2/8, no follow-up found" | High (Jad: leakage; Shreyansh: NLP) | Clean before/after metric; ties to $0.87M/yr leakage |
| 2 | **Duplicate diagnostic test** (same lab/imaging ordered 2+ times within window) | Treatment/transition | High | Very high — identical test names + dates | Very high — "CBC ordered 3× in 30 days" | High (Jad: $ saved; Shreyansh: extraction) | $43B/yr problem; clearest dollar ROI |
| 3 | **Missed medication monitoring** (med started, no follow-up labs) | Chronic mgmt | High | High — med + absence of expected lab | High — "metformin started 2/8, no A1c since" | High (Jad: outcomes; Shreyansh: reasoning) | Clinically meaningful; ties to chronic disease |
| 4 | **Missed screening** (overdue mammogram/colonoscopy/A1c/BP) | Preventive | Very high | Medium — needs age/sex/eligibility + dates | Medium — requires guideline knowledge | Medium (more HEDIS-like, Navina's turf) | Risk: looks like Navina's measure-centric product |
| 5 | **Missed referral completion** (referral placed, never scheduled/completed) | Follow-up/transition | High | High — referral order + no completion evidence | High — "referral to cardiology, no appointment found" | High | 35% of referral scheduling attempts result in completed appt (MGMA) |
| 6 | **Abnormal result with no repeat/management** | Follow-up/transition | Medium-high | High — abnormal value + no follow-up action | High — "elevated A1c 9.2 on 1/15, no repeat or med change" | High | Clinically compelling; strong "what was missed" story |
| 7 | **Treatment interruption** (med discontinued without documented reason) | Medication | Medium | Medium — needs med list timeline | Medium | Medium | Harder to detect reliably from messy records |
| 8 | **Missed immunization** | Preventive | Medium | Medium — needs age/vaccine history | Low | Low | Less clinically dramatic; Navina territory |
| 9 | **Duplicate imaging** (same imaging study repeated) | Treatment | Medium | Very high | High | Medium | Subset of #2; good secondary example |
| 10 | **Missed chronic disease monitoring** (diabetes w/o A1c, HTN w/o BP) | Chronic mgmt | High | Medium-high | Medium | Medium | Overlaps with HEDIS/Navina; be careful |

## 3. Recommended Primary Demo Gaps

Pick **3 gap types** for the 90-second demo that are: (a) detectable from messy records, (b) visually obvious, (c) clearly tied to a dollar/clinical outcome. Recommended set:

1. **Missed specialist follow-up** — "Cardiology referral on Feb 8; no cardiology consult note or follow-up found in 120 days." → Recommended action: contact patient, schedule follow-up. → Tie to patient leakage ($0.87M/yr referral loop failures).
2. **Duplicate diagnostic test** — "CBC ordered 3 times in 30 days across 2 providers." → Recommended action: cancel redundant order, notify ordering providers. → Tie to $43B/yr duplicate tests.
3. **Missed medication monitoring** — "Metformin started 2/8; no A1c or renal function labs since." → Recommended action: order A1c + BMP. → Tie to chronic disease management / prevented emergency.

**Why these three:** they span 3 distinct clinical failure modes (follow-up, duplication, monitoring), are all detectable from messy records, each has a clear "before → after" metric, and together they tell a coherent "what was missed" story. They avoid the HEDIS/preventive-screening territory where Navina dominates (reducing "reinventing a startup" risk).

## 4. Gaps to Avoid in the Demo
- **Preventive screening gaps (mammogram/colonoscopy overdue)** — too HEDIS/Navina-like; invites "Navina already does this."
- **Immunization gaps** — low drama, low differentiation.
- **Treatment interruption** — hard to detect reliably; risks demo failure.
- **Generic "medication reconciliation"** — Ambience already claims "reconciles conflicting med lists."

## 5. Demo-Friendly Gap Detection Logic (for the build)
For each gap type, the AI pipeline:
- **Missed follow-up:** extract referral events (date, specialty, reason) → search records for matching consult note / visit / result in a time window → if absent, flag as gap with evidence (referral doc citation) + recommended action + estimated impact.
- **Duplicate test:** extract lab/imaging orders (test name normalized, date, ordering provider) → group by normalized test → if same test ordered ≥2× within N days by ≥1 provider → flag as duplicate with evidence + estimated cost avoided.
- **Missed medication monitoring:** extract medication starts (drug, date) + expected monitoring labs (drug → lab mapping, e.g., metformin → A1c/BMP) → check if expected lab ordered within window → if absent, flag as monitoring gap + recommended order.

**Key design principle:** every gap must cite its source record (evidence grounding — Shreyansh's preference) and state a measurable impact (Jad's preference). This turns "summary" into "decision support."

## 6. Sources
- DeepCura — 4 types of care gaps (preventive, chronic, medication, follow-up/transition) with coded examples
- ChartSpan — gaps in care examples
- Vital Interaction — 5 categories of care gaps
- NACHC — 3 root-cause categories (data/service delivery/engagement)
- Emitrr — preventive/chronic/medication gap examples
- LegalClarity — common care-gap types (screenings, chronic monitoring, medication adherence, follow-up/transition)
- CareMesh — care gaps show up across the journey; information that should have triggered care never reached the right person
- Population Health Management Learning Center — care gap closure definition
- BH2I / NACHC workshop slides — visit-prep, huddle, screening, documentation, follow-up, outreach failure modes
- MGMA — 35% referral scheduling completion; 18% consult-note return in some systems
- NoShowCost / MGMA 2024 — specialist no-show rates & revenue
- PMC / Cigna — care-coordination waste figures
- Navina docs — care-gap file scrubbing, HEDIS measure closure (for differentiation)
- Abridge/Ambience docs — "reconciles med lists", "surfaces care gaps pre-visit" (for differentiation)

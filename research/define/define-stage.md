# Define Stage — Winning Strategy Framework

> The Define stage determines ~80% of final ranking. Research → **Define** → Select Problem → Build.

## 1. Inferred Judging Function (not official)

| Category | Weight |
|---|---|
| Business Impact | 30 |
| Design / UX | 25 |
| Feasibility | 20 |
| Technical Credibility | 15 |
| Innovation | 10 |

Aligned with judge profiles: Sanjay (design/polish/completeness), Shreyansh (AI correctness/responsible AI), Jad (business value/feasibility).

## 2. Five Properties of a Winning Problem

1. **Pain is expensive** (missed appointments, lost freight, delayed dispatch — not "employees bored").
2. **Pain is measurable** ($250 loss per no-show, not "customers unhappy").
3. **Solution demoable in 60 seconds** (upload → AI extracts → dashboard updates).
4. **AI has a meaningful role** (prediction/classification/optimization/extraction — not a chatbot bolted on).
5. **Business could use it tomorrow** (Jad weights this heavily).

## 3. Win-Probability Formula (100 pts)

| Component | Points | Question |
|---|---|---|
| Pain Score | 25 | Does sponsor lose money? Can loss be quantified? Can we demonstrate savings? |
| Judge Alignment | 25 | Sanjay: amazing UX? Shreyansh: validated AI? Jad: ROI shown? |
| Demo Power | 20 | Understood in 30 seconds? |
| One-Week Feasibility | 20 | 80% of value buildable fast? |
| Differentiation | 10 | Will competitors build this too? |

## 4. Problem Archetypes (pre-scored)

| Archetype | Score |
|---|---|
| Healthcare Scheduling (no-shows, intake, follow-up) | 95 |
| Logistics Document Automation (POD/BOL/invoices) | 94 |
| Healthcare Documentation (forms, insurance, records) | 92 |
| Logistics Visibility (tracking, route issues, exceptions) | 91 |
| Home-Service Dispatch (routing, scheduling) | 90 |
| Restaurant Inventory | 82 |

## 5. North-Star Thesis

> **"Build a decision-support system that converts messy business information into actionable recommendations with measurable financial impact."**

Flow: `Business Data → AI Analysis → Recommended Action → Measurable Outcome`

Deliberately not "AI chatbot / RAG platform / multi-agent system." Maps to Sanjay (complete product), Shreyansh (measurable AI), Jad (business impact).

## 6. Three Pre-Locked Target Problem Statements

1. **Healthcare Scheduling Intelligence** — predict no-shows, recommend interventions, auto-fill gaps.
2. **Logistics Document-to-Decision Platform** — convert shipment documents into operational recommendations.
3. **Field-Service Dispatch Intelligence** — optimize technician assignment, scheduling, comms.

## 7. Sponsor-Category Pre-Ranking (win probability)

| Rank | Category | Win Probability |
|---|---|---|
| 1 | Healthcare Operations | 10/10 |
| 2 | Healthcare Scheduling | 10/10 |
| 3 | Logistics Document Automation | 9.5/10 |
| 4 | Logistics Visibility | 9.5/10 |
| 5 | Home-Service Dispatch | 9/10 |
| 6 | Nonprofit Logistics | 9/10 |
| 7 | Restaurant Operations | 8/10 |

## 8. Care Continuity Pivot (research-backed)

The "universal healthcare platform" idea was rejected as a 10-year industry problem (Epic Care Everywhere / CommonWell / Carequality already exist and still fail). The real bottleneck is **Continuity of Care**:

> *"Providers lack a concise, trusted, actionable view of a patient's cross-provider treatment journey, causing delays, duplicated work, fragmented decisions, and poorer outcomes."*

**Evidence base (see `research/problems/care-continuity.md`):**
- $43B/yr duplicate tests; $200B/yr duplicate services; $265B/yr admin complexity; $3.5T total waste.
- $27–78B/yr care-coordination waste; $25–45B/yr readmissions from poor transitions.
- 10% hospital duplicate-record rate (up to 18–22% without EMPI); $96–$1,950 per duplicate.
- 57.9% of US adults in high-fragmentation care; +$4,542/yr per patient.
- Existing HIEs: only 20% of cases sufficient (CHIME); 32% of PCPs miss entire record; <15% report ideal interoperability; 85% of ED physicians find external data hard to get (avg 66 min, 50% fail rate).
- Higher PCP continuity → lower cost, fewer hospitalizations/ED visits (JABFM 2026).

**Why it beats Healthcare Scheduling:** more unique (rare "Patient Journey Intelligence" vs common scheduler), stronger AI role (medical NLP summarization + care-gap detection), same judge alignment, same demoability.

### Scoped 90-second demo
1. Input: paste/upload 3–5 messy cross-provider records for one synthetic patient.
2. AI: unified care timeline (dates, events, providers, meds).
3. AI: care-gap alerts ("No cardiology follow-up in 120 days"; "Duplicate CBC 3× in 30 days"; "Med started 2/8, no follow-up labs").
4. Output: recommended actions + 1-page provider summary + estimated savings.
5. Metric: "5 records in 12 min → 1 summary in 8 sec; 1 duplicate test avoided."

### Scope guardrails (avoid Demo Hell)
- One patient journey, one provider view. No scheduling, no patient portal, no hospital integration, no emergency dispatch, no multi-tenant.
- Synthetic/de-identified data only (HIPAA-safe).
- AI is the product (summarization + extraction + gap detection + recommendation), not a chatbot.
- Show before/after metric on screen.

### Risk to watch
- Real exchanged data is messy (C-CDA/PDF, duplicates, missing). Lean into it: messy input is the point; AI cleaning it is the value. Use synthetic but realistic messy inputs.
- "Is this just a summary tool?" → No: it's a decision-support system converting messy cross-provider info into actionable recommendations with measurable financial impact. Summary is the delivery mechanism; care-gap detection + recommendation is the value.

### v2 Refinement (locked in `research/refine/refine-stage.md`)
- v1 above is patient-level synthesis; v2 reframes as **coordinator-level prioritization**: "Of my 80 patients, which 5 need me TODAY, why, and what should I do?"
- Primary user locked: **Care Coordinator** (not physician/hospital/patient).
- Three gaps only: missed specialist follow-up · duplicate testing · medication monitoring gap.
- Product name is a *working thesis* only ("AI Continuity Workbench for Care Coordinators"); the locked asset is the problem space, not the label.
- See `research/refine/refine-stage.md` for the full locked demo, ROI metrics, scope guardrails, and differentiation answer.

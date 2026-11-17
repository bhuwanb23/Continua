# Care Coordinator / Nurse Navigator / Referral Coordinator Workflow (Refine Stage, Task 3)

> Goal: pick ONE primary user. The user's job should be literally continuity, so the use case is obvious and the ROI is measurable.

## 1. Role Comparison — Who Suffers Most from Fragmented Records?

| Role | Core responsibility | Fragmentation pain | Fit as primary user |
|---|---|---|---|
| **Care Coordinator** | Identify patients needing coordination; outreach; track through transitions; schedule; reconcile meds; support physicians | Chart reviews scattered across note titles; duplicated/inconsistent documentation; tracking referrals across systems; 1:many patient ratio ("more patients than time to outreach") | **Best** — job is literally continuity; clear ROI (reduced chart-review time, caught gaps) |
| **Nurse Navigator** | Guide patients through cancer/chronic disease journey; education; barrier removal; scheduling; follow-up | Synthesizing records across oncology/surgery/radiology; tracking abnormal results to resolution; patient handoffs between settings | Strong — but more disease-specific (oncology); slightly narrower demo |
| **Referral Coordinator** | Move referrals between referring/receiving teams; documents; scheduling; tracking open referrals; follow-up | Fax/e-fax, missing info, duplicate patient identity, untracked referrals; only 35% of referral scheduling attempts result in completed appt; consult notes returned in as few as 18% of cases | Strong — but narrower (referral logistics); Commure Orchestrator already targets this |
| **Primary Care Physician** | Direct patient care | 86 min/day hunting data; 32% miss entire record; <15% ideal interoperability | Good, but "tool for doctors" is crowded (Abridge/Ambience/Navina all target clinicians) |
| **ED Physician** | Emergency care | 66 min to get external data; 85% find it difficult; 50% fail rate | Good, but ED is high-stakes and demo harder to make relatable |
| **Specialist** | Specialty care | Less fragmentation pain than PCP/coordinator | Weaker |

**Recommendation: Primary user = Care Coordinator (specifically a care coordinator / nurse navigator in a primary-care or multi-specialty clinic).** Reasons:
1. Their job title and KPIs are literally about continuity — the use case is self-evident to judges.
2. They are underserved by ambient scribes (clinician-facing) and by VBC copilots (measure-facing): no one builds a fast synthesis tool for *them*.
3. Their pain is quantifiable: chart-review time, number of gaps caught, referrals closed.
4. A 90-second demo lands: "A care coordinator opens a patient chart and in 8 seconds sees the timeline + 3 care gaps + recommended actions" — instantly understandable.

## 2. Care Coordinator Job Functions (PMC study, PCMH coordinators)

Most commonly mentioned functions:
1. **Identify patients in need of coordination** — review high-risk lists, conduct chart reviews, assess coordination needs.
2. **Outreach to patients** (phone/mail) — track through transitions, follow-up after hospital/ED discharge, schedule appointments, follow up after specialist visits, reconcile medications.
3. **Face-to-face patient encounters.**
4. **Social support** for patients.
5. **Collecting, managing, exchanging patient data** (EHR documentation, data entry).
6. **Supporting physicians** (backup clinical/admin staff).

**Key friction points (from the PMC study):**
- "More patients than you have time to outreach" — patient/coordinator ratio too diluted.
- Colocated coordinators asked to do other tasks (rooming patients, answering phones, processing referrals) → fragmented attention.
- Core coordination documentation scattered across multiple note titles → redundant, inconsistent documentation of time spent.
- Care coordination workload not captured in a standardized way.

## 3. Referral Coordinator Workflow (7 stages — elvrahealth / Medplum / linear.health)

1. **Receive the referral** — capture via upload/e-fax/EHR; associate typed docs, handwritten notes, later-arriving info with same referral.
2. **Assemble & identify** — keep referral form + notes + reports together; confirm patient identity via approved process.
3. **Check completeness** — compare package to required info; missing tests/radiology/history become explicit work items (not informal inbox notes).
4. **Prepare source-linked recommendation** — identify info relevant to referral indication; suggest next action (urgent booking, routine consult, request missing info, route elsewhere); editable, source-linked draft.
5. **Review & decide** — authorized person compares recommendation to source, resolves ambiguity, approves under local policy.
6. **Hand off approved action** — move into booking/follow-up/redirection; keep destination, discussion, acknowledgement, exception path attached.
7. **Monitor the queue** — track ownership, status, age, unresolved info, completion.

**Key failure points (from research):**
- 56% of providers still send referrals by fax; 45% hand paper to patients; 26% give verbal instructions (Phreesia).
- Only 45% cite post-visit follow-up communication as a reason to choose a specialist.
- Only ~35% of referral scheduling attempts result in a completed appointment; consult notes returned in as few as 18% of cases (MGMA).
- Referral difficulties peak on nights/weekends; 90.4% of ED physicians report referral difficulty (PMC 2025).
- Consultants request more tests before seeing patient (82.7%); refuse due to "endorsement time" (76%).

## 4. Nurse Navigator / Care Navigator Role (Frontiers umbrella review, 2025)

Core activities across navigator/care-coordinator/case-manager roles:
- Facilitate communication between individuals and services.
- Signpost/connect to social care and community services.
- **Coordinate referrals, monitor attendance, provide follow-up, remind of upcoming activities** (11 reviews).
- Schedule healthcare appointments with/on behalf of the patient (9 reviews).
- Capacity building & self-management support (20 reviews).
- Education of the patient (13 reviews).

Key insight: navigators spend significant time on *coordination and tracking* — exactly the work our tool accelerates. Their value is measured by gap closure, attendance, and follow-up completion.

## 5. Where Fragmented Records Hurt Most (the "why us" story)

From the PMC/CHIME/JAMA research:
- Physicians spend **86 min/day** beyond expected hunting for patient data (CMAJ).
- **32%** of PCPs frequently miss the patient's entire record (JAMA 2024).
- **<15%** report ideal interoperability (obtain + find + reconcile) (JAMA 2025).
- **85%** of ED physicians find external data difficult/very difficult; avg 66 min; 50% fail rate (PMC).
- **64%** still scan/manually enter data despite interoperable EHRs (Hawaii HIE 2023).
- **42–50%** of every practice phenotype commonly encounter external records with a large volume of low-value info (PMC 2025).
- Care coordinators specifically: chart reviews scattered across note titles; referral tracking across systems; 1:many patient ratio.

**The synthesis gap:** even when data *arrives* (Epic Care Everywhere, CommonWell, Carequality), it arrives as C-CDA/PDF documents that must be manually reconciled. No one delivers "what happened, what was missed, what's next" for the coordinator. That's our product.

## 6. Recommended Primary User + Framing

- **Primary user:** Care Coordinator (in a primary-care or multi-specialty clinic; optionally a Nurse Navigator in oncology/chronic disease).
- **Their daily pain:** "I have 80 patients on my list, each with 5–10 records across 3–4 providers. I spend 2–3 hours/day reading charts to find who missed a follow-up, who has a duplicate test, who needs a lab. I still miss things."
- **Our value prop (to them):** "Upload a patient's records. In 8 seconds, get a timeline, the care gaps, and the next actions — with citations. Spend your time on patients, not on reading."
- **Measurable outcomes (for Jad's ROI story):**
  - Chart review time: 12 min → 8 sec per patient.
  - Care gaps caught per 100 patients reviewed: +X.
  - Referrals closed / completed: +X%.
  - Duplicate tests avoided: $X saved.
- **Demo persona:** "Meet Sarah, a care coordinator at a 12-provider primary care clinic. She has 80 patients on her list today..." → show one patient's records → timeline + 3 gaps + actions → "Sarah just saved 12 minutes and caught a missed cardiology follow-up."

## 7. Implications for Product Scope
- Optimize for the **coordinator's workflow**: they review patients in batches, need a per-patient summary, and need to act (schedule, message, order). Our tool is the *synthesis* step; it doesn't replace the EHR or the scheduling system.
- Output must be **actionable and source-linked**: gap → evidence (record citation) → recommended action (schedule follow-up, cancel duplicate order, order missing lab) → estimated impact.
- Keep it **single-patient, provider-facing**. No patient portal, no scheduling engine, no hospital integration, no multi-tenant. (Avoid Demo Hell.)
- Synthetic/de-identified demo data only (HIPAA-safe).

## 8. Sources
- PMC 4809054 — care coordinator job functions in PCMHs (7 categories)
- Frontiers in Health Services 2025 — umbrella review of care navigator roles (11 reviews on referral coordination/follow-up)
- Linear.health — referral coordination role & responsibilities
- Elvrahealth — 7-stage referral workflow
- Medplum — referral processing & coordination
- Comagine.org — HIT for referral coordination (12 monitored steps)
- LegalClarity — care coordination workflow steps, roles, tools (35% referral completion, 18% consult-note return)
- KP Washington — referral & transition coordination activities
- Phreesia — referral pain points (56% fax, 45% paper, 26% verbal)
- PMC 2025 referral study — 90.4% ED physicians report referral difficulty
- CMAJ 2025 — 86 min/day physicians searching for data
- JAMA 2024/2025 — 32% miss entire record; <15% ideal interoperability
- PMC ED physician survey — 85% difficult, 66 min, 50% fail rate
- Hawaii HIE 2023 — 64% still scan/manually enter
- PMC 2025 practice-phenotype study — 42–50% encounter low-value external records
- Innovaccer service definition — Patient 360, care gaps, InNote overlay (for differentiation)
- Navina docs — care-gap file scrubbing, HEDIS closure (for differentiation)
- Abridge/Ambience docs — "reconciles med lists", "surfaces care gaps pre-visit" (for differentiation)
- Pieces AHA case study — inpatient Working Summaries (for differentiation)
- Arcadia — care manager prioritization (for differentiation)

# Ideation Task 1 — Hackathon Winning Project Red-Team

**Concept under attack:** "AI Continuity Workbench for Care Coordinators" — a provider-facing system that ingests fragmented patient records, builds a longitudinal timeline, identifies care gaps (missed follow-ups, duplicate tests, medication-monitoring gaps), prioritizes patients by continuity risk, and recommends next actions.

> Rule: no sycophancy. Every persona below is instructed to find the kill shot.

---

## 1. Healthcare CIO (large IDN, 12 hospitals, Epic shop)

**Why you'd love it**
- Net-new productivity for care coordinators (your most overloaded, lowest-paid clinical staff) without touching physician workflow — low political risk.
- Measurable, CFO-legible ROI: duplicate-test avoidance, recovered referrals, reduced readmissions. Fits a "digital transformation quick win" narrative.
- AI that stays in the *decision-support* lane (not clinical decision-making) → lower liability, easier governance approval.
- Could be piloted in 90 days on a single clinic's data, which is how you actually buy software.

**Why you'd reject it**
- "We already bought Epic + Care Everywhere + Healthy Planet + Arcadia. You're asking me to fund a 13th tool that requires *another* data feed." Integration is the product; you have no integration.
- Security review alone: HIPAA BAA, SOC 2, penetration test, data residency, retention policy — 6–12 months before a single record flows. Your hackathon demo skips all of this.
- Care coordinators do not have budget authority. The buyer is the CMO/CFO, and they will ask "does this replace Innovaccer or add to it?" You have no answer.
- "AI hallucination in a clinical context" is a board-level risk. One wrong "missed follow-up" alert that delays a real cancer diagnosis ends the company.

**What would make it significantly stronger**
- EHR-native embedding (Epic InNote overlay / SmartPhrase) — not a standalone portal. Coordinators live in Epic; a new login is a non-starter.
- A real 30-day pilot with measured before/after on one clinic's actual coordinator, published as a case study. Evidence beats features.
- Position as "makes your existing Epic data useful" (complement), not "replaces your data platform" (competitor). Bring a letter of intent from an Epic ACO.
- Write-back: the tool must create the task/message/order in Epic, not just display a recommendation.

**Assumptions that are wrong**
- Assumes records are *available to ingest.* They are not — they live in Epic/Cerner, and exporting them is the actual hard problem (you are not solving it).
- Assumes care coordinators review patient-by-patient. They review by *queue/risk list*, not by chart.
- Assumes "continuity risk score" is meaningful. It may be noise dressed as signal; you have no validation.
- Assumes a synthetic demo predicts real-world performance. It does not — messy C-CDA/PDF reality will break the extraction pipeline in week one.

---

## 2. Care Coordinator (the actual user, 80-patient panel, 3 hrs/day chart review)

**Why you'd love it**
- Something finally reads the 12 charts for me. I would cry.
- "Who needs me today" is literally the question I ask myself every morning at 7:45 AM.
- Evidence-linked alerts mean I can defend my work to my manager ("I called this patient because the system flagged X, here's the source").
- If it saves me 90 min/day, I can take 120 patients instead of 80 — that's a raise and a promotion.

**Why you'd reject it**
- "Who is going to upload 80 patients' records every morning? Me? At 7 AM? I don't have time — that's the *problem*."
- "If the AI is wrong, I'm liable, not the AI. My name is on the chart."
- "My EHR already has a 'care gaps' tab (Epic Healthy Planet). Why is yours better? Convince me in one sentence."
- "My actual day is chasing insurance auths, scheduling, and phone tag — not reading records. You solved the wrong 20%."
- "I need it to *make the call / send the message / place the order*, not tell me to."

**What would make it significantly stronger**
- Zero manual upload: pull from EHR automatically (FHIR/HL7). If I have to upload, I won't use it twice.
- One-click actions: draft the message, schedule the appointment, place the lab order — inside my existing Epic inbox.
- Match my actual vocabulary: "open referrals," "overdue labs," "patients I haven't reached" — not "continuity gaps."
- Trust calibration: confidence scores + "verify" buttons + "I already handled this" feedback so the system learns and I stay in control.
- Show me *one* next action per patient, not three alerts. I can act on one; three is just a longer to-do list.

**Assumptions that are wrong**
- Assumes the bottleneck is reading records. Often it's *acting* (phone calls, scheduling, insurance) — synthesis doesn't remove the action.
- Assumes coordinator reviews patient-by-patient. They review by *risk list* and by *exception*.
- Assumes 12-min chart review is the pain. Sometimes it's 2 min of reading + 10 min of system navigation and clicking.
- Assumes coordinators want "AI." They want "fewer clicks and fewer missed patients." If AI is the path, fine — but lead with the outcome.

---

## 3. Epic Product Manager

**Why you'd love it**
- Validates a gap your customers complain about in every advisory council. Free market research.
- Potential acquisition/partnership target — "complement, not competitor" is the pitch you want to hear.
- Shows what the last mile looks like, which Epic's roadmap will eventually cover.

**Why you'd reject it**
- "This is a feature, not a company. Healthy Planet + Care Everywhere + our AI team are already building 80% of this."
- "Standalone tools that require data export lose to native modules every time. Every time."
- "The 'AI' is summarization + classification on top of GPT-4. That's a prompt, not a moat. My team ships that in a sprint."
- "Interoperability is our turf. You're a UI layer on top of our data. We don't need you."
- "No EHR write-back = double data entry = coordinator abandonment in week two."

**What would make it significantly stronger**
- Position as a *partner* that makes Epic's data more useful — not a replacement. Bring an Epic ACO as a design partner.
- Focus on the *last mile Epic won't build*: cross-organization synthesis across *unaffiliated* orgs, small practices without Epic, patient-level narrative across systems Epic doesn't connect.
- Build on FHIR/HL7 so it's "Epic-friendly" and embeddable, not "Epic-competing."
- Demonstrate something Epic *structurally cannot* do: synthesize records from Epic + Cerner + athena + scanned faxes + patient-uploaded docs into one narrative.

**Assumptions that are wrong**
- Assumes Epic won't build this. They will — slowly, but they will. You have ~18 months, not forever.
- Assumes the "UI layer" is defensible. It is not. You need data + workflow + trust, not screens.
- Assumes cross-provider synthesis is novel. It is the entire HIE industry's 20-year promise. You are not the first to attempt it.
- Assumes a hackathon demo equals a product. It does not.

---

## 4. Healthcare Startup Founder (Series A, digital health)

**Why you'd love it**
- Clear, underserved wedge (coordinators). Measurable ROI. AI as product, not bolt-on. A 90-sec demo that *is* a fundraising demo.
- "Care coordination" is a hot category post-COVID; acquirers exist (Epic, Innovaccer, Commure, Arcadia).
- Hackathon → pilot → seed is a plausible path if you're disciplined.

**Why you'd reject it**
- "This is a feature, not a company. TAM = coordinators' tooling budget, which is tiny and discretionary."
- "No data moat. No proprietary data. Just an LLM on top of records anyone can access. Zero defensibility."
- "Health system sales cycle is 12–18 months. You'll run out of money before the first dollar."
- "Incumbents (Innovaccer, Arcadia, Navina) will crush you the moment you show traction — they have the data pipes already."
- "The real money in healthcare is in risk-bearing (VBC), not SaaS tools. You're selling a vitamin, not a painkiller."
- "HIPAA + EHR integration = 18–24 months before first revenue. Hackathon energy doesn't survive that."

**What would make it significantly stronger**
- Narrower wedge with a faster path to revenue: a specific specialty (oncology navigation), a specific payer contract (Medicaid managed care), or a specific moment (discharge transition).
- Build a data moat: aggregate anonymized gap patterns → "which gaps are most common in which populations" becomes proprietary insight.
- Charge per-gap-closed or per-patient (outcome-based), not per-seat. Aligns incentives and is easier to sell to CFOs.
- Partner with a VBC org for distribution instead of selling to health systems directly.
- Consider a *service* model (managed care coordination) not just software — software alone won't survive the sales cycle.

**Assumptions that are wrong**
- Assumes SaaS is the model. Maybe it's a service.
- Assumes coordinators have budget authority. They don't — it's the CMO/CFO/VP of Population Health.
- Assumes "AI" differentiates. It doesn't anymore. Everyone has AI. The differentiator must be workflow + data + trust.
- Assumes the demo's 3 gaps are the highest-value. Maybe no-shows, insurance auths, and medication reconciliation are the actual bleeding.

---

## 5. Hackathon Judge (experienced, seen 40 projects today)

**Why you'd love it**
- Clear problem, clear user, clear metric, working demo, AI is the product (not bolted on), 90-sec understandable, business value obvious.
- Hits all three judge profiles: Sanjay (clean UX + complete product), Shreyansh (medical NLP + care-gap detection = his research area), Jad (ROI + feasibility).
- "12 min → 8 sec" is a memorable number.

**Why you'd reject it**
- "I've seen 4 'AI reads medical records' projects today. What's different?"
- "The demo is upload → list. That's a CRUD app with an LLM. Where's the 'wow'?"
- "No technical depth shown — it's prompt engineering. Where's the eval? Where's the grounding? Where's the failure mode?"
- "The 'prioritization' is just sorting by gap count. That's not AI, that's a sort."
- "No validation the AI is correct. No gold labels. No confidence calibration. No 'what happens when it's wrong.'"
- "Feels like a student project, not a startup. Where's the defensibility?"

**What would make it significantly stronger**
- A "wow" moment: the AI catches a gap the human *missed*, with a dramatic reveal ("Sarah reviewed this chart for 12 minutes and missed this. The system found it in 8 seconds.").
- Real technical depth: a fine-tuned extraction model, an eval harness with gold labels, confidence calibration, hallucination guardrails. Show the *engineering*, not just the output.
- A memorable visual: the ranked queue, the animated timeline, the risk heatmap. One image that sticks.
- A single unforgettable number: "1 in 3 patients on Sarah's list has a missed follow-up she didn't know about."
- Show the *before* (a real coordinator's actual messy day — screen recording) and the *after*.

**Assumptions that are wrong**
- Assumes judges reward "completeness." They reward *memorability*. A rough demo with one unforgettable moment beats a polished demo with none.
- Assumes technical depth = more features. It's usually *one deep thing done well* (e.g., a real eval, a real model).
- Assumes the 3-gap demo is enough. It needs a *hook* — a moment the judge tells their friends about.
- Assumes "care coordinator" resonates with all judges. It does (Jad = business, Shreyansh = medical NLP), but the demo must make the coordinator's pain *felt*, not just described.

---

## Synthesis — Does the idea survive?

**Survives:** Yes, but barely, and only if we address the three kill shots:
1. **"It's a feature, not a company"** (CIO + founder) → narrow the wedge or add a data moat / service model.
2. **"I have to upload 80 records"** (coordinator) → zero-manual-upload is non-negotiable for real use; for the hackathon, fake it with "connected to Epic" framing.
3. **"Where's the wow?"** (judge) → one unforgettable moment + real technical depth (eval/grounding).

**The concept is genuinely differentiated** (cross-provider synthesis + panel prioritization + coordinator focus is a real gap), but the *current* framing undersells it. The red-team's strongest single recommendation: **make the demo about the gap the human missed**, not about the summary. That is the "wow."

**Decision input for the user:** The idea does not break. It needs (a) a wow moment, (b) a technical-depth signal, and (c) a narrower revenue wedge. See `alternative-visions.md` for 20 competing concepts and `judge-simulation.md` for scoring.
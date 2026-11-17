# PRD — Continua (Oncology Continuity Workbench for Care Coordinators)

**Version:** 1.0 (hackathon planning) · **Status:** Locked for build · **Owner:** Hackathon captain

---

## 1. Summary

**Continua** is an AI-powered continuity workbench for care coordinators. It ingests fragmented, multi-provider patient records (synthetic/de-identified for the hackathon), reconstructs a unified per-patient timeline, detects three continuity gaps (missed specialist follow-up, duplicate testing, medication monitoring gap), ranks the patients most at risk across a whole panel, and recommends the next action for each — with evidence citations to the source record.

The hackathon demo is scoped to an **oncology / high-risk patient panel** (cancer journey: surgery → radiology → oncology → labs → follow-ups) to maximize emotional impact, AI-depth credibility, and judge alignment. The underlying product is general continuity.

**One-line pitch:** *From 80 patients to the 5 who need you today — with why, and what to do next.*

**Wow line:** *"Sarah reviewed Maria's chart for 12 minutes yesterday. She missed that Maria hadn't seen oncology in 45 days after her imaging. The system found it in 8 seconds."*

## 2. Problem

Care coordinators manage large patient panels (≈80) across fragmented healthcare systems. Records arrive as disconnected documents from multiple providers (PCP, specialists, labs, imaging, pharmacy). The coordinator's job is not to summarize charts — it is to **close care gaps, prevent leakage, and coordinate treatment**. But the only available input is unstructured, fragmented records, so the coordinator spends hours manually reviewing charts and still misses things.

Consequences: missed specialist follow-ups (a cancer patient disappears after imaging), duplicate diagnostic tests (cost + burden), missed medication monitoring (drug started, expected lab never ordered). These are **continuity gaps** — failures in the handoffs between providers.

**Root cause is cognitive, not data:** the data exists; no human can review 80 charts deeply enough, fast enough. Epic exchanges documents; Abridge documents one encounter. Neither synthesizes *across providers* to surface *what was missed* for the coordinator, and neither prioritizes across a whole panel.

## 3. Users

| Role | Priority | Needs |
|---|---|---|
| **Care Coordinator** | Primary | Know which patients need attention today, why, and what to do; evidence; time saved. |
| **Nurse Navigator** | Secondary | Same workflow, oncology-specific depth (treatment milestones, imaging follow-up). |
| Population Health teams | Future (out of scope) | Panel-level metrics, leakage dashboards. |

**Not users (out of scope):** physicians (they have their own tools), patients (no patient portal), hospital admins, payers.

## 4. Goals

- **G1** Reduce per-patient chart review from ~12 min to seconds (target: <10 sec synthesis per patient).
- **G2** Surface the **top 5 of 80** patients requiring intervention today, with reason + recommended action + evidence.
- **G3** Detect the 3 locked gap types with cited evidence for each.
- **G4** Demonstrate measurable impact: ≥1 recovered referral, ≥1 duplicate test avoided, ≥1 monitoring gap caught (in the demo data).
- **G5** Provide a technical-depth signal: grounding/eval (every gap cites source record; an eval set + metric reported).

## 5. Non-goals (explicit)

See `out-of-scope.md`. In short: no patient portal, no EHR replacement, no interoperability network, no chatbot, no symptom checker, no scheduler, no multi-tenant SaaS, no multi-hospital integration, no real PHI (synthetic only), **no fake Epic/EHR integration** (MVP ingestion is synthetic; production path is standards-based FHIR/HL7 feeds, mentioned as roadmap only).

### Data & integration stance
- MVP runs on **synthetic cross-provider records only**. No real PHI, no EHR connection.
- **Human in the loop:** Continua surfaces gaps for coordinator verification. It never diagnoses, treats, or orders. Recommended actions are "verify / contact / review / coordinate," never unsupervised clinical orders.
- Production integration path (not built): FHIR R4 / HL7 feeds. Stated as roadmap, never implied as implemented.

## 6. Core outcome (the single metric of success)

> **80 patients → 5 requiring intervention today**, each with *why* (gap type + evidence) and *what to do next* (recommended action).

This is the product. Everything else (timeline, summary) is the engine underneath.

### Technical architecture (hybrid)
Documents → LLM structured extraction → normalized events → **deterministic gap detection** → evidence verification → **explainable intervention priority** → LLM/plain-language explanation → UI. The LLM never independently decides a clinical gap when deterministic evidence can establish it.

## 7. Scope — the 3 gap types (locked)

Detection is **deterministic** over normalized events (not LLM judgment).

1. **Missed specialist follow-up:** referral event (date, specialty, reason) exists, but no matching consult note / visit / result within the expected window → flag with evidence (referral doc citation) + action (verify/contact/review/coordinate) + impact (recovered referral).
2. **Duplicate diagnostic test:** same normalized test ordered ≥2× within N days by ≥1 provider → flag with evidence + estimated cost avoided.
3. **Missed medication monitoring:** medication started (drug, date) + expected monitoring lab (drug → lab map, e.g., metformin → A1c/BMP) not ordered within window → flag + recommended order.

Oncology-flavored demo instances: (1) cancer patient no oncology visit 45 days after imaging; (2) duplicate CBC within 10 days; (3) missing tumor-marker/A1c monitoring lab after medication start.

## 8. Functional requirements

**FR-1 Ingestion.** Accept a batch of patient records (synthetic CSV/JSON or pasted text) for a panel of N patients. Each record: patient id, provider, date, document type, free-text note, optional structured fields (meds, labs, referrals).

**FR-2 Timeline reconstruction.** For a selected patient, build a unified, chronologically ordered timeline of events across providers (date, event, provider, source doc id).

**FR-3 Gap detection.** Run the 3 detectors per patient; each gap returns {type, severity, evidence: [source doc ids + quoted span], recommended action, estimated impact}.

**FR-4 Prioritization.** Rank patients by an **explainable intervention priority** (gap severity × overdue duration × evidence confidence × actionability; gap type as tie-breaker) → return top-K (default 5) with per-patient "why." This is *intervention priority for coordinator triage*, NOT a clinically validated patient-risk score. Formula is visible in the UI.

**FR-5 Evidence grounding.** Every gap and every summary statement cites source document id(s). No unsupported claim.

**FR-6 Explainability.** Each prioritized patient shows: top gaps, evidence snippets, recommended next action, and a one-line "why this patient today."

**FR-7 Panel dashboard.** Single screen: panel size, count flagged, top-5 queue, gap-type counts, time-saved metric.

**FR-8 Patient detail.** Timeline + gaps + evidence + recommended actions for one patient.

**FR-9 Demo data.** Ship a synthetic oncology panel (≈80 patients) with planted gaps so the demo is reproducible and the "wow" line is guaranteed to fire.

**FR-10 (Must, P0) Eval harness.** A frozen labeled set of synthetic patients with planted ground-truth gaps (~80 gaps across ~20 patients); report precision/recall/F1 per gap type, macro F1, grounding/citation accuracy, extraction accuracy, and latency. This is the technical-depth signal for judge Shreyansh and the answer to "how do you know the AI found the right gaps?"

## 9. Non-functional requirements

- **NFR-1 Privacy:** synthetic/de-identified data only; no real PHI ever. A banner states "Synthetic demo data — no real patient information."
- **NFR-2 Latency:** panel synthesis (80 patients) < 60 sec; single-patient synthesis < 10 sec.
- **NFR-3 Reliability:** demo must run offline-ish (cached LLM responses allowed for demo) so a live API hiccup doesn't kill the demo.
- **NFR-4 Clarity:** one primary action per screen; no dead ends; loading states.
- **NFR-5 Accessibility:** basic (keyboard nav, contrast, alt text) — enough for a hackathon "Design" criterion.

## 10. Success metrics (hackathon judging)

- Design criterion: clean, professional, medical-appropriate UI (not AI-slop).
- Demo: 90 sec, hits the wow line, shows top-5 queue with evidence.
- AI substance: timeline + 3 detectors + prioritization + grounding + eval metric reported.
- Business narrative: "12 min → 8 sec; 1 referral recovered; 1 duplicate test avoided; 1 monitoring gap caught" per 80-patient panel.
- Technical credibility: eval precision/recall reported; no hallucinated citations.

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| LLM hallucinates citations | Force structured JSON with doc-id references; post-validate that every cited doc id exists; drop gaps whose evidence can't be verified. |
| "Platform, not a tool" critique | Demo is oncology-only; UI is a single queue + patient detail; no platform chrome. |
| "I have to upload 80 records" critique | Ship pre-loaded synthetic panel; "load demo data" is one click; manual upload is optional/secondary. |
| Live API failure during demo | Cache LLM outputs for the demo panel; deterministic fallback. |
| Scope creep | `out-of-scope.md` is the contract; any new feature must displace a planned one. |
| Judge Shreyansh wants AI depth | Eval harness + grounding + reported metric (FR-10). |
| Judge Jad wants ROI | Quantified leakage metric in the demo: cost of duplicate CBC, value of recovered referral. |

## 12. Open questions (non-blocking)

- Final brand name (Continua vs. others) — can change any time; docs use "Continua."
- Whether to add a second gap type example in oncology beyond the 3 locked (e.g., treatment-interruption) — **no**, keep 3 for clarity. Could be mentioned as "future."
- Supabase vs. local JSON for storage — decide in build plan (recommend Supabase for credibility, local JSON fallback).
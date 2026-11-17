# Ideation Task 3 — Winning Judge Simulation

**Concepts scored:**
1. CareGap AI
2. Continuity Workbench
3. Referral Intelligence
4. No-Show Recovery System
5. Oncology Follow-up Intelligence

**Scoring rubric (each criterion 1–10):** Design, Technical Depth, AI Credibility, Business Impact, Demo Quality. Total /50 per judge.

**Judge profiles (from dossiers):**
- **Sanjay Jillellamudi** — National Merit Semifinalist; organizer/contact; academic/STEM. Rewards design, polish, completeness, clear communication, functional prototype, real business utility. High school senior.
- **Shreyansh Rath** — National Merit Semifinalist; UTSA CARE AI high-school research fellow; co-author AAAI 2026 multi-agent medical-summarization paper. Rewards AI/ML substance, technical correctness, responsible/ethical AI, healthcare/NLP relevance, measurable quality.
- **Jad Diab** — Prosper HS senior; TXBHA case competition finalist; PCIS. Rewards business value, feasibility, clear narrative, healthcare/finance/policy. Asks "would a business use this tomorrow?"

---

## Scorecards

### Sanjay Jillellamudi (Design / Polish / Completeness / Clarity)

| Concept | Design | Tech Depth | AI Cred | Biz Impact | Demo | Total |
|---|---|---|---|---|---|---|
| CareGap AI | 8 | 5 | 6 | 6 | 8 | **33** |
| Continuity Workbench | 8 | 6 | 7 | 8 | 7 | **36** |
| Referral Intelligence | 7 | 6 | 6 | 8 | 9 | **36** |
| No-Show Recovery System | 8 | 4 | 4 | 7 | 9 | **32** |
| Oncology Follow-up Intelligence | 7 | 7 | 7 | 7 | 7 | **35** |

*Sanjay's notes:* CareGap AI is clean but reads as "summary tool." Continuity Workbench and Referral Intelligence tie on polish+clarity; Referral Intelligence has the cleaner 90-sec story (fax → scheduled). No-Show Recovery has the best demo but thinnest AI. Oncology is strong but slightly narrower audience.

### Shreyansh Rath (AI/ML Substance / NLP / Grounding / Eval)

| Concept | Design | Tech Depth | AI Cred | Biz Impact | Demo | Total |
|---|---|---|---|---|---|---|
| CareGap AI | 6 | 6 | 7 | 5 | 7 | **31** |
| Continuity Workbench | 6 | 7 | 8 | 7 | 6 | **34** |
| Referral Intelligence | 5 | 6 | 6 | 7 | 8 | **32** |
| No-Show Recovery System | 6 | 3 | 3 | 6 | 8 | **26** |
| Oncology Follow-up Intelligence | 6 | 8 | 9 | 7 | 6 | **37** |

*Shreyansh's notes:* Oncology Follow-up Intelligence has the deepest AI story (cross-specialty NLP, treatment-timeline reasoning) and the strongest credibility — it maps directly to his multi-agent medical-summarization research. Continuity Workbench is second: panel prioritization requires real ML (risk scoring, calibration), which is credible if we show an eval. CareGap AI is "just summarization." Referral Intelligence is mostly NLP-on-faxes (moderate depth). No-Show Recovery is a logistic regression — he'll see through it.

### Jad Diab (Business Value / Feasibility / Narrative / ROI)

| Concept | Design | Tech Depth | AI Cred | Biz Impact | Demo | Total |
|---|---|---|---|---|---|---|
| CareGap AI | 6 | 5 | 5 | 6 | 7 | **29** |
| Continuity Workbench | 6 | 6 | 6 | 8 | 7 | **33** |
| Referral Intelligence | 6 | 6 | 6 | 9 | 8 | **35** |
| No-Show Recovery System | 7 | 4 | 4 | 8 | 9 | **32** |
| Oncology Follow-up Intelligence | 6 | 7 | 7 | 6 | 6 | **32** |

*Jad's notes:* Referral Intelligence has the cleanest business case — "$0.87M/yr leakage, 35% completion rate, one number." Continuity Workbench is strong but the ROI is more diffuse ("gaps caught"). Oncology is emotionally strong but the buyer is narrower (oncology service line, not general). CareGap AI's ROI is vaguest. No-Show Recovery is universal but thin.

---

## Combined Totals (across all 3 judges)

| Rank | Concept | Sanjay | Shreyansh | Jad | **Total** |
|---|---|---|---|---|---|
| 1 | **Continuity Workbench** | 36 | 34 | 33 | **103** |
| 2 | Referral Intelligence | 36 | 32 | 35 | **103** |
| 3 | Oncology Follow-up Intelligence | 35 | 37 | 32 | **104** |
| 4 | CareGap AI | 33 | 31 | 29 | **93** |
| 5 | No-Show Recovery System | 32 | 26 | 32 | **90** |

*Wait — re-totaled with the per-judge scores above, Oncology edges to 104. Let me re-state cleanly with the numbers as scored:*

| Rank | Concept | Total (3 judges) |
|---|---|---|
| 1 | **Oncology Follow-up Intelligence** | 35 + 37 + 32 = **104** |
| 2 | Continuity Workbench | 36 + 34 + 33 = **103** |
| 3 | Referral Intelligence | 36 + 32 + 35 = **103** |
| 4 | CareGap AI | 33 + 31 + 29 = **93** |
| 5 | No-Show Recovery System | 32 + 26 + 32 = **90** |

---

## Final Ranking (with reasoning)

1. **Oncology Follow-up Intelligence (104)** — highest AI credibility (Shreyansh's domain), strong technical depth, emotionally compelling. Weakness: narrow buyer; Jad scores it lowest on business impact because oncology service-line budget < general practice.
2. **Continuity Workbench (103)** — best all-rounder; strongest on Jad's business impact among the top 3; the "coordinator daily tool" story. Weakness: AI credibility depends on showing real ML (risk scoring + eval), not just sorting.
3. **Referral Intelligence (103)** — best demo quality and cleanest ROI number; ties CW. Weakness: narrow scope; lower AI depth.
4. **CareGap AI (93)** — the v1 patient-level thesis. Suffers from "just a summarizer" risk across all three judges. The v2 refinement (CW) is strictly better.
5. **No-Show Recovery System (90)** — best demo, worst AI depth. Shreyansh (the AI judge) scores it lowest. In a hackathon where "Design" is the published criterion but judges' backgrounds imply tech+business weighting, thin AI is a liability.

## Key Tension for the Decision Gate

- **If you optimize for Shreyansh (AI credibility):** Oncology Follow-up Intelligence wins. But it's narrow.
- **If you optimize for Jad (business ROI):** Referral Intelligence wins. But it's narrow.
- **If you optimize for the all-rounder / "Design" criterion + defensibility:** Continuity Workbench wins, *if* you add (a) a real "wow" moment, (b) a technical-depth signal (eval/grounding), and (c) a quantified leakage metric borrowed from Referral Intelligence.

**This is exactly the case for Option C (Hybridize):** Continuity Workbench's prioritized queue + Referral Intelligence's quantified leakage metric + Oncology's emotional depth + a "wow" moment (AI catches a gap the human missed). See `red-team.md` §Synthesis and `alternative-visions.md` §Summary.
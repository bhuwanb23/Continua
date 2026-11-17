# Evaluation Metrics — Continua

The technical-depth signal for judge Shreyansh (UTSA CARE AI fellow, AAAI 2026 co-author): every claim cites a source record, and we *measure* and *report* detection quality instead of asserting it.

## 1. Product metrics (demo narrative — for Jad)

| Metric | Baseline | Target | How shown |
|---|---|---|---|
| Chart review time per patient | 12 min | 8 sec (synthesis) | Impact summary (Screen 7) |
| Patients reviewed per panel | 80 | 80 (all) | Dashboard |
| Patients surfaced needing action | unknown | top 5 | Dashboard queue |
| Care gaps detected per panel | 0 (missed) | 19 across 12 patients (demo) | Dashboard |
| Referrals recovered | 0 | ≥1 | Impact summary |
| Duplicate tests avoided | 0 | ≥1 (≈$ cost) | Impact summary |
| Monitoring gaps caught | 0 | ≥1 | Impact summary |
| Time saved per panel | — | ≈15 hours | Impact summary |

## 2. AI quality metrics (eval harness — FR-10)

Labeled eval set: ~20 synthetic patients with **planted, known gaps** (ground truth). Run detectors; compare.

| Metric | Definition | Target |
|---|---|---|
| Precision (per gap type) | TP / (TP+FP) | ≥ 0.80 |
| Recall (per gap type) | TP / (TP+FN) | ≥ 0.70 |
| F1 (per gap type) | harmonic mean | ≥ 0.75 |
| Overall F1 | macro-average across 3 types | ≥ 0.75 |
| **Grounding rate** | % of reported gaps whose every cited doc id exists AND whose quoted span is a substring (fuzzy ≥0.85) of the source | **1.00** |
| Hallucination rate | 1 − grounding rate | 0.00 |
| Timeline event grounding rate | % events with valid source_doc_id | 1.00 |

## 3. Why grounding rate = 1.0 is the headline

The single most credible technical claim we can make: **"Every gap cites a source record, and 100% of citations are verifiable."** This directly answers Shreyansh's likely "how do you prevent hallucination?" question. We report it as a number, not a promise.

## 4. Eval protocol

- Eval set stored as `data/eval-set/` (patients + `ground_truth.json` listing expected gaps: `{patient_id, type, source_doc_ids}`).
- Runner: `scripts/eval.ts` (or a dev-only route `/api/eval`) computes metrics and writes `EvalResult` rows.
- Report displayed on Screen 8 (dev/demo toggle) and summarized in the demo ("our detectors hit X precision / Y recall, 100% grounded").
- Re-run after any prompt change; track in git.

## 5. Guardrails that make the metrics honest

- Detectors return structured JSON only; no free-text parsing.
- Post-validation drops ungrounded gaps (counts as FN in eval, not as a silent pass).
- Temperature 0.1.
- Eval set is **held out** from prompt tuning iteration where feasible (at minimum, don't tune prompts to the eval answers by hand).

## 6. What we will NOT claim

- We will not claim clinical validation, FDA clearance, or real-world efficacy.
- We will not claim the system diagnoses or treats.
- We will claim: "AI-assisted continuity review; synthetic data; human coordinator decides." All claims are scoped to the demo panel.

## 7. Judging mapping

- **Design (stated criterion):** UI quality, evidence chips, clarity → Screens 1–3, 7.
- **AI substance:** pipeline (timeline + 3 detectors + prioritization + grounding + eval) → ai-pipeline.md + Screen 8.
- **Business narrative:** 12 min → 8 sec; 1 referral; 1 duplicate; 1 monitoring gap → Impact summary.
- **Technical credibility:** eval metric + grounding rate → Screen 8 + pitch.
# Demo Seed Case — Maria Chen (Continua)

The flagship demo story. Maria is synthetic. All names, providers, and dates are fabricated. No real PHI.

> **Revision note (v2):** the tamoxifen monitoring gap was removed. A 365-day window cannot be "missed" 44 days after the medication starts — it was a logically impossible gap. Maria's third detector is now a genuinely overdue **metformin → A1c** monitoring window (25 days past due). Tamoxifen remains in her record as clinical context only; it is not counted as a detected gap.

## Why Maria

Her story carries the emotional weight of the oncology vertical and demonstrates all three detectors in one patient view: a missed oncology follow-up (the wow moment), a duplicate CBC (ROI), and an overdue monitoring lab (safety). She is patient #1 in the coordinator queue.

## Patient

| Field | Value |
|---|---|
| Name | Maria Chen |
| Age / sex | 54 / F |
| Primary diagnosis | Breast cancer — post-surgical (left breast); T2DM (comorbidity) |
| Last contact | 2026-04-28 |
| Panel | Oncology demo panel |
| Demo "today" | **2026-06-05** |

`risk_level` no longer exists in the model (see Fix 2). Maria carries no clinical-risk label — only computed `priority_band`.

## The 8 synthetic records (documents)

### R1 — PCP note (2026-02-10) — Dr. A. Patel — Primary Care (`note`)

> "54F with type 2 diabetes, A1c 8.1%. Starting metformin 1000 mg twice daily. Plan: recheck A1c and BMP in 90 days to assess response and renal function."

### R2 — PCP note (2026-03-04) — Dr. A. Patel — Primary Care (`note`)

> "New diagnosis of invasive ductal carcinoma, left breast, on screening mammogram. Discussed surgical options. Referred to surgical oncology. Patient anxious but engaged. Plan: lumpectomy with sentinel node biopsy."

### R3 — Surgery / pathology note (2026-03-18) — Dr. A. Patel — Primary Care (`note`)

> "Underwent left lumpectomy with sentinel lymph node biopsy on 2026-03-18. Pathology: invasive ductal carcinoma, 1.8 cm, grade 2, ER+/PR+, HER2-negative, 0/2 nodes positive. Margins clear. Plan: adjuvant radiation and endocrine therapy."

### R4 — PCP post-op note with referral (2026-03-25) — Dr. A. Patel — Primary Care (`referral`)

> "Post-operative visit. Referral to Medical Oncology for adjuvant therapy evaluation (endocrine therapy and radiation planning). Please schedule within 45 days. Patient to be contacted by coordinator."

**Source of the flagship gap: no oncology consult follows.**

### R5 — Imaging report (2026-04-18) — Regional Imaging Center — Imaging (`imaging_report`)

> "Bilateral diagnostic mammogram and breast ultrasound for post-surgical baseline. Post-surgical changes left breast. No suspicious mass or recurrence identified. Recommend clinical correlation and oncology follow-up per treating team."

### R6 — Lab result: CBC (2026-04-20) — Metro Lab Services — Lab (`lab_result`)

> "CBC with differential: WBC 5.8, Hgb 12.4, Plt 248. Within normal limits."

### R7 — Medication list update (2026-04-22) — Dr. A. Patel — Primary Care (`med_list`)

> "Started tamoxifen 20 mg daily for ER+ breast cancer. Discussed side effects including VTE risk. Annual gynecologic/oncology follow-up recommended."

*Context only — not a detected gap (see Fix 1).*

### R8 — Lab result: CBC (2026-04-28) — Dr. A. Patel — Primary Care (`lab_result`)

> "Repeat CBC with differential ordered at follow-up visit: WBC 5.9, Hgb 12.5, Plt 251. Within normal limits. No clinical indication documented for repeat at this interval."

**Source of the duplicate-test gap: same normalized test (`cbc`), two providers, 8 days apart, no documented series intent.**

## Ground truth (frozen, hidden from the pipeline)

```json
[
  {
    "patient_id": "P-001-maria",
    "type": "missed_followup",
    "source_doc_ids": ["R4"],
    "expected_window_days": 45,
    "notes": "Referral to medical oncology 2026-03-25; window elapses 2026-05-09; no oncology consult by 2026-06-05 (27 days overdue)."
  },
  {
    "patient_id": "P-001-maria",
    "type": "duplicate_test",
    "source_doc_ids": ["R6", "R8"],
    "expected_window_days": 14,
    "notes": "CBC 2026-04-20 and 2026-04-28, 8 days apart, two providers, no documented series intent (series_status unknown)."
  },
  {
    "patient_id": "P-001-maria",
    "type": "med_monitoring",
    "source_doc_ids": ["R1"],
    "expected_window_days": 90,
    "notes": "Metformin started 2026-02-10; A1c/BMP expected by 2026-05-11; no A1c or BMP resulted by 2026-06-05 (25 days overdue)."
  }
]
```

## Expected extraction (events)

| Event | Date | Type | Provider | Phase |
|---|---|---|---|---|
| T2DM visit, metformin start | 2026-02-10 | medication_start (metformin) | Dr. A. Patel | Medications |
| New IDC diagnosis, surgical referral | 2026-03-04 | consult (PCP) | Dr. A. Patel | Surgery |
| Lumpectomy + pathology | 2026-03-18 | surgery | Dr. A. Patel | Surgery |
| Referral to medical oncology (45d) | 2026-03-25 | referral (oncology) | Dr. A. Patel | Oncology |
| Post-surgical mammogram/US | 2026-04-18 | imaging | Regional Imaging Center | Radiology |
| CBC | 2026-04-20 | lab_result (cbc) | Metro Lab Services | Labs |
| Tamoxifen start | 2026-04-22 | medication_start (tamoxifen) | Dr. A. Patel | Medications |
| CBC (repeat) | 2026-04-28 | lab_result (cbc) | Dr. A. Patel | Labs |

## Expected detection

| # | Type | Severity | Window | Timing | Evidence |
|---|---|---|---|---|---|
| 1 | missed_followup (oncology) | high | 45 d | 27 d overdue | R4 referral span |
| 2 | duplicate_test (cbc) | low | 14 d | 8 days apart | R6 + R8 spans |
| 3 | med_monitoring (metformin → a1c/bmp) | med | 90 d | 25 d overdue | R1 span |

Tamoxifen is **not** reported: its 365-day window has not elapsed, so no gap exists. (Rule 3 explicitly states this.)

## Expected priority (arithmetic shown)

Constants from `priority-engine.md`.

**Gap 1 — missed oncology follow-up**
```
1.00 (high severity) × 1.45 (1 + 27/60) × 0.96 (confidence) × 1.00 (actionability) × 1.00 (type)
= 1.392  →  display round(100 × 1.392 / 2) = 70  →  CRITICAL
```

**Gap 2 — duplicate CBC**
```
0.30 (low severity, 8-day interval) × 1.13 (1 + 8/60) × 0.94 × 0.75 (actionability) × 0.90 (type)
= 0.216  →  display 11  →  LOW
```

**Gap 3 — metformin monitoring**
```
0.60 (med severity, 25 d overdue < 45 d half-window) × 1.42 (1 + 25/60) × 0.95 × 0.95 × 0.97
= 0.744  →  display 37  →  MEDIUM
```

**Patient**
```
patient_priority_score (raw) = 1.392 + 0.10 × (0.744 + 0.216)
                             = 1.392 + 0.096
                             = 1.488
patient_priority_score (display) = round(100 × 1.488 / 2) = 74  →  CRITICAL
top_gap.gap_priority_score = 70
```

> **Numbers changed from the earlier draft.** The previous 84/89 pair came from the impossible 45-day-overdue tamoxifen gap. With that removed, Maria computes to **74 (patient) / 70 (top gap)**. The frozen contract is the *field separation* (`patient_priority_score` vs `top_gap.gap_priority_score`), not the literal 84/89 — see `api-contracts.md` §3.

## Expected UI content

**Queue card (rank 1):**
```
Maria Chen · 54F · Breast cancer — post-surgical
CRITICAL (74)
Missed oncology follow-up — 27 days past the 45-day window after imaging.
Verify: contact patient and confirm oncology follow-up.
```

**Patient detail — timeline:** 8 events in date order, phase-grouped. The oncology phase contains only the referral (the absent consult is the gap).

**Gaps panel:**
1. Missed oncology follow-up — High — evidence R4 — "Verify: contact patient and confirm oncology follow-up."
2. Metformin monitoring overdue — Med — evidence R1 — "Coordinate: confirm A1c/BMP was drawn or schedule with PCP."
3. Duplicate CBC — Low — evidence R6, R8 — "Review: reconcile the repeat CBC; confirm no clinical indication."

**Evidence drawer (gap 1):**
- Doc R4, Dr. A. Patel — Primary Care, 2026-03-25
- Span: "Referral to Medical Oncology for adjuvant therapy evaluation… Please schedule within 45 days."
- Reasoning: referral exists with a 45-day window (elapsed 2026-05-09); no oncology consult or follow-up event extracted within that window.
- Confidence 0.96, detector `referral_engine_v1`, grounded true.

## The wow line (scene 4)

> "Sarah reviewed Maria's chart for 12 minutes yesterday. She missed that Maria hadn't seen oncology in 45 days after her imaging. Continua found it in 8 seconds."

Both figures in the line are now honest: the referral's window was 45 days and it has been 72 days since the referral (27 past due). "12 minutes" and "8 seconds" are demo-narrative assumptions, labeled as such in the metrics contract (see `api-contracts.md` §8).

## Language discipline (must be enforced in copy and VO)

- Say: "found evidence of an oncology follow-up that appears unresolved and surfaced it for coordinator verification."
- Never say: "the system knows Maria needs oncology treatment" or "the system diagnosed/recommended treatment."
- Actions: verify / contact / review / coordinate. Never order/diagnose/treat.

## Files to generate

- `data/demo-cache/panel.json` (includes Maria as `P-001-maria`)
- `data/demo-cache/records.json` (R1–R8 with stable ids)
- `data/demo-cache/timelines.json`, `gaps.json`, `queue.json`, `impact.json`
- `data/eval-set/ground_truth.json` (includes the 3 Maria gaps)

## Acceptance for the seed case

- Maria appears in `/api/panels/demo/queue` at rank 1 with `priority_band: "CRITICAL"`.
- `/api/patients/P-001-maria/gaps` returns exactly 3 verified gaps (no tamoxifen gap).
- Every evidence item has `span_verified: true`.
- `/api/evidence/{gapId}` for the follow-up gap quotes R4 verbatim.
- `patient_priority_score` is 74 and `top_gap.gap_priority_score` is 70.

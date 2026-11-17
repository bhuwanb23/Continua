# Demo Seed Case — Maria Chen (Continua)

The flagship demo story. Maria is synthetic. All names, providers, and dates are fabricated. No real PHI.

## Why Maria

Her story carries the emotional weight of the oncology vertical and demonstrates all three detectors' credibility in one patient view: a missed oncology follow-up (the wow moment), a duplicate CBC (ROI), and a monitoring gap (safety). She is patient #1 in the coordinator queue.

## Patient

| Field | Value |
|---|---|
| Name | Maria Chen |
| Age / sex | 54 / F |
| Primary diagnosis | Breast cancer — post-surgical (left breast) |
| Risk level (clinical weight) | high |
| Last contact | 2026-04-20 |
| Panel | Oncology demo panel |

## The 7 synthetic records (documents)

Dates are relative to a "today" of **2026-06-05** for the demo.

### R1 — PCP progress note (2026-03-04) — Dr. A. Patel — Primary Care (`note`)

> "54F presents with newly diagnosed invasive ductal carcinoma, left breast. Discussed surgical options. Referred to surgical oncology. Patient anxious but engaged. Plan: lumpectomy with sentinel node biopsy."

### R2 — Surgery / pathology note (2026-03-18) — Dr. A. Patel — Primary Care (`note`)

> "Underwent left lumpectomy with sentinel lymph node biopsy on 2026-03-18. Pathology: invasive ductal carcinoma, 1.8 cm, grade 2, ER+/PR+, HER2-negative, 0/2 nodes positive. Margins clear. Plan: adjuvant radiation and endocrine therapy. Referral to radiation oncology placed."

### R3 — Imaging report (2026-04-18) — Regional Imaging Center — Imaging (`imaging_report`)

> "Bilateral diagnostic mammogram and breast ultrasound. Post-surgical changes left breast. No suspicious mass or recurrence identified. Recommend clinical correlation and oncology follow-up per treating team."

### R4 — Referral to medical oncology (2026-04-18) — Dr. A. Patel — Primary Care (`referral`)

> "Referral to Medical Oncology for post-surgical adjuvant therapy evaluation (endocrine therapy and radiation planning). Please schedule within 45 days. Patient to be contacted by coordinator."

**This is the source of the flagship gap: no oncology consult follows.**

### R5 — Lab result: CBC (2026-04-20) — Metro Lab Services — Lab (`lab_result`)

> "CBC with differential: WBC 5.8, Hgb 12.4, Plt 248. Within normal limits."

### R6 — Lab result: CBC (2026-04-28) — Dr. A. Patel — Primary Care (`lab_result`)

> "Repeat CBC with differential ordered at follow-up visit: WBC 5.9, Hgb 12.5, Plt 251. Within normal limits. No clinical indication for repeat at this interval."

**This is the duplicate test: same normalized test (`cbc`), two providers, 8 days apart, no documented indication.**

### R7 — Medication list update (2026-04-22) — Dr. A. Patel — Primary Care (`med_list`)

> "Started tamoxifen 20 mg daily for ER+ breast cancer. Discussed side effects including VTE risk and need for routine monitoring. Annual gynecologic/oncology follow-up recommended."

No oncology consult occurs within 365 days of the tamoxifen start → the medication monitoring gap (annual oncology follow-up after endocrine therapy start).

## Ground truth (frozen, hidden from the pipeline)

```json
[
  {
    "patient_id": "P-001-maria",
    "type": "missed_followup",
    "source_doc_ids": ["R4"],
    "expected_window_days": 45,
    "notes": "Referral to medical oncology 2026-04-18; no oncology consult within 45 days (today 2026-06-05)."
  },
  {
    "patient_id": "P-001-maria",
    "type": "duplicate_test",
    "source_doc_ids": ["R5", "R6"],
    "expected_window_days": 14,
    "notes": "CBC on 2026-04-20 and 2026-04-28, 8 days apart, two providers, no documented indication."
  },
  {
    "patient_id": "P-001-maria",
    "type": "med_monitoring",
    "source_doc_ids": ["R7"],
    "expected_window_days": 365,
    "notes": "Tamoxifen started 2026-04-22; no oncology follow-up within 365 days to date."
  }
]
```

## Expected extraction (events)

| Event | Date | Type | Provider | Phase |
|---|---|---|---|---|
| New IDC diagnosis, surgical referral | 2026-03-04 | consult (PCP) | Dr. A. Patel | Surgery |
| Lumpectomy + pathology | 2026-03-18 | surgery | Dr. A. Patel | Surgery |
| Post-surgical mammogram/US | 2026-04-18 | imaging | Regional Imaging Center | Radiology |
| Referral to medical oncology | 2026-04-18 | referral (oncology, 45d) | Dr. A. Patel | Oncology |
| CBC | 2026-04-20 | lab_result (cbc) | Metro Lab Services | Labs |
| CBC (repeat) | 2026-04-28 | lab_result (cbc) | Dr. A. Patel | Labs |
| Tamoxifen start | 2026-04-22 | medication_start (tamoxifen) | Dr. A. Patel | Medications |

(Extraction may also emit medication_stop or followup events; only these are required.)

## Expected detection

| # | Type | Severity | Window | Overdue | Evidence |
|---|---|---|---|---|---|
| 1 | missed_followup (oncology) | high | 45 d | 45 d | R4 referral span |
| 2 | duplicate_test (cbc) | med | 14 d | 8 days apart | R5 + R6 spans |
| 3 | med_monitoring (tamoxifen → oncology follow-up) | high | 365 d | n/a (within year) | R7 span |

Note: the tamoxifen rule uses an annual oncology follow-up window; because only ~6 weeks have elapsed, this should be reported as **"due within the year / no follow-up scheduled"** rather than overdue. Severity med, not high, until the window closes. (Rule detail: see gap-rules.md Rule 3 edge cases.)

## Expected priority

- Gap 1: severity 1.0 × overdue 1.75 × conf 0.96 × actionability 1.0 × type 1.0 = **1.68 → 84 CRITICAL**
- Gap 2: severity 0.60 × overdue 1.13 × conf 0.94 × actionability 0.75 × type 0.90 ≈ **0.43 → 22 LOW**
- Gap 3: severity 0.60 × overdue 1.0 × conf 0.93 × actionability 0.95 × type 0.97 ≈ **0.51 → 26 LOW**

Patient priority = 1.68 + 0.10 × (0.43 + 0.51) = **1.774 → 89 CRITICAL** (capped bonus applies). Maria ranks #1 with headline from gap 1.

## Expected UI content

**Queue card (rank 1):**
```
Maria Chen · 54F · Breast cancer — post-surgical
CRITICAL (89)
Missed oncology follow-up — 45 days overdue after imaging.
Verify: contact patient and confirm oncology follow-up.
```

**Patient detail — timeline:** 7 events in order, phase-grouped. The oncology phase contains only the referral (visible absence of a consult).

**Gaps panel:**
1. Missed oncology follow-up — High — evidence R4 — "Verify: contact patient and confirm oncology follow-up."
2. Duplicate CBC — Med — evidence R5, R6 — "Review: reconcile repeat CBC; confirm no clinical indication."
3. Tamoxifen monitoring — Med — evidence R7 — "Coordinate: confirm oncology follow-up is scheduled within the year."

**Evidence drawer (gap 1):**
- Doc R4, Dr. A. Patel — Primary Care, 2026-04-18
- Span: "Referral to Medical Oncology for post-surgical adjuvant therapy evaluation… Please schedule within 45 days."
- Reasoning: referral exists with 45-day window; no oncology consult/followup extracted within window.
- Confidence 0.96, detector `referral_engine_v1`, grounded true.

## The wow line (scene 4)

> "Sarah reviewed Maria's chart for 12 minutes yesterday. She missed that Maria hadn't seen oncology in 45 days after her imaging. Continua found it in 8 seconds."

## Language discipline (must be enforced in copy and VO)

- Say: "found evidence of an oncology follow-up that appears unresolved and surfaced it for coordinator verification."
- Never say: "the system knows Maria needs oncology treatment" or "the system diagnosed/recommended treatment."
- Actions: verify / contact / review / coordinate. Never order/diagnose/treat.

## Files to generate

- `data/demo-cache/panel.json` (includes Maria as P-001-maria)
- `data/demo-cache/records.json` (R1–R7 with stable ids)
- `data/demo-cache/timelines.json`, `gaps.json`, `queue.json`, `impact.json`
- `data/eval-set/ground_truth.json` (includes the 3 Maria gaps)

## Acceptance for the seed case

- Maria appears in `/api/panels/demo/queue` at rank 1.
- `/api/patients/P-001-maria/gaps` returns exactly 3 verified gaps.
- Every evidence item has `span_verified: true`.
- `/api/evidence/{gapId}` for the follow-up gap quotes R4 verbatim.
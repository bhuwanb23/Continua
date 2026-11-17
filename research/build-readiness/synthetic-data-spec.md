# Synthetic Data Spec — Continua

All data is **synthetic and de-identified**. No real PHI. A visible banner states "Synthetic demo data — no real patient information." Names are fabricated; any resemblance to real persons is coincidental.

## Panel composition (80 patients)

| Segment | Count | Notes |
|---|---|---|
| Oncology / high-risk (demo vertical) | 25 | Cancer histories (breast, colorectal, lung, prostate, lymphoma) across treatment phases. |
| Chronic disease (diabetes/HTN/CKD) | 25 | Med-monitoring-heavy; supports monitoring-gap detector. |
| General primary care | 20 | Mix; supports duplicate-test detector. |
| Recent post-surgical / transitional | 10 | Referral-heavy; supports missed-follow-up detector. |
| **Total** | **80** | |

### Demographics

- **Age:** 35–82, skewed older in oncology (median ~58).
- **Sex:** mixed; oncology cohort weighted female (breast) but includes male prostate/colorectal cases.
- **Race/ethnicity:** varied, fabricated; no clinical meaning.
- **Language:** English only.
- **Insurance:** varied (commercial / Medicare / Medicaid) — realism only, never used by any rule.
- **Panel size:** exactly 80. Each patient has 3–12 records (`last_contact_date` within the last 180 days).

## Providers (fabricated, 6)

- Dr. A. Patel — Primary Care (PCP)
- Dr. L. Chen — Oncology
- Dr. M. Rivera — Cardiology
- Dr. S. Okonkwo — Endocrinology
- Regional Imaging Center (radiology)
- Metro Lab Services (lab)
- (Pharmacy entries are structured fields, not a provider doc.)

## Document types

`note` (PCP progress note), `referral` (referral order), `consult` (specialist consult note), `lab_result`, `imaging_report`, `med_list`, `discharge_summary`.

## Record counts (target)

- Total records: ~400–600 across 80 patients (~5–8 per patient).
- Each patient: at least 1 PCP note; oncology patients: surgery/imaging/referral/consult/labs/meds.

## Planted ground-truth gaps (for eval + demo)

Total planted gaps ≈ 80 (to be used as ground truth in `evaluation-spec.md`):

| Gap type | Count | Notes |
|---|---|---|
| Missed specialist follow-up | ~30 | Referral exists; no matching consult/result within window. |
| Duplicate diagnostic test | ~25 | Same normalized test ≥2× within 14 days across ≥1 provider. |
| Medication monitoring gap | ~25 | Med started; expected lab not ordered within window. |
| **Total** | **~80** | A patient may have 0, 1, or 2 gaps. |

The remaining ~60 patients have no planted gaps (true negatives) to allow precision measurement.

## Gap planting rules (to keep detectors honest)

- Missed follow-up: referral event + NO matching consult within window. Window: 30 days general, 45 days oncology.
- Duplicate test: same `test_name_normalized` twice within 14 days by ≥1 distinct provider (or same provider on distinct days). Exclude legitimate serial monitoring (e.g., weekly CBC during chemo) by marking those records `intentional_series: true` in structured fields.
- Monitoring gap: med start + expected lab absent within window (metformin→A1c+BMP within 90 days; warfarin→INR within 7 days; tamoxifen→annual gyn/onc follow-up, etc.).

## Non-gap (distractor) records

Include realistic noise so detectors must discriminate:
- Completed referrals (referral + consult within window) — must NOT flag.
- Legitimate repeat labs (serial monitoring) — must NOT flag.
- Meds with monitoring labs present — must NOT flag.
- Records from multiple providers that look similar but are distinct tests.

## Demo patient (Maria Chen) — see `demo-seed-case.md`

Maria is one of the 25 oncology patients and carries the flagship missed-follow-up gap (45 days post-imaging, no oncology consult). She is planted as patient #1 in the top-5 queue.

## Oncology demo cohort notes

- Cancer journey records: surgery note → pathology → imaging report → referral to oncology → (missing consult) → labs → med list (e.g., tamoxifen/anastrozole) → monitoring gap (missing A1c/BMP or tumor marker).
- At least one oncology patient with a duplicate CBC (10 days apart, two providers).
- At least one oncology patient with a monitoring gap.

## File deliverables

- `data/synthetic/panel.json` — Panel + Patient[].
- `data/synthetic/records.json` — Record[].
- `data/eval-set/ground_truth.json` — `{patient_id, type, source_doc_ids, expected_window}` per planted gap (held out from prompt tuning where feasible).
- `data/demo-cache/*` — cached pipeline outputs for the demo panel.

## Determinism

- UUIDs are seeded/deterministic so caches are stable across runs.
- Generator is a script (`scripts/gen-synthetic.ts`) with a fixed seed; re-running reproduces identical data.
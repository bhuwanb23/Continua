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

**Distribution (Fix 4): 40 patients with ≥1 gap, 40 patients with none, 70 gaps total.** The earlier ~80-gaps-across-~20-patients design put four gaps on each positive chart, which made the benchmark artificially concentrated and flattered precision.

| Gap type | Count | Notes |
|---|---|---|
| Missed specialist follow-up | 28 | Referral exists; no matching consult/result within window. |
| Duplicate diagnostic test | 22 | Same normalized test ≥2× within 14 days across ≥1 provider. |
| Medication monitoring gap | 20 | Med started; expected lab past its window and absent. |
| **Total** | **70** | ~1.75 gaps per positive patient; 22 patients carry exactly 1 gap, 18 carry 2–3. |

| Patient category | Count |
|---|---|
| Positive (≥1 gap) | 40 |
| True negative (no gap) | 40 |

### Required negative and edge-case mix

The set must contain these on purpose — they are where deterministic rules actually fail. (Case counts overlap: one patient may carry two negative patterns; they are distributed across the 40 negative patients.)

- **Completed referrals** (referral + consult inside window) — 10 cases, must not flag.
- **Specialty-mismatch cases** (cardiology referral with only a PCP visit) — 6 cases, must flag and count as TP. These are *positive* patients that look satisfied.
- **Legitimate repeat tests** with `series_status: "explicit_series"` — 8 cases, must not flag.
- **Discontinued medications** before the window closes — 6 cases, must not flag.
- **Not-yet-elapsed monitoring windows** (e.g. a 365-day window 44 days in) — 8 cases, must not flag. This is the class of error that produced the impossible tamoxifen gap in the first draft.
- **Noisy test aliases** ("CBC w/ diff", "Complete Blood Count", "HbA1c", "A1c") — ≥10 events, must normalize correctly.
- **Unrelated / clean charts** with no planted gap — 20 cases, baseline true negatives.

### `series_status` planting

Repeat-test negatives are only legitimate if the *document says so*. Records intended as series must contain explicit text ("Weekly CBC for 6 weeks"), producing `series_status: "explicit_series"`. Duplicates must contain no such statement (`unknown`). No document may require the model to infer intent.

## Gap planting rules (to keep detectors honest)

- Missed follow-up: referral event + NO matching consult within window. Window: 30 days general, 45 days oncology.
- Duplicate test: same `test_name_normalized` twice within 14 days by ≥1 distinct provider (or same provider on distinct days). Legitimate serial monitoring (e.g., weekly CBC during chemo) is excluded only when the record text explicitly says so, producing `series_status: "explicit_series"` — never inferred.
- Monitoring gap: med start + expected lab absent **after** the window has elapsed (metformin→A1c+BMP within 90 days; warfarin→INR within 7 days). Windows that have not yet elapsed must produce no gap (8 such cases exist deliberately). Tamoxifen's 365-day window must never be planted as a gap unless the synthetic timeline actually spans >365 days.

## Non-gap (distractor) records

Include realistic noise so detectors must discriminate:
- Completed referrals (referral + consult within window) — must NOT flag.
- Legitimate repeat labs (serial monitoring) — must NOT flag.
- Meds with monitoring labs present — must NOT flag.
- Records from multiple providers that look similar but are distinct tests.

## Demo patient (Maria Chen) — see `demo-seed-case.md`

Maria is one of the 25 oncology patients and carries the flagship missed-follow-up gap (45 days post-imaging, no oncology consult). She is planted as patient #1 in the top-5 queue.

## Oncology demo cohort notes

- Cancer journey records: surgery note → pathology → imaging report → referral to oncology → (missing consult) → labs → med list (e.g., tamoxifen/anastrozole). Tamoxifen is clinical context; the monitoring gap in oncology charts comes from a comorbidity drug past its window (e.g., metformin→A1c) or a tumor-marker series with an elapsed interval.
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
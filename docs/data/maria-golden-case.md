# Maria golden case — P-001-maria

## Patient

Maria (fictional, 58F). Oncology cohort, high difficulty. Three planted gaps and one tamoxifen context that must **not** be a gap.

## Gap 1 — missed specialist follow-up

- Referral dated 2026-03-25, oncology, window 45 days → due 2026-05-09.
- Evaluation date 2026-06-05 → **27 days overdue**.
- Only a primary-care progress note appears before the due date; no oncology consult.
- Expected `missed_followup`, due date 2026-05-09, 27 days overdue.

## Gap 2 — duplicate test

- CBC drawn 2026-04-20 and again 2026-04-28 (8 days apart).
- Distinct documents and providers; no explicit serial plan.
- Expected `duplicate_test`, 8-day gap.

## Gap 3 — medication monitoring

- Metformin started 2026-02-10, 90-day monitoring window → due 2026-05-11.
- Evaluation date 2026-06-05 → **25 days overdue**.
- No A1c or renal function lab appears.
- Expected `med_monitoring`, due date 2026-05-11, 25 days overdue.

## Not a gap — tamoxifen

- Tamoxifen started 2026-01-01 with a 365-day monitoring window → due 2027-01-01.
- The evaluation date is 2026-06-05, so the window has not elapsed.
- No gap is planted; a system that flags it is wrong.

## Distractors

- A telehealth consult, a copied-forward progress note, and a month-only date (partial precision) must not create false gaps.
- Ground truth for Maria is in `ground_truth.json` (patient `P-001-maria`).

## Verification

`tests/dataset/maria.test.ts` asserts the patient, the three gaps, the due dates, the overdue counts, and the tamoxifen non-gap.

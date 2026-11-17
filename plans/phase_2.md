# Phase 2 — Synthetic Healthcare Dataset

> Depends on: Phase 1 · Unblocks: Phase 3, 5, 6
> Gate: **data validation passes and every planted scenario is human-explainable**

## Objective

Produce the frozen 80-patient panel that the entire project is measured against. This is more important than any frontend work: if the data is easy, the detectors look brilliant and mean nothing.

## Sub-phases

### 2.1 Population design (80 patients)

| Segment | Count |
|---|---|
| Oncology / high-risk (demo vertical) | 25 |
| Chronic disease (diabetes / HTN / CKD) | 25 |
| General primary care | 20 |
| Post-surgical / transitional | 10 |

- Demographics: ages 35–82, mixed sex, fabricated names, varied insurance (never used by logic).
- `last_contact_date` within 180 days of the demo date.
- 3–12 records per patient.

**Anti-overfit requirement:** at least 55 of 80 patients must be non-oncology, so the engine cannot be tuned to Maria.

### 2.2 Record generation (400–600 documents)

Seven doc types, realistic messiness:

- PCP progress notes, referral notes, specialist consult notes, imaging reports, lab results, medication lists, discharge summaries.
- Free text must carry the evidence (not only structured fields).
- Six fabricated providers with distinct note styles (terse vs verbose, abbreviations vs full terms).
- Messiness features: inconsistent test aliases ("CBC w/ diff" / "Complete Blood Count"), mixed date formats in raw text, dose strings attached to drug names, occasional duplicated documents.

### 2.3 Plant positives (~70 gaps)

| Gap type | Count | Planting rule |
|---|---|---|
| Missed specialist follow-up | 28 | Referral + no same-specialty consult inside window (30 d general, 45 d oncology) |
| Duplicate diagnostic test | 22 | Same normalized test twice within 14 days across ≥1 provider |
| Medication monitoring | 20 | Med start + expected lab absent **after** window elapsed |

Distribution: 22 patients with exactly 1 gap, 18 with 2–3 gaps → 40 positive patients.

### 2.4 Build hard negatives (the actual test)

Required mix — see `evaluation-spec.md` for the full table:

- Completed referrals inside the window (10 cases) — must not flag.
- Legitimate repeated tests with `explicit_series` text (8) — must not flag.
- Medications discontinued before the window closed (6) — must not flag.
- Not-yet-elapsed monitoring windows (8) — must not flag (the Phase 0 bug class).
- Clean charts with nothing wrong (20).
- Positive traps: cardiology referral satisfied only by a PCP visit (6) — **must** flag.

### 2.5 Maria's demo chart

Generate R1–R8 exactly as specified in `demo-seed-case.md`:

- R1 metformin start (2026-02-10), R2 diagnosis, R3 surgery/pathology, R4 oncology referral (2026-03-25), R5 imaging (2026-04-18), R6 CBC (2026-04-20), R7 tamoxifen (2026-04-22), R8 CBC repeat (2026-04-28).

Do not "improve" these dates. Every downstream number (27 days overdue, scores 70/74) depends on them.

### 2.6 Generator + seed freeze

- `scripts/gen-synthetic.ts` with a fixed seed in `scripts/config.ts`.
- Deterministic UUIDs derived from (patient, doc, type, date).
- Emits `data/synthetic/panel.json` and `data/synthetic/records.json`.
- Re-running twice produces byte-identical files (Phase 1 harness confirms).

### 2.7 Data validation

- `scripts/validate-data.ts` asserts: 80 patients, 400–600 records, 40/40 positive/negative, 70 planted gaps at 28/22/20, every record has a provider + date + doc_type + text, no real-looking PHI patterns (SSN, phone, email, real hospital names).
- Every planted gap resolves to at least one document id that exists.

## Deliverables

| Artifact | Contents |
|---|---|
| `data/synthetic/panel.json` | Panel + 80 patients |
| `data/synthetic/records.json` | ~400–600 records (R1–R8 for Maria) |
| `data/synthetic/planted-manifest.json` | Machine-readable list of planted gaps with their doc ids (input to Phase 3) |
| `scripts/gen-synthetic.ts` | seeded generator |
| `scripts/validate-data.ts` | invariant checks |

## Gate — exit criteria

- [ ] Data validation script exits 0.
- [ ] Counts exact: 80 patients, 40 positive / 40 negative, 70 gaps (28/22/20).
- [ ] Every planted gap is explainable by a human reading only the documents.
- [ ] Hard negatives exist in every required category.
- [ ] Maria's 8 records match the seed case dates verbatim.
- [ ] Two consecutive generations are byte-identical.
- [ ] No PHI-like strings anywhere.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Dataset too clean (all referrals obviously missing) | Mix note verbosity; bury the absence inside long documents |
| Dataset too hard (undetectable from text) | Every planted gap must be defensible from the text alone |
| Unintentional extra gaps | Validation flags "unexplained gaps" a human reviewer spots; either label them or fix the record |
| Overfitting to Maria | 55+ non-oncology patients; no oncology-specific detector code |

## Handoff to Phase 3

`planted-manifest.json` is the **only** input to ground-truth authoring. Ground truth must be written from the manifest and the documents — never from detector output.

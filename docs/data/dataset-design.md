# Dataset design — continua-synth-v1

## Purpose

A deterministic, messy, adversarial synthetic healthcare world for developing and evaluating continuity-gap detection. It is **not** a population sample and **not** clinical evidence.

## Five layers

```
L1 Patient profiles
  ↓
L2 Care-journey scenarios
  ↓
L3 Clinical events (canonical truth)
  ↓
L4 Source documents (messy rendering)
  ↓
L5 Ground-truth manifest
```

Documents are rendered **from** a truthful event world. They are never generated first and labelled afterwards.

## Determinism

- Seed: `20261117`.
- All randomness goes through the Phase 1 seeded source (mulberry32); no `Math.random()` in the generator.
- No system clock: the evaluation date is `2026-06-05`.
- IDs are SHA-256 → UUID v5-shaped, derived from stable inputs (`lib/ids`).
- Human fixture keys (`P-001-maria`, `DOC-P001-REQ-01`, `PROV-ONC-01`) are separate from machine UUIDs.
- Output is canonicalized (sorted keys, sorted arrays) and hashed.

## Cohorts

| Cohort | Patients |
|---|---|
| Oncology | 32 |
| Cardio / medical specialty | 16 |
| Chronic metabolic | 16 |
| Mixed multispecialty | 16 |

## Providers

26 fictional providers across primary care, oncology, cardiology, endocrinology, surgery, laboratory, imaging, and pharmacy. Organizations are invented (`Northlake Primary Care`, `Cedar Ridge Imaging`, `Metro Lab Services`, …). No real health system is used.

## Gap distribution

| Type | Planted |
|---|---|
| Missed specialist follow-up | 26 |
| Duplicate test | 20 |
| Medication monitoring | 20 |
| **Total** | **66** |

42 patients have at least one gap; 38 have none. No symmetry forcing.

## Scenario grammar

Each patient receives a small set of scenario templates (T01–T06) plus optional adversarial cases (HN-01–HN-15). The templates decide the truth; the renderer only expresses it. See `scenario-catalog.md`.

## Documents

- ~485 documents, 5–13 per patient.
- Length bands: ~25% short (50–149 words), ~55% medium (150–400), ~20% long (401–800).
- Templates: progress notes (3), referrals (3), labs (3), imaging (3), medication records (2), consults (3), phone notes (2), surgical summary.
- Controlled messiness: test aliases, provider-name variants, date-format variation, abbreviations, copied-forward prose, telehealth terminology.
- Padding uses neutral administrative sentences only; it never introduces a referral, medication start, lab result, or specialty consult.

## Labels

- `data/eval-set/continua-eval-v1/ground_truth.json` — planted gaps, derived from scenarios.
- `negative_manifest.json` — every declared no-gap case and the safeguard it tests.
- `extraction_gold.json` — 130 labelled events across 12 patients for Phase 5.
- `data/generator/truth-events/truth-events.json` — generation-time event world.

**Runtime must not import any of these.** `scripts/check-leakage.ts` enforces the boundary.

## Pipeline

```
config → seed → providers → patients → scenario plan → truth events
→ documents → messiness → padding → labels → validation → safety scan
→ canonical sort → SHA-256 → freeze
```

## Reproducibility

`npm run generate:data` regenerates every file. Two runs produce the same `content_hash`; CI regenerates and fails on any diff.

# CONTINUA-SYNTH-V1 — Dataset Characterization

> Generated from the frozen corpus. Numbers are populated from the files, not hand-written.

## Exit benchmark report

| Metric | Value |
|---|---|
| Patients | 80 |
| Providers | 26 |
| Documents | 485 |
| Positive patients | 42 |
| Negative patients | 38 |
| Ground-truth gaps | 66 |
| Missed follow-up | 26 |
| Duplicate test | 20 |
| Medication monitoring | 20 |
| Hard-negative families | 13 |
| Negative instances | 35 |
| Extraction-gold patients | 12 |
| Extraction-gold events | 130 |
| Dangling references | 0 |
| Known PHI | 0 |
| Runtime label leakage | 0 |

```
content_hash: 1790307189c34963df03b327ae2744cad03fbb0c5b63d1db43723ac8ff4e2d6e
```

## Cohorts

| Cohort | Patients |
|---|---|
| cardio | 16 |
| metabolic | 16 |
| mixed | 16 |
| oncology | 32 |

## Difficulty

| Level | Patients |
|---|---|
| EASY | 26 |
| HARD | 27 |
| MEDIUM | 27 |

## Document types

| Type | Count |
|---|---|
| consult_note | 135 |
| discharge_summary | 1 |
| followup | 105 |
| imaging_report | 15 |
| lab_report | 160 |
| medication_list | 32 |
| referral | 37 |

## Document length bands

| Band | Count |
|---|---|
| short (50–149 words) | 120 |
| medium (150–400 words) | 267 |
| long (401–800 words) | 98 |

## Providers by specialty

| Specialty | Count |
|---|---|
| cardiology | 3 |
| endocrinology | 2 |
| imaging | 3 |
| laboratory | 3 |
| oncology | 4 |
| pharmacy | 2 |
| primary_care | 6 |
| surgery | 3 |

## Age and sex

Age range: 36–79. Sex distribution: {"F":40,"M":40}.

## Negative families

- HN-01
- HN-03
- HN-04
- HN-05
- HN-06
- HN-07
- HN-08
- HN-09
- HN-10
- HN-12
- HN-13
- HN-14
- HN-15

## File hashes

- `extraction_gold_sha256`: `d74e758c32f5499235aa47145ff06f858ca0dcc411a1385ca833ac1624bec284`
- `ground_truth_sha256`: `3a0deb04396a9c6a51208d56c04a59c878fb7199d58cbe7e8cc4b338a5f1a5f2`
- `negative_manifest_sha256`: `9b72b523728fced7bb901c6a99523b76d3301d0dfba8e07dbde051095f5990a9`
- `patients_sha256`: `f49c940554418601e6ed209acc7d0b69d0bbb99115dabd030567afaa6b13b87e`
- `providers_sha256`: `a5cd160ddbc23814dcc06d2b91b7dee51bab34316c2bd4db36d05696c1615049`
- `records_sha256`: `0708eee737944039f92ea256b56ba2d43b49203bf55af443cfe53974fc736a06`
- `truth_events_sha256`: `309e6ec53e375e2f714dff83b5c654fa9f7231097ca1c1dce6b6032b49d05b8a`

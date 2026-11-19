# Grounding Metrics

Generated from actual Phase 7 artifacts. No hypothetical values.

## Oracle final partition

- Input candidate gaps: **41**
- Verified gaps: **41**
- Suppressed gaps: **0**
- Verification rate: **100.0%**
- Suppression rate: **0.0%**

### Source integrity

- Positive source items: **50**
- Valid source documents: **50 / 50**
- Correct patient ownership: **50 / 50**
- Verified required spans: **50 / 50**
- Exact spans: **50**
- Fuzzy spans: **0**

### Claims

- Required claims: **245**
- Supported claims: **245**
- Unsupported displayed claims: **0**
- Claim coverage: **100.0%**

### Absence and policy

- Absence queries evaluated: **54**
- Valid absence checks: **54**
- Contradicted/stale absence checks: **0**
- Policy items verified: **41 / 41**

### Performance and corruption

- Verification p50 per gap: **0.7317 ms**
- Verification p95 per gap: **3.0145 ms**
- Full 41-gap panel p50: **59.2604 ms**
- Full 41-gap panel p95: **61.3154 ms**
- Corrupted critical evidence cases: **41**
- Corrupted cases rejected: **41 / 41**
- Corrupted cases accepted: **0**

## Other measured sets

- Oracle all: **66 / 66** verified, **0** suppressed
- Maria: **3 / 3** verified, **0** suppressed
- Extracted fixture: **41 / 41** verified, **0** suppressed

The extracted run uses the local extractor-v1 fixture store. It validates the extraction → canonical store → detector → evidence pipeline, not live model quality.

## Candidate vs verified

Final-partition detection metrics are unchanged before and after evidence gating:

| Stage | Micro F1 | Hard-negative pass |
|---|---:|---:|
| Candidate gaps | 1.00 | 29/29 |
| Verified gaps | 1.00 | 29/29 |

No over-suppression occurred on the valid oracle corpus. Corrupted evidence was rejected independently.

## Metric definitions

- **Grounding-correct**: all required documents exist, belong to the patient, required spans verify, critical fields are supported, absence queries are valid, and policy version/rule/provenance matches.
- **Unsupported claim rate**: unsupported required claims among displayed gaps. Target and measured value: **0**.
- **Suppression rate**: suppressed candidates / input candidates.

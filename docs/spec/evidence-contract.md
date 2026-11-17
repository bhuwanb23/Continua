# Evidence Contract — Continua Spec v1.0

> Every surfaced gap must carry verifiable evidence. Ungrounded claims are suppressed, never displayed. Resolves C-013, C-014, C-024.

## 1. Naming by layer (frozen)

| Layer | Field | Meaning |
|---|---|---|
| Event | `source_span` | verbatim quoted span from the source doc (≤300 chars) |
| Gap evidence | `quoted_span` | verbatim quoted span cited by the detector |
| API (evidence deep-dive) | `source_text_excerpt` | parent-document context around the span |
| API | `span_verified` | boolean, whether the span matched |
| API | `verification_score` | 1.0 (verbatim) / 0.6 (fuzzy 0.85–0.99) / dropped (<0.85) |

No other span field names are permitted.

## 2. Evidence entry shape

```json
{
  "doc_id": "uuid",
  "provider": "string",
  "provider_type": "pcp | specialist | lab | imaging | pharmacy | other",
  "date": "YYYY-MM-DD",
  "quoted_span": "string",
  "span_verified": true,
  "verification_score": 1.0,
  "source_text_excerpt": "string (parent doc context, optional)",
  "event_id": "uuid"
}
```

## 3. Verification levels

### Level A — verbatim (score 1.0)

`quoted_span` is an exact substring of the source document text (after whitespace normalization). The gap is grounded.

### Level B — fuzzy (score 0.6)

`quoted_span` matches the source document with a fuzzy similarity ≥ 0.85 and < 1.0 (e.g., minor punctuation/casing differences). The gap survives but is flagged `verification_score: 0.6`, which caps the priority band at MEDIUM (see `priority-engine.md`).

### Suppression (< 0.85)

If the best match is < 0.85, the candidate gap is **dropped** and counted as a false negative in eval. It is never displayed. It is logged as ungrounded with the attempted span and the best match score.

## 4. Suppression rule (hard)

- A gap with `grounded: false` must never reach the API or UI.
- The API returns 404 `gap_not_grounded` if a gap exists but failed verification.
- `grounded` is computed in Stage E and is immutable afterwards.

## 5. Evidence requirements per gap

- Every gap must cite ≥1 evidence entry.
- Every `doc_id` must exist in the patient's records.
- Every `quoted_span` must be ≤300 chars.
- "Absence is evidence" (missed follow-up: no matching consult) is stated as a note in `reasoning`, not fabricated as a citation. The referral span is the citation.

## 6. Confidence decomposition (C-023, C-024)

Three distinct values, never conflated:

| Value | Layer | Definition |
|---|---|---|
| `extraction_confidence` | extraction (top-level + per-event `confidence`) | LLM extraction confidence |
| `verification_score` | evidence | span match quality (1.0 / 0.6 / dropped) |
| `evidence_confidence` | priority | `extraction_confidence × verification_score` |

Gap payload `confidence` = `evidence_confidence`. The API exposes it as `confidence` (gap) and as `confidence` (evidence deep-dive, where it equals the gap's `evidence_confidence`).

## 7. Deep-dive endpoint (`/api/evidence/{gapId}`)

Returns `items[]` (one per evidence entry) plus `reasoning` (plain-language, grounded) and `confidence` (= gap `evidence_confidence`). Returns 404 if the gap is not found or not grounded.
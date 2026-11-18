# Matching Rules — continua-eval-v1

Matching is deterministic, versioned (`v2`), and one-to-one. The evaluator consumes the prediction contract in `lib/evaluation/types.ts` and never reads UI state.

## Prediction contract

A gap prediction declares:

```json
{
  "prediction_id": "uuid",
  "patient_id": "uuid",
  "gap_type": "missed_followup | duplicate_test | med_monitoring",
  "trigger_event_ids": ["uuid"],
  "identity": { "specialty": "oncology" },
  "evidence": [{ "doc_id": "uuid", "quoted_span": "..." }],
  "detector_version": "gaps-v1"
}
```

Optional ranking fields: `window_days`, `due_date`, `confidence`, `priority_band`, `gap_priority_score`, `overdue_days`.

## Pair eligibility

A prediction is eligible to match a truth gap only if **all** hold:

1. `patient_id` is exactly equal.
2. `gap_type` is exactly equal after enum normalization.
3. Every identity field present on the truth side matches the prediction.
4. At least one acceptable truth evidence document is cited as prediction evidence.
5. If both sides declare due dates, they are within the frozen temporal tolerance (default 0 days).

Identity fields compared when present:

- missed follow-up: `specialty`;
- duplicate test: `test`/`test_name`, or `modality` + `body_region`;
- medication monitoring: `drug`/`medication` + `monitoring_target`;
- optional: `procedure`.

Values are lower-cased, trimmed, and whitespace/hyphen normalized before comparison. A correct gap type with the wrong specialty or wrong occurrence is not a true positive.

## Evidence overlap

Truth has two evidence sets:

- `required_evidence_doc_ids` — documents without which the truth cannot be explained (normally the trigger document).
- `acceptable_evidence_doc_ids` — the full acceptable set (for duplicates, both documents).

Matching requires at least one acceptable document. Extra valid cited documents are allowed. Citing only an unrelated document fails matching and grounding.

## One-to-one assignment

1. Build every eligible truth × prediction pair.
2. Score each pair by evidence overlap first, trigger overlap second, and temporal proximity as a penalty.
3. Sort by score descending, then truth id, then prediction id.
4. Greedily assign each truth and each prediction at most once.

Consequences:

- Two predictions for one truth produce one TP and one FP.
- One prediction cannot satisfy two planted gaps.
- List order never determines assignment.
- Unmatched predictions are false positives; unmatched truth gaps are false negatives.

A duplicate prediction is a false positive and is tagged `duplicate_prediction_ids` for error analysis.

## Extraction matching

Gold events and extraction predictions are matched one-to-one by:

- patient,
- event type,
- date compatibility (exact day, or same month if either side declares month precision),
- score bonuses for matching normalized fields, source document, and evidence span.

After matching, date accuracy, normalization accuracy, source attribution, and span support are scored separately. A wrong source document does not silently become a missing event; it is scored as wrong attribution.

## No partial credit for identity

There is no partial match on specialty, drug, test, modality, or body region. The benchmark deliberately prevents breadth-first spamming from earning recall.

# Extraction model selection — decision matrix (FROZEN)

Status: weights frozen **before** any live model comparison, per Phase 5 §5.6x.
Changing weights after seeing results is not permitted; a change requires a new
versioned revision with justification recorded here.

## Candidates

- Model A: primary OpenRouter model (chosen at run time via `LLM_MODEL`).
- Model B: cheaper/faster OpenRouter alternative.
- Optional third: Ollama (local) or Gemini, behind the same provider abstraction.

All candidates run the identical pipeline: `extraction-prompt-v1`,
`candidate-event-v1`, `normalization-v1`, `clinical-event-v1.1`,
`reconciliation-v1`, temperature 0, retry ≤3. Only the model varies.

## Weights (sum = 1.00)

| Dimension | Weight | Measurement |
| --- | --- | --- |
| Event F1 | 0.30 | Frozen Phase 3 matcher on dev gold (`eval-extraction`, run-scoped) |
| Source attribution accuracy | 0.20 | `source_attribution_accuracy` (matched events citing the gold document) |
| Normalization accuracy | 0.15 | `normalization_accuracy` over truth-declared fields |
| Citation validity / provenance | 0.10 | Accepted-event span support (exact + fuzzy ≥0.85); target 1.00 |
| Hallucinated-event rate | 0.10 | Unmatched predictions / predicted events, lower is better |
| Latency | 0.10 | Live document p50/p95 (cached runs excluded from latency claims) |
| Cost | 0.05 | Measured tokens × provider price book; null until measured |

## Scoring rules

- Each dimension is normalized to [0, 1] across candidates; hallucination and
  latency/cost are inverted (lower raw value → higher score).
- Provenance/safety outranks F1 (§5.71): any candidate with citation validity
  below 1.00 on accepted events is disqualified regardless of composite score.
- Metrics come only from measured dev runs (`artifacts/extraction/<run-id>/`);
  fixture-derived numbers are plumbing proof and never enter this matrix.
- The held-out final partition is run exactly once, for the selected model,
  after the ADR is written. No tuning on final.

## Decision record

The measured comparison table, choice, and fallback are recorded in
`docs/decisions/ADR-007-extraction-model-selection.md` after the dev runs.
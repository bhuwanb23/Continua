# Phase 7 — Evidence & Trust Layer

> Depends on: Phase 6 (candidate gaps) · Unblocks: Phase 8, 11
> Gate: **100% citation validity for every surfaced gap**

## Objective

Make the equation real for every claim:

```
Claim → Evidence → Source document → Exact span
```

A gap that cannot be grounded does not exist. This is the phase that answers *"how do you know it's true?"* with a click, not a promise.

## Sub-phases

### 7.1 Verifier

`lib/evidence/verify.ts` — for each candidate gap:

- Every `evidence[].doc_id` resolves to a record belonging to the patient.
- Every `quoted_span` is a verbatim or fuzzy (≥0.85) substring of that record's text.
- Compute `verification_score` per item and an aggregate.
- Set `grounded: true` only if **all** items pass.

Failure handling: drop the gap (never display), increment `ungrounded_dropped`, and record it in the eval as a false negative rather than a silent pass.

### 7.2 Rationale and provenance metadata

Every reported gap carries:

- `detector` id + version (e.g. `referral_engine_v1`)
- `rationale` — one deterministic sentence per gap type, e.g. *"Referral to oncology exists with a 45-day window; no same-specialty consult extracted within it."*
- `confidence` — extraction confidence × verification score
- `evidence[]` with provider, date, doc_type, span, verification score

Nothing may be reported with an empty `evidence` array.

### 7.3 Evidence retrieval endpoint shape

`GET /api/evidence/{gapId}` returns the deep-dive payload frozen in `api-contracts.md` §7, including `reasoning`, per-item `span_verified`, and a `source_text_excerpt` with surrounding context for the drawer.

### 7.4 Explanation layer (LLM, constrained)

- The LLM writes plain-language "why" and "recommended action" **from the verified gap object only**.
- It receives structured fields + quoted spans; it does not receive the full record set.
- Output constrained to: verify / contact / review / coordinate / confirm / reconcile.
- If the model's text introduces a number not present in the input, the layer falls back to the deterministic rationale template.

**Rule:** explanation never invents facts, and never upgrades a "possible" to a "confirmed."

### 7.5 Suppression tests

- Fabricated doc id → gap dropped.
- Real doc id + fabricated span → gap dropped.
- Valid evidence + LLM explanation containing "order a CT" → explanation replaced by template.
- Gap with zero evidence items → never emitted.

## Deliverables

| Artifact | Purpose |
|---|---|
| `lib/evidence/verify.ts` | grounding verifier |
| `lib/evidence/rationale.ts` | deterministic rationale templates per gap type |
| `lib/evidence/explain.ts` | constrained explanation layer + fallback |
| `tests/evidence/*.test.ts` | suppression + validity suites |

## Gate — exit criteria

- [ ] 100% of surfaced gaps have ≥1 verified evidence item (measured on the full panel).
- [ ] Fabricated-doc and fabricated-span tests both drop the gap.
- [ ] LLM action-language violation triggers template fallback (test with a deliberately bad mock response).
- [ ] `ungrounded_dropped` count is exposed and non-negative (never hidden).
- [ ] Evidence drawer payload contains everything a judge needs: provider, date, span, verification score, rationale.
- [ ] No gap is ever rendered before passing the verifier.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Verification "passing" by fuzzy-matching everything | 0.85 threshold with normalized whitespace; test against a near-miss fabrication |
| LLM explanation quietly adding clinical advice | Output restricted to an action verb allowlist; fallback to template |
| Dropping gaps silently | Drop counter + log entry, and eval counts them as FN |
| Showing evidence only on a detail page | Evidence chips on the queue/patient view too; drawer is the deep dive |

## Handoff to Phase 8

Phase 8 ranks only verified gaps. If it ever ranks an ungrounded candidate, that is a P0 bug.

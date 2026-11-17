# Phase 14 — Impact & Evaluation Experience

> Depends on: Phase 9 (measured eval), Phase 13 (flagship) · Unblocks: Phase 15
> Gate: **every displayed number traces to a measured or labeled-modeled source**

## Objective

Show business value and technical value without blurring them. A judge should be able to tell, at a glance, what was measured and what was assumed.

## Sub-phases

### 14.1 Two separate categories on screen

**Observed technical results** (from `eval.json`)

- Macro F1, per-type precision/recall/F1.
- Grounding accuracy (citation validity %).
- Panel processing latency (p50 / p95).
- Hard-negative pass rate.

**Modeled operational impact** (from `metrics.json` → `modeled`)

- 80-patient panel.
- Assumed manual review: 12 min/patient (`baseline_type: scenario_assumption`).
- Potential coordinator hours redirected: modeled, with formula shown.

### 14.2 Visual separation

- Two distinct panels with different headers: "Measured on continua-eval-v1" vs "Modeled — scenario assumptions".
- Every number carries a small source chip: `measured` / `assumption` / `modeled`.
- No combined "we save 15 hours" headline anywhere.

### 14.3 Impact screen content

| Block | Content |
|---|---|
| Panel counts | 80 reviewed, N flagged, gaps by type (measured) |
| Time | baseline assumption, measured synthesis latency, modeled savings (labeled) |
| Caught gaps | referrals recovered, duplicates avoided, monitoring gaps caught (counted from the demo actions) |
| Benchmark | link/teaser to the eval screen |

### 14.4 Eval screen

- Per-type table with actual numbers and TP/FP/FN.
- Grounding accuracy + unsupported-claim rate.
- Extraction accuracy.
- Latency.
- A footer stating: synthetic benchmark, no clinical validation, `status: measured | not_run`.
- If `not_run`, the screen says so plainly — never shows zeros as if they were results.

### 14.5 Claim audit

- `docs/CLAIMS.md` — every claim made in the UI, README, video, or pitch mapped to its source (measured value, assumption, or modeled calculation).
- Any claim without a source is removed or downgraded.

## Deliverables

| Artifact | Purpose |
|---|---|
| `app/impact/page.tsx` | impact screen |
| `app/eval/page.tsx` (or dev route) | benchmark screen |
| `components/metric-source-chip.tsx` | measured/assumption/modeled labels |
| `docs/CLAIMS.md` | claim → source map |

## Gate — exit criteria

- [ ] Impact screen shows baseline, measured, and modeled as separate labeled values.
- [ ] No screen merges them into a single savings claim.
- [ ] Eval screen renders actual numbers from `eval.json` (or an explicit `not_run`).
- [ ] `docs/CLAIMS.md` covers every numeric claim in the product surface.
- [ ] A reviewer can point at any number and name its source in one step.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Big "15 hours saved" hero number | Forbidden; modeled savings appear in a labeled block only |
| Eval screen with zeros before a run | `not_run` state instead of zeros |
| Claims in the video diverging from the app | CLAIMS.md is the single list; video copy drawn from it |

## Handoff to Phase 15

Phase 15 hardens the safety and responsibility boundaries across UI, API, and docs.

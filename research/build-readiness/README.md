# Build Readiness Package — Continua

> Stage status: Research ✅ · Define ✅ · Refine ✅ · Ideation ✅ · Architecture & Product Planning ✅ (locked, with 4 review corrections) · **Build Readiness ✅ (this folder)** · Implementation ⏳

These are **implementation assets only** — no new features, no redesign. They freeze interfaces so implementation can proceed directly. Architecture corrections applied:

1. No fake Epic/EHR integration — MVP is synthetic-only; production path is FHIR/HL7 (roadmap).
2. Eval harness is P0 (Must Have).
3. Hybrid pipeline: LLM extracts structured events; deterministic rules detect gaps; LLM explains.
4. "Intervention priority" (explainable formula), not a validated clinical risk score. Human in the loop. Actions are verify/contact/review/coordinate.

## Files

| File | Asset |
|---|---|
| `synthetic-data-spec.md` | Exact 80-patient dataset design (demographics, encounters, providers, documents, oncology demo patient, planted ground-truth gaps). |
| `clinical-event-schema.md` | Exact structured JSON schema emitted by extraction (event types, dates, provider, meds, labs, referrals, evidence/source ids, confidence). |
| `gap-rules.md` | Exact deterministic detection logic for the 3 gap types, with edge cases and false-positive protections. |
| `priority-engine.md` | Explainable intervention priority formula (not a clinical risk score). |
| `evaluation-spec.md` | Frozen ground truth + metrics (precision/recall/F1, macro F1, grounding, extraction accuracy, latency). No fabricated results. |
| `api-contracts.md` | Exact request/response contracts for patients, timeline, gaps, queue, evidence, metrics. |
| `demo-seed-case.md` | Complete Maria oncology demo story: 5–8 synthetic records, hidden gaps, expected timeline/detection/evidence/action. |
| `acceptance-tests.md` | Given/When/Then acceptance tests for every P0 feature. |

## Corrections applied to the architecture docs

| Correction | Where applied |
|---|---|
| No fake Epic integration; synthetic-only MVP; FHIR/HL7 as roadmap | `architecture/prd.md` §5, `architecture/ai-pipeline.md` "Data & integration stance", `architecture/out-of-scope.md` #13 |
| Eval harness promoted to Must Have (P0) | `architecture/mvp-features.md` #12, `architecture/prd.md` FR-10, `evaluation-spec.md` |
| Hybrid: LLM extracts, deterministic rules detect, LLM explains | `architecture/ai-pipeline.md` (rewritten), `gap-rules.md`, `clinical-event-schema.md` |
| Intervention priority (explainable), not clinical risk score | `architecture/prd.md` FR-4, `architecture/ux-flow.md` badges, `priority-engine.md` |
| Human in the loop; verify/contact/review/coordinate actions | `gap-rules.md`, `acceptance-tests.md` AT-10.x, `demo-seed-case.md` |

## Frozen pipeline (do not deviate)

```
Documents
  → LLM structured extraction
  → normalized events
  → deterministic gap detection
  → evidence verification
  → intervention prioritization
  → LLM/plain-language explanation
  → UI
```

LLM must NOT independently decide clinical gaps when deterministic evidence can establish them. All records synthetic/de-identified. No real PHI. No fake Epic integration. No autonomous diagnosis/treatment. Human coordinator is final decision-maker. Recommended actions: verify / contact / review / coordinate (never order/diagnose/treat).
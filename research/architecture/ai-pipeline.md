# AI Pipeline Architecture — Continua

## Stack (locked skeleton + decisions)

- **Frontend:** Next.js (App Router) + Tailwind CSS — Vercel deploy.
- **Backend:** Next.js Route Handlers (serverless) — one repo, one deploy.
- **DB/Storage:** Supabase (Postgres) for patients/records/gaps; local JSON fallback for offline demo.
- **LLM:** OpenAI (gpt-4o-mini for extraction/summarization, gpt-4o for explanation) OR Anthropic Claude — pick one; abstraction layer so it's swappable. Recommendation: **OpenAI gpt-4o-mini** for cost/latency; escalate to gpt-4o for explanation if budget allows.
- **Cache:** Pre-computed LLM outputs for the demo panel stored as JSON in repo (`data/demo-cache/`); served instantly. Live calls only for custom uploads.

## Data & integration stance (important)

- **MVP ingestion is synthetic only.** Continua runs on synthetic cross-provider records. No real PHI, no EHR connection, no fake Epic integration.
- **Production path (not built):** standards-based EHR feeds (FHIR R4 / HL7). Mentioned in pitch as the roadmap, never implied as implemented. Transparency here is a credibility asset, not a weakness.
- **Human in the loop:** Continua surfaces gaps for coordinator verification. It never diagnoses, treats, or orders. Recommended actions are "verify / contact / review / coordinate," never unsupervised clinical orders.

## High-level data flow (hybrid: LLM extracts, rules decide)

```
[Synthetic cross-provider records (documents)]
        ↓
[Ingestion: normalize docs, providers, dates]          (deterministic)
        ↓
[Structured Extraction]                               (LLM)
        ↓
[Normalized Clinical Event Store]                     (deterministic)
        ↓
┌───────────────┼───────────────┐
▼               ▼               ▼
Referral        Duplicate       Medication
Engine (rules)  Engine (rules)  Monitoring Engine (rules)
└───────────────┼───────────────┘
        ↓
[Evidence Verification]                               (deterministic)
        ↓
[Intervention Priority Engine]                        (deterministic, explainable formula)
        ↓
[Explanation Generation]                              (LLM — plain language, grounded)
        ↓
[UI: Coordinator Queue / Patient Journey / Evidence]
        ↓
[Eval harness (P0): precision/recall/F1/grounding vs. frozen ground truth]
```

**Why hybrid:** gap decisions are computed from normalized evidence using deterministic rules. The LLM never independently decides a clinical gap when deterministic evidence can establish it. This is the answer to "how do you prevent hallucinations?" — not careful prompting, but architecture.

## Stage details

### Stage A — Ingestion (deterministic)

- Input: array of records `{patient_id, provider, provider_type, date, doc_type, text, structured?}`.
- Normalize: parse dates (ISO), normalize provider names, normalize test names (alias map: "CBC" = "Complete Blood Count"), normalize drug names (lowercase, strip dose).
- Persist: `patients`, `records` tables (see data-schema.md).
- Synthetic data generator (dev script) produces the 80-patient oncology panel with planted gaps.

### Stage B — Structured extraction (LLM)

- LLM call per patient: given all records, extract a list of **normalized clinical events** `{event_id, date, event_type, description, provider, source_doc_id, confidence, ...typed fields}`.
- Event types: `surgery, imaging, consult, lab_result, medication_start, medication_stop, referral, followup`.
- Typed fields per type (see clinical-event-schema.md): referral → `{specialty, reason, expected_window_days}`; lab → `{test_name_normalized, value?, unit?}`; medication → `{drug_normalized, dose?, start_date}`.
- **Grounding:** every event must include `source_doc_id`; post-validate that the id exists. Drop events without valid source.
- Temperature 0.1; structured JSON output; retry on parse failure.

### Stage C — Normalized event store (deterministic)

- Deduplicate events, sort by date, assign phases for UI grouping.
- This store is the single source of truth for all downstream detectors. Detectors read events, never raw text.

### Stage D — Gap detection (deterministic rules, 3 detectors)

Rules consume normalized events. The LLM is NOT involved in deciding whether a gap exists.

1. **Missed specialist follow-up**
   - Rule: for each referral event, check whether a matching consult/visit/result event exists within `expected_window_days` (default 30; oncology 45). Match on specialty (normalized) + patient.
   - If none → candidate gap.
   - Evidence: referral event + absence window; no LLM judgment on existence.

2. **Duplicate diagnostic test**
   - Rule: group `lab_result`/imaging events by `test_name_normalized`; if same test ≥2× within N days (default 14) by ≥1 provider → candidate.
   - False-positive protections: same-day repeats by same provider for a single order are not duplicates; quantitative panels that include the test as a component are handled via alias map.

3. **Medication monitoring gap**
   - Rule: drug → expected lab map (metformin→A1c/BMP, warfarin→INR, etc.); for each `medication_start`, check whether expected lab event exists within window.
   - If absent/overdue → candidate gap.

### Stage E — Evidence verification (deterministic)

- For each candidate gap, verify: all cited `source_doc_id`s exist; quoted spans are substrings (fuzzy ≥0.85) of source doc text.
- Drop any gap failing verification; log as "ungrounded" (counts as FN in eval, never silently passes).
- Attach confidence = extraction confidence × verification score.

### Stage F — Intervention priority (deterministic, explainable)

- **Not a clinical risk score.** We do not claim a validated patient-risk model. We compute an *intervention priority* for coordinator triage.
- Formula (visible in UI): `priority_score = gap_severity_weight × overdue_factor × evidence_confidence × actionability_weight`, with `gap_type_weight` as a tie-breaker.
- Bands: CRITICAL / HIGH / MEDIUM / LOW derived from score thresholds (documented in priority-engine.md).
- Output: ranked queue (top-K, default 5) with per-patient headline "why."

### Stage G — Explanation generation (LLM)

- LLM writes the plain-language "why," recommended action, and impact statement for each verified gap.
- Input: the verified gap + its evidence (structured), never raw judgment. The LLM explains; it does not decide.
- Language constraint: actions are "verify / contact / review / coordinate," never "order / diagnose / treat."
- Temperature 0.2.

### Stage H — Caching (demo determinism)

- For the demo panel, run stages A–G once, store results in `data/demo-cache/*.json`.
- At runtime, if panel id == demo, serve cached outputs (instant, deterministic).
- Live LLM calls only for custom uploads (and cache by content hash).

### Stage I — Eval (P0, not optional)

- Labeled set: ~20 synthetic patients with planted ground-truth gaps (~80 gaps total: ~30 missed follow-ups, ~25 duplicate tests, ~25 monitoring gaps).
- Compute per gap type: precision, recall, F1; macro F1; grounding/citation accuracy; extraction accuracy; latency.
- Target reporting only — no fabricated numbers; report actuals from the finished pipeline.
- Runner: `scripts/eval.ts` or dev-only route `/api/eval`; results shown on Screen 8 and summarized in pitch.

## LLM prompting strategy

- Structured JSON output (OpenAI `response_format: json_object` or function calling). Never parse free text.
- System prompt for extraction: "You are a clinical information extractor. Extract only what is stated. Cite source_doc_id for every item. If unsure, omit."
- System prompt for explanation: "Explain the verified gap in plain language for a care coordinator. Recommend verification/contact/review/coordination actions only. Never diagnose or order."
- Always include the full record set for one patient in a single extraction call.
- Temperature 0.1 (extraction), 0.2 (explanation).
- Retry on JSON parse failure (max 2).

## Grounding / anti-hallucination

1. Force `source_doc_id` in every extracted event and every gap.
2. Post-validate all citations (Stage E).
3. Drop ungrounded gaps; log as FN.
4. Report grounding rate in eval (target 1.0).
5. The LLM never decides gap existence — only extracts and explains. This is the primary defense.

## Latency budget (80 patients)

- Extraction: 80 LLM calls (batched per patient) ~ 20–40 sec.
- Detection/priority: local, <1 sec.
- Explanation: 80 calls ~ 20–40 sec (can be deferred to on-demand per patient to cut panel-time latency).
- Total panel synthesis target < 60 sec; demo uses cache (instant).

## Cost estimate (hackathon)

- gpt-4o-mini: ~$0.15–0.40 per full panel synthesis. Negligible.
- Cache eliminates repeat cost during dev/demo.

## Failure modes & handling

- LLM returns invalid JSON → retry with stricter prompt; if still failing, fall back to rule-only candidates (lower confidence) and flag.
- API timeout → serve cached demo data; for custom uploads, show partial results + retry.
- Missing source doc → drop the claim; never fabricate.
# AI Pipeline Architecture — Continua

## Stack (locked skeleton + decisions)

- **Frontend:** Next.js (App Router) + Tailwind CSS + shadcn/ui (optional) — Vercel deploy.
- **Backend:** Next.js Route Handlers (serverless) — keeps one repo, one deploy.
- **DB/Storage:** Supabase (Postgres) for patients/records/gaps; local JSON fallback for offline demo.
- **LLM:** OpenAI (gpt-4o-mini for extraction/summarization, gpt-4o for gap reasoning) OR Anthropic Claude — pick one; abstraction layer so it's swappable. Recommendation: **OpenAI gpt-4o-mini** for cost/latency in hackathon; upgrade to gpt-4o for gap reasoning if budget allows.
- **Cache:** Pre-computed LLM outputs for the demo panel stored as JSON in repo (`data/demo-cache/`); served instantly. Live calls only for custom uploads.

## High-level data flow

```
[Synthetic panel data (CSV/JSON)]
        ↓
[Ingestion: normalize into Patient + Record rows]  (Supabase or in-memory)
        ↓
[Per patient: Timeline Reconstruction (LLM: extract events)]  → Timeline
        ↓
[Per patient: Gap Detection (3 detectors, LLM + rules)]      → Gaps[]
        ↓
[Panel: Prioritization (scoring + ranking)]                  → Top-5 queue
        ↓
[UI: Dashboard / Patient detail / Evidence / Impact]
        ↓
[Eval harness (dev): precision/recall/grounding]
```

## Stage details

### Stage A — Ingestion

- Input: array of records `{patient_id, provider, date, doc_type, text, meds?, labs?, referrals?}`.
- Normalize: parse dates (ISO), normalize provider names, normalize test names (alias map: "CBC" = "Complete Blood Count"), normalize drug names (lowercase, strip dose).
- Persist: `patients`, `records` tables (see data-schema.md).
- Synthetic data generator (dev script) produces the 80-patient oncology panel with planted gaps.

### Stage B — Timeline reconstruction (per patient)

- LLM call: given all records for a patient, extract a list of events `{date, event_type, description, provider, source_doc_id}`.
- Event types: `surgery, imaging, consult, lab, medication_start, medication_stop, referral, followup`.
- Sort by date; group by phase for UI.
- **Grounding:** every event must include `source_doc_id`; post-validate that the id exists. Drop events without valid source.
- Output: `Timeline` (ordered events).

### Stage C — Gap detection (per patient, 3 detectors)

Each detector is a hybrid: **rules for candidate generation + LLM for reasoning/evidence**. This keeps it auditable.

1. **Missed specialist follow-up**
   - Rule: find referral events; for each, check whether a matching consult/visit/result exists within `window_days` (default 30; oncology 45).
   - LLM: confirm the gap, write the "why" + recommended action, cite source docs.
   - Output gap: `{type: "missed_followup", severity, evidence: [doc ids + quoted spans], action, impact: "recovered referral"}`.

2. **Duplicate testing**
   - Rule: group labs/imaging by normalized test name; if same test ≥2× within N days (default 14) by ≥1 provider → candidate.
   - LLM: confirm (rule out legitimate repeat), write "why" + action (cancel/consolidate) + estimated cost avoided.
   - Output gap: `{type: "duplicate_test", ...}`.

3. **Medication monitoring gap**
   - Rule: drug → expected lab map (metformin→A1c/BMP, warfarin→INR, etc.); for each med start, check expected lab within window.
   - LLM: confirm + "why" + recommended order.
   - Output gap: `{type: "med_monitoring", ...}`.

### Stage D — Prioritization (panel level)

- Per patient: `risk_score = Σ (gap severity weight) + recency boost + clinical weight (oncology/high-risk boost)`.
- Sort descending; take top-K (default 5).
- Each top patient gets a one-line "why" (from its highest-severity gap) + recommended action.
- Output: `PrioritizedQueue`.

### Stage E — Caching (demo determinism)

- For the demo panel, run stages B–D once, store results in `data/demo-cache/*.json`.
- At runtime, if `DEMO_MODE=true` or panel id == demo, serve cached outputs (instant, deterministic).
- Live LLM calls only for custom uploads (and even then, cache by content hash).

### Stage F — Eval (dev/demo)

- Labeled set: patients with known planted gaps.
- Compute per gap type: precision, recall, F1; plus **grounding rate** = % of reported gaps whose cited doc ids all exist.
- Target: precision ≥ 0.8, recall ≥ 0.7, grounding rate = 1.0.

## LLM prompting strategy

- Use **structured JSON output** (OpenAI `response_format: json_object` or function calling). Never parse free text.
- System prompt: "You are a clinical continuity analyst. Only report gaps supported by the provided records. Every claim must cite a source_doc_id. If unsure, return no gap."
- Always include the full record set for one patient in a single call (context window is fine for ~20 records).
- Temperature 0.1 for determinism.
- Retry on JSON parse failure (max 2).

## Grounding / anti-hallucination

1. Force `source_doc_id` in every event and gap.
2. Post-validate: every cited doc id must exist in the patient's records; every quoted span must be a substring (fuzzy ≥ 0.85) of the source doc text.
3. Drop any gap failing validation; log to eval as "ungrounded."
4. Grounding rate reported in eval (target 1.0).

## Latency budget (80 patients)

- Timeline: ~20 records/patient × 80 = 1,600 records; batched per patient (80 calls) ~ 20–40 sec.
- Gaps: 80 calls ~ 20–40 sec.
- Prioritization: local, <1 sec.
- Total: target < 60 sec panel synthesis; demo uses cache (instant).

## Cost estimate (hackathon)

- gpt-4o-mini: ~$0.15–0.40 per full panel synthesis (80 patients). Negligible.
- Cache eliminates repeat cost during dev/demo.

## Failure modes & handling

- LLM returns invalid JSON → retry with stricter prompt; if still failing, fall back to rule-only candidates (lower confidence).
- API timeout → serve cached demo data; for custom uploads, show partial results + retry.
- Missing source doc → drop the claim; never fabricate.
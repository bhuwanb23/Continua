# Acceptance Tests — Continua (P0)

Given/When/Then for every P0 feature. These are the build's definition of done and the demo's regression suite. Each test is runnable once implementation exists.

Legend: **API** = exercised via route handler; **UI** = exercised in the browser; **EVAL** = via `scripts/eval.ts`.

---

## P0-1 Synthetic patient panel

**AT-1.1** *Given* a fresh install, *When* the synthetic generator runs with seed fixed, *Then* it produces 80 patients and ~400–600 records, and re-running produces byte-identical output.

**AT-1.2** *Given* the generated panel, *When* any record is inspected, *Then* it contains no real names, MRNs, addresses, or dates of birth; a synthetic-data banner is present in the UI.

## P0-2 Messy synthetic cross-provider records

**AT-2.1** *Given* the panel, *When* records are listed for a patient, *Then* they span ≥2 providers and ≥2 doc types, and include free-text notes (not only structured fields).

**AT-2.2** *Given* Maria's records, *When* listed, *Then* they include PCP note, surgery note, imaging report, referral, 2 lab results, and a med list.

## P0-3 Structured clinical-event extraction

**AT-3.1** *Given* Maria's 7 records and a stubbed deterministic LLM response matching the spec, *When* extraction runs, *Then* it returns events conforming to `clinical-event-schema.md` (every event has `source_doc_id` and `source_span`).

**AT-3.2** *Given* an extraction response containing an event with a non-existent `source_doc_id`, *When* validation runs, *Then* that event is dropped and logged, and extraction still succeeds with the remaining valid events.

**AT-3.3** *Given* an extraction response that is invalid JSON, *When* the stage runs, *Then* it retries ≤2 times and then fails gracefully with `pipeline_error` naming the stage (no unhandled crash).

**AT-3.4** *Given* Maria's referral record, *When* extraction runs, *Then* the referral event has `typed.specialty == "oncology"` and `typed.expected_window_days == 45`.

## P0-4 Unified longitudinal timeline

**AT-4.1** *Given* Maria's events, *When* `/api/patients/P-001-maria/timeline` is called, *Then* events are returned in ascending date order with phases, and each event has a `source_doc_id` that exists.

**AT-4.2** *Given* the timeline UI, *When* an event's source chip is clicked, *Then* the source document excerpt with the quoted span is shown.

## P0-5 Three gap detectors

**AT-5.1 (missed follow-up)** *Given* Maria's referral (R4, 2026-04-18, window 45) and no oncology consult, *When* the referral engine runs at "today" 2026-06-05, *Then* exactly one `missed_followup` gap is produced with evidence doc R4.

**AT-5.2 (no false positive)** *Given* a referral plus a matching consult inside the window, *When* the engine runs, *Then* no gap is produced.

**AT-5.3 (wrong specialty)** *Given* a cardiology referral and a completed PCP visit, *When* the engine runs, *Then* a gap is still produced (PCP visit does not satisfy a cardiology referral).

**AT-5.4 (duplicate test)** *Given* Maria's two CBC results 8 days apart from two providers, *When* the duplicate engine runs with N=14, *Then* exactly one `duplicate_test` gap is produced with evidence R5 and R6.

**AT-5.5 (legitimate series)** *Given* two CBCs 8 days apart both marked `intentional_series: true`, *When* the engine runs, *Then* no gap is produced.

**AT-5.6 (monitoring gap)** *Given* a tamoxifen start with no oncology follow-up within 365 days, *When* the monitoring engine runs, *Then* a `med_monitoring` gap is produced with evidence R7 and a "not yet overdue / due within year" framing.

**AT-5.7 (monitoring present)** *Given* metformin started and an A1c result 30 days later, *When* the engine runs, *Then* no monitoring gap is produced.

**AT-5.8 (determinism)** *Given* the same events and "today", *When* each engine runs twice, *Then* identical gap ids and payloads are produced.

## P0-6 Evidence grounding

**AT-6.1** *Given* a candidate gap whose cited doc does not exist, *When* verification runs, *Then* the gap is dropped and counted as a false negative in eval (never displayed).

**AT-6.2** *Given* a candidate gap whose quoted span is not a substring of the source (fuzzy < 0.85), *When* verification runs, *Then* the gap is dropped and logged as ungrounded.

**AT-6.3** *Given* Maria's three gaps, *When* `/api/evidence/{gapId}` is called for each, *Then* every item has `span_verified: true` and `verification_score >= 0.85`.

**AT-6.4** *Given* any returned gap, *When* its JSON is inspected, *Then* every evidence entry has a `doc_id` present in the patient's records.

## P0-7 Explainable intervention prioritization

**AT-7.1** *Given* Maria's follow-up gap fixture, *When* `computePriority` runs, *Then* it returns raw score 1.68 and display 84 (CRITICAL), matching the worked example.

**AT-7.2** *Given* a gap with `evidence_confidence < 0.6`, *When* priority is computed, *Then* the band is capped at MEDIUM regardless of raw score.

**AT-7.3** *Given* the priority API response, *When* inspected, *Then* it includes a full `priority_breakdown` with all five factors and the raw score.

**AT-7.4** *Given* the UI, *When* a priority badge is shown, *Then* it is labeled "Intervention priority" (never "risk score") and the breakdown is reachable in ≤1 click.

## P0-8 Top-five coordinator queue

**AT-8.1** *Given* the demo panel, *When* `/api/panels/demo/queue?k=5` is called, *Then* exactly 5 items are returned, sorted by `priority_score` descending, ranks 1–5.

**AT-8.2** *Given* the demo panel, *When* the queue is requested, *Then* Maria Chen is rank 1 with band CRITICAL.

**AT-8.3** *Given* a patient with two gaps, *When* patient priority is computed, *Then* the max gap score dominates and the bonus is capped at +0.5.

## P0-9 Patient detail view

**AT-9.1** *Given* Maria's patient page, *When* it loads, *Then* it shows header (name, age/sex, diagnosis, last contact), timeline, and gaps panel.

**AT-9.2** *Given* Maria's page, *When* gaps are rendered, *Then* each gap shows type, severity, why, evidence chips, and recommended action.

**AT-9.3** *Given* a gap card, *When* clicked, *Then* the evidence drawer opens with the quoted span, provider, date, reasoning, and confidence.

## P0-10 Recommended next action

**AT-10.1** *Given* any returned gap, *When* `recommended_action` is inspected, *Then* it begins with one of verify/contact/review/coordinate/schedule/confirm/reconcile.

**AT-10.2** *Given* any returned gap, *When* its action text is scanned, *Then* it contains none of order/diagnose/treat/prescribe/discontinue (case-insensitive), except in a negated disclaimer.

**AT-10.3** *Given* the demo, *When* the coordinator views a gap, *Then* a "for coordinator verification" note is visible.

## P0-11 Impact metrics

**AT-11.1** *Given* the demo panel, *When* `/api/metrics?panelId=demo` is called, *Then* it returns patient_count 80, gaps_detected > 0, time baseline 12 min, system 8 sec, and non-negative counts for referrals recovered / duplicates avoided / monitoring gaps caught.

**AT-11.2** *Given* the impact screen, *When* rendered, *Then* it displays "80 patients", "12 min → 8 sec", and the three caught-gap counts.

## P0-12 Evaluation harness

**AT-12.1** *Given* a frozen `ground_truth.json` and no pipeline run, *When* `/api/eval` is called, *Then* it returns `status: "not_run"` and `null` metrics — never invented numbers.

**AT-12.2** *Given* a pipeline run and ground truth, *When* `/api/eval` is called, *Then* it returns per-type precision/recall/F1, macro F1, grounding accuracy, extraction accuracy, and latency, all computed (not hardcoded).

**AT-12.3** *Given* a reported gap matching a ground-truth gap's patient + type + at least one source doc, *When* matching runs, *Then* it counts as a TP; an extra report on a no-gap patient counts as FP.

**AT-12.4** *Given* eval results, *When* rendered on Screen 8, *Then* the numbers match `/api/eval` exactly.

## P0-13 Cached deterministic demo

**AT-13.1** *Given* `panelId=demo` and populated cache, *When* any read endpoint is called, *Then* it serves from cache without an LLM call (verified by stubbed/failing LLM client).

**AT-13.2** *Given* `panelId=demo`, *When* the demo is run twice, *Then* identical queue ranks, gap ids, and scores are returned.

**AT-13.3** *Given* the LLM API key is removed, *When* the demo panel is loaded, *Then* the full demo path still works.

## P0-14 Synthetic-data disclosure

**AT-14.1** *Given* any screen, *When* it renders, *Then* a visible "Synthetic demo data — no real patient information" banner is present.

**AT-14.2** *Given* any clinical API response, *When* inspected, *Then* it includes a `disclaimer` field.

**AT-14.3** *Given* the pitch/README, *When* reviewed, *Then* it states synthetic-only MVP and FHIR/HL7 as a production (unbuilt) path, with no claim of Epic integration.

## P0-15 Error / loading states

**AT-15.1** *Given* a slow pipeline call, *When* the UI waits, *Then* a status line names the stage ("Reconstructing timeline…", "Detecting gaps…").

**AT-15.2** *Given* a failed API call, *When* the UI receives an error, *Then* it shows a friendly message + retry, and no raw stack trace.

**AT-15.3** *Given* an unknown patient/gap id, *When* the endpoint is called, *Then* it returns 404 with a structured `error.code`.

---

## End-to-end demo test

**AT-E2E** *Given* a fresh browser session, *When* the demo runs (load → queue → Maria → evidence → impact → eval), *Then*:
1. Queue shows 5 patients, Maria #1 CRITICAL.
2. Maria's timeline shows 7 events in order.
3. Three gaps render with verified evidence.
4. The follow-up evidence drawer quotes R4 verbatim.
5. Impact shows 80 patients, 12 min → 8 sec, 1/1/1 counts.
6. Eval shows measured numbers or `not_run`.
7. Total wall-clock < 90 seconds.

## Non-goals asserted (regression guards)

**AT-NG1** No route or UI element offers patient login, EHR connection, chatbot, scheduling, or multi-tenant switching.
**AT-NG2** No network call to any EHR vendor domain exists in the codebase.
**AT-NG3** No real PHI: the repo contains no real patient data, and the data generator emits only fabricated names.
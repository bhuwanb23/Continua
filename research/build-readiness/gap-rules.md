# Gap Rules — Continua (Deterministic Detection)

All gap detection runs over the **normalized event store**, never raw text. The LLM is not involved in deciding whether a gap exists. Each rule emits a candidate gap with structured evidence; Stage E verifies evidence before it becomes a reported gap.

## Common candidate-gap shape

```json
{
  "gap_id": "uuid (deterministic)",
  "patient_id": "uuid",
  "type": "missed_followup | duplicate_test | med_monitoring",
  "severity": "high | med | low",
  "title": "short label",
  "trigger_event_ids": ["event uuids that triggered the rule"],
  "window_days": 30,
  "overdue_days": 15,
  "evidence": [{ "doc_id": "uuid", "quoted_span": "string", "event_id": "uuid" }],
  "recommended_action": "verify/contact/review/coordinate (plain language)",
  "estimated_impact": "string"
}
```

## Rule 1 — Missed specialist follow-up

**Trigger:** a `referral` event exists.

**Logic:**
1. For each referral event R (specialty S, date D, expected_window W):
   - Search consult/followup events for the same patient with `specialty == S` (normalized) and `date` in [D, D+W].
   - If none found → candidate gap (missed_followup).
2. `overdue_days = (today_or_latest_record_date) - (D + W)` if positive, else 0.
3. Severity:
   - high if overdue_days > W (i.e., >2× window) OR specialty is oncology/cardiology.
   - med if 0 < overdue_days ≤ W.
   - low if overdue_days == 0 but window closing within 7 days (early warning).
4. Evidence: the referral event's source doc + span; plus a "no matching consult found in window" note (not a fabricated citation — the absence is the evidence, stated as such).

**False-positive protections:**
- A consult in a *different* specialty does not satisfy (e.g., cardiology referral not satisfied by PCP note).
- A consult dated before the referral does not satisfy.
- If `referral.status == "completed"` (explicitly), skip (but log for eval).
- Telehealth/phone consult counts as consult if doc_type indicates it.
- Oncology window = 45 days (not 30).

**Edge cases:**
- Multiple referrals of same specialty: evaluate each; dedupe if same gap would be reported twice (keep the earliest overdue).
- Referral with no expected_window_days → default 30.

## Rule 2 — Duplicate diagnostic test

**Trigger:** ≥2 `lab_result` or `imaging` events with the same `test_name_normalized`.

**Logic:**
1. Group events by `test_name_normalized`.
2. Within each group, for every pair (A, B) with A.date < B.date and (B.date − A.date) ≤ N (default 14 days):
   - If A and B have distinct providers OR distinct dates (not same-day same-provider) → candidate duplicate.
3. Dedupe: if the same test has 3+ events within window, report one gap citing the first duplicate pair, with count noted.
4. `overdue_days` not applicable; use `days_between`.
5. Severity:
   - high if same test ≥3× within window OR imaging modality (cost).
   - med if 2× within 7 days.
   - low if 2× within 8–14 days.

**False-positive protections:**
- Exclude events marked `intentional_series: true` in structured fields (e.g., weekly CBC during chemo) — these are legitimate serial monitoring.
- Same-day, same-provider, same-test events are treated as one order (not a duplicate) unless doc ids differ and notes indicate separate orders.
- Quantitative panels: a CBC component ordered as part of a BMP on the same day is not a duplicate of a standalone CBC on a different day only if dates differ; handled via alias map + date check.
- Imaging: same modality + same body region within window = duplicate; different body regions are not.

**Edge cases:**
- Test name normalization must be applied before grouping (alias map).
- If provider field missing, use doc-level provider; if still missing, treat as unknown provider and still flag if dates differ.

## Rule 3 — Medication monitoring gap

**Trigger:** a `medication_start` event whose drug is in the drug→lab map.

**Logic:**
1. For each medication_start M (drug D, start date S):
   - Look up expected labs L = drug_lab_map[D].
   - For each expected lab test T in L with window W:
     - Search `lab_result` events with `test_name_normalized == T` and date in [S, S+W].
     - If none → candidate gap (med_monitoring).
2. `overdue_days = (today_or_latest) - (S + W)` if positive.
3. Severity:
   - high if overdue_days > W/2 (significantly overdue) OR drug is high-risk (warfarin, oncology meds).
   - med if 0 < overdue_days ≤ W/2.
   - low if within window but closing within 7 days (early warning).

**False-positive protections:**
- If a lab exists just outside the window (W < days ≤ W+14), flag as "possibly overdue" with lower confidence rather than a hard gap.
- If medication was stopped before the window closed (medication_stop event within window), skip.
- If patient has a consult that orders the lab (consult note mentions it) but lab not yet resulted, flag as "pending" not "missed" — lower severity.

**Edge cases:**
- Drug normalization must match map keys (lowercase, no dose).
- Multiple meds → multiple independent checks.
- Oncology meds (tamoxifen/anastrozole) use annual follow-up window; flag only if no oncology consult within 365 days of start.

## Severity → priority

Severity feeds the priority engine (priority-engine.md) but is not itself a clinical risk score. It reflects gap urgency for coordinator triage.

## Recommended action language (enforced)

Actions must use: **verify, contact, review, coordinate, schedule, confirm, reconcile**. Never: order, diagnose, treat, prescribe, discontinue. Human coordinator is final decision-maker. Every action includes "for coordinator verification."
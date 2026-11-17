# Gap Rules — Continua Spec v1.0 (Deterministic Detection)

All gap detection runs over the **normalized event store**, never raw text. The LLM is not involved in deciding whether a gap exists. Each rule emits a candidate gap matching `gap-contracts.md` §1; Stage E verifies evidence before it becomes a reported gap.

`today` in all rules means `evaluation_as_of_date` (`2026-06-05`). No clock is read.

## Common candidate-gap shape

See `gap-contracts.md` §1. Field names are frozen: `gap_type`, `recommended_coordinator_action`, `detector_version`, `quoted_span`.

## Rule 1 — Missed specialist follow-up

**Trigger:** a `referral` event exists.

**Logic:**
1. For each referral event R (specialty S, date D, expected_window W):
   - Search consult/followup events for the same patient with `specialty == S` (normalized) and `date` in [D, D+W].
   - If none found → candidate gap (`missed_followup`).
2. `overdue_days = max(0, evaluation_as_of_date - (D + W))` days.
3. Severity:
   - high if overdue_days > W (i.e., >2× window) OR specialty is oncology/cardiology.
   - med if 0 < overdue_days ≤ W.
   - low if overdue_days == 0 but window closing within 7 days (early warning).

**False-positive protections:**
- A consult in a *different* specialty does not satisfy (e.g., cardiology referral not satisfied by PCP note).
- A consult dated before the referral does not satisfy.
- If `referral.status == "completed"` (explicitly), skip (but log for eval).
- Telehealth/phone consult counts as consult if doc_type indicates it.

**Edge cases:**
- Multiple referrals of same specialty: evaluate each; dedupe if same gap would be reported twice (keep the earliest overdue).
- Referral with no `expected_window_days` → default 30.

## Rule 2 — Duplicate diagnostic test

**Trigger:** ≥2 `lab_result` or `imaging` events with the same normalized key.

**Normalized key:**
- Labs: `test_name_normalized` (from alias map).
- Imaging: `modality_normalized + body_region_normalized` (lowercased, trimmed). Different body regions are not duplicates.

**Logic:**
1. Group events by normalized key.
2. Within each group, for every pair (A, B) with A.date < B.date and (B.date − A.date) ≤ N (default 14 days):
   - If A and B have distinct providers OR distinct dates (not same-day same-provider) → candidate duplicate.
3. Dedupe: if the same test has 3+ events within window, report one gap citing the first duplicate pair, with count noted.
4. Use `days_between`. `overdue_days` = 0.
5. Severity:
   - high if same test ≥3× within window OR imaging modality (cost).
   - med if 2× within 7 days.
   - low if 2× within 8–14 days.

**False-positive protections:**
- Exclude pairs where either event has `series_status == "explicit_series"` (legitimate serial monitoring). `unknown` does **not** exempt a pair; the rule flags it, because a safety tool should surface the repeat for human review.
- Same-day, same-provider, same-test events are treated as one order (not a duplicate) unless doc ids differ and notes indicate separate orders.
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
     - If none → candidate gap (`med_monitoring`).
2. `overdue_days = max(0, evaluation_as_of_date - (S + W))`.
3. Severity:
   - high if overdue_days > W/2 (significantly overdue) OR drug is high-risk (warfarin, oncology meds).
   - med if 0 < overdue_days ≤ W/2.
   - low if within window but closing within 7 days (early warning).

4. **Not-yet-elapsed window = NOT a gap (hard rule).** If `S + W` is in the future relative to `evaluation_as_of_date`, the rule must not emit a gap. It may emit a `pending_monitoring` note (severity none, excluded from the queue and from ground truth). This is why Maria's tamoxifen window (365 days, started 44 days before the demo date) is context, not a detected gap. A rule may never claim a window has been missed before it closes.

**False-positive protections:**
- If a lab exists just outside the window (W < days ≤ W+14), flag as "possibly overdue" with lower confidence rather than a hard gap.
- If medication was stopped before the window closed (`medication_stop` event within window), skip.
- If patient has a consult that orders the lab (consult note mentions it) but lab not yet resulted, flag as "pending" not "missed" — lower severity.

**Edge cases:**
- Drug normalization must match map keys (lowercase, no dose).
- Multiple meds → multiple independent checks.
- Oncology meds (tamoxifen/anastrozole) use an annual follow-up window; a gap is only reportable **after** the 365 days elapse with no oncology consult. Before that, emit a `pending_monitoring` note only.
- A medication with multiple expected labs (metformin → a1c + bmp) emits one gap citing the missing labs, not two duplicate gaps for the same trigger event.

## Severity → priority

Severity feeds the priority engine (`priority-engine.md`) but is not itself a clinical risk score. It reflects gap urgency for coordinator triage.

## Recommended action language (enforced)

Actions must use: **verify, contact, review, coordinate, schedule, confirm, reconcile**. Never: order, diagnose, treat, prescribe, discontinue. Human coordinator is final decision-maker. Every action includes "for coordinator verification."
# Gap Contracts — Continua Spec v1.0

> Shared contract for every candidate gap emitted by the deterministic detectors, plus per-type metadata. Resolves C-012, C-013, C-014, C-015, C-020.

## 1. Shared candidate-gap shape (frozen field names)

```json
{
  "gap_id": "uuid (deterministic)",
  "patient_id": "uuid",
  "gap_type": "missed_followup | duplicate_test | med_monitoring",
  "severity": "high | med | low",
  "title": "short label",
  "trigger_event_ids": ["event uuids that triggered the rule"],
  "window_days": 30,
  "overdue_days": 15,
  "days_between": 0,
  "due_date": "YYYY-MM-DD | null",
  "evidence": [{ "doc_id": "uuid", "quoted_span": "string", "event_id": "uuid" }],
  "recommended_coordinator_action": "verify/contact/review/coordinate/schedule/confirm/reconcile (plain language)",
  "estimated_impact": "string",
  "priority_band": "CRITICAL | HIGH | MEDIUM | LOW",
  "gap_priority_score": 0,
  "confidence": 0.0,
  "detector_version": "string (versioned id)",
  "grounded": true
}
```

Field rules:
- `gap_type` (not `type`).
- `recommended_coordinator_action` (not `recommended_action`).
- `detector_version` (not `detector`).
- `confidence` = `evidence_confidence` (extraction × verification). Never a fourth meaning.
- `quoted_span` (gap layer). Event layer uses `source_span`; API parent-doc uses `source_text_excerpt`.
- `grounded` must be `true` for any gap that reaches the API. Ungrounded candidates are dropped in Stage E.

## 2. Per-type metadata

### missed_followup

| Field | Value |
|---|---|
| `gap_type` | `missed_followup` |
| Trigger | `referral` event |
| Default window | 30 days (45 for oncology) |
| `detector_version` | `referral_engine_v1` |
| Temporal state | overdue if `evaluation_as_of_date > D + W` |
| `overdue_days` | `max(0, as_of - (D+W))` days |

### duplicate_test

| Field | Value |
|---|---|
| `gap_type` | `duplicate_test` |
| Trigger | ≥2 `lab_result` or `imaging` events with same normalized key |
| Default window N | 14 days |
| `detector_version` | `duplicate_engine_v1` |
| Temporal field | `days_between` (not `overdue_days`) |
| `overdue_days` | 0 (not applicable) |

### med_monitoring

| Field | Value |
|---|---|
| `gap_type` | `med_monitoring` |
| Trigger | `medication_start` whose drug is in the drug→lab map |
| Window | per drug (metformin 90 d, warfarin 7 d, tamoxifen/anastrozole 365 d) |
| `detector_version` | `monitoring_engine_v1` |
| Temporal state | overdue if `as_of > S + W`; pending if `as_of < S + W` |
| `overdue_days` | `max(0, as_of - (S+W))` days |

## 3. Temporal policy (frozen)

- All windows evaluated against `evaluation_as_of_date` (constant `2026-06-05`).
- No clock read in the detection path.
- `pending` state never emits a gap; may emit a `pending_monitoring` note (severity none, excluded from queue and ground truth).
- Tamoxifen/anastrozole: 365-day window; gap reportable only after `S + 365` elapses with no oncology consult.

## 4. Action verbs (allowed — C-015)

`verify, contact, review, coordinate, schedule, confirm, reconcile`. Never: order, diagnose, treat, prescribe, discontinue. Every action includes "for coordinator verification" (safety contract).

## 5. Severity → priority mapping

Severity feeds the priority engine (`priority-engine.md`) but is not itself a clinical risk score. It reflects gap urgency for coordinator triage.

## 6. Versioning

- `detector_version` strings are versioned ids (`*_engine_v1`). A rule change bumps the version and re-runs eval.
- `monitoring_policy` = `synthetic_demo_policy_v1` (stored in `versions.json`).
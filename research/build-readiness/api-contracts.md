# API Contracts — Continua

Frozen interfaces. Next.js Route Handlers. All responses JSON. All endpoints scoped to one panel (`/api/panels/{panelId}/...`); MVP has a single demo panel (`demo`).

Conventions:
- Errors: `{ "error": { "code": "string", "message": "string" } }` with 4xx/5xx.
- IDs are UUID strings (demo uses deterministic ids).
- All timestamps ISO 8601 UTC. Dates `YYYY-MM-DD`.
- Every response that includes clinical content also includes `"disclaimer": "Synthetic demo data. For coordinator verification only. Not medical advice."`

## 1. GET /api/panels/{panelId}

Panel summary + KPIs.

**200**
```json
{
  "panel_id": "demo",
  "name": "Oncology demo panel",
  "owner": "sarah",
  "patient_count": 80,
  "flagged_patient_count": 12,
  "gap_counts": { "missed_followup": 8, "duplicate_test": 5, "med_monitoring": 6 },
  "top_patient_ids": ["uuid", "uuid", "uuid", "uuid", "uuid"],
  "generated_at": "2026-11-17T10:00:00Z",
  "disclaimer": "Synthetic demo data. For coordinator verification only. Not medical advice."
}
```

## 2. GET /api/panels/{panelId}/patients?query=&gap_type=&priority=

List/search patients.

**Query params:** `query` (name substring), `gap_type` (one of 3), `priority` (CRITICAL/HIGH/MEDIUM/LOW), `limit` (default 50), `offset` (default 0).

**200**
```json
{
  "total": 80,
  "items": [
    {
      "patient_id": "uuid",
      "name": "Maria Chen",
      "age": 54,
      "sex": "F",
      "primary_diagnosis": "Breast cancer — post-surgical",
      "last_contact_date": "2026-04-20",
      "gap_count": 2,
      "top_gap_type": "missed_followup",
      "priority_band": "CRITICAL",
      "priority_score": 84
    }
  ],
  "disclaimer": "..."
}
```

## 3. GET /api/patients/{patientId}

Patient header + summary.

**200**
```json
{
  "patient_id": "uuid",
  "name": "Maria Chen",
  "age": 54,
  "sex": "F",
  "primary_diagnosis": "Breast cancer — post-surgical",
  "risk_level": "high",
  "last_contact_date": "2026-04-20",
  "priority_band": "CRITICAL",
  "priority_score": 84,
  "priority_breakdown": {
    "severity_weight": 1.0,
    "overdue_factor": 1.75,
    "evidence_confidence": 0.96,
    "actionability_weight": 1.0,
    "gap_type_weight": 1.0,
    "raw_score": 1.68
  },
  "disclaimer": "..."
}
```

## 4. GET /api/patients/{patientId}/timeline

Unified longitudinal timeline.

**200**
```json
{
  "patient_id": "uuid",
  "events": [
    {
      "event_id": "uuid",
      "date": "2026-03-04",
      "event_type": "surgery",
      "description": "Lumpectomy, left breast",
      "provider": "Dr. A. Patel — Primary Care",
      "provider_type": "pcp",
      "phase": "Surgery",
      "source_doc_id": "uuid",
      "confidence": 0.97,
      "typed": { "procedure": "lumpectomy", "site": "left breast" }
    }
  ],
  "phases": ["Surgery", "Radiology", "Oncology", "Labs", "Medications", "Follow-up"],
  "disclaimer": "..."
}
```

## 5. GET /api/patients/{patientId}/gaps

Verified gaps for one patient, with priority.

**200**
```json
{
  "patient_id": "uuid",
  "gaps": [
    {
      "gap_id": "uuid",
      "type": "missed_followup",
      "severity": "high",
      "title": "Missed oncology follow-up",
      "why": "Referral to oncology placed 2026-04-18; no oncology consult found within 45 days.",
      "overdue_days": 45,
      "window_days": 45,
      "evidence": [
        {
          "doc_id": "uuid",
          "provider": "Dr. A. Patel — Primary Care",
          "date": "2026-04-18",
          "quoted_span": "Referral to Medical Oncology for post-surgical evaluation."
        }
      ],
      "recommended_action": "Verify: contact patient and confirm oncology follow-up.",
      "estimated_impact": "Recovered referral (1)",
      "priority_band": "CRITICAL",
      "priority_score": 84,
      "confidence": 0.96,
      "detector": "referral_engine_v1",
      "grounded": true
    }
  ],
  "disclaimer": "..."
}
```

## 6. GET /api/panels/{panelId}/queue?k=5

Prioritized coordinator queue.

**200**
```json
{
  "panel_id": "demo",
  "k": 5,
  "items": [
    {
      "rank": 1,
      "patient_id": "uuid",
      "name": "Maria Chen",
      "age": 54,
      "priority_band": "CRITICAL",
      "priority_score": 84,
      "headline": "Missed oncology follow-up — 45 days overdue after imaging.",
      "top_gap_id": "uuid",
      "top_gap_type": "missed_followup",
      "recommended_action": "Verify: contact patient and confirm oncology follow-up."
    }
  ],
  "generated_at": "2026-11-17T10:00:00Z",
  "disclaimer": "..."
}
```

## 7. GET /api/evidence/{gapId}

Evidence deep-dive (source spans).

**200**
```json
{
  "gap_id": "uuid",
  "patient_id": "uuid",
  "title": "Missed oncology follow-up",
  "items": [
    {
      "doc_id": "uuid",
      "doc_type": "referral",
      "provider": "Dr. A. Patel — Primary Care",
      "provider_type": "pcp",
      "date": "2026-04-18",
      "quoted_span": "Referral to Medical Oncology for post-surgical evaluation.",
      "span_verified": true,
      "verification_score": 1.0,
      "source_text_excerpt": "…Referral to Medical Oncology for post-surgical evaluation. Please schedule within 45 days…"
    }
  ],
  "reasoning": "A referral to oncology exists with a 45-day expected window. No consult or follow-up event with specialty oncology was extracted within that window.",
  "confidence": 0.96,
  "disclaimer": "..."
}
```

**404** if gap not found or not grounded.

## 8. GET /api/metrics?panelId=demo

Impact summary (product metrics).

**200**
```json
{
  "panel_id": "demo",
  "patient_count": 80,
  "patients_reviewed": 80,
  "gaps_detected": 19,
  "patients_with_gaps": 12,
  "by_type": { "missed_followup": 8, "duplicate_test": 5, "med_monitoring": 6 },
  "time_baseline_min_per_patient": 12,
  "time_with_system_sec_per_patient": 8,
  "estimated_hours_saved": 15.2,
  "referrals_recovered": 1,
  "duplicate_tests_avoided": 1,
  "monitoring_gaps_caught": 1,
  "estimated_cost_avoided_usd": 45,
  "disclaimer": "..."
}
```

## 9. GET /api/eval

Measured eval report (generated by running the pipeline).

**200**
```json
{
  "run_at": "2026-11-17T10:00:00Z",
  "panel_id": "demo",
  "ground_truth_gaps": 80,
  "reported_gaps": 0,
  "per_type": {
    "missed_followup": { "precision": null, "recall": null, "f1": null, "tp": 0, "fp": 0, "fn": 0 },
    "duplicate_test": { "precision": null, "recall": null, "f1": null, "tp": 0, "fp": 0, "fn": 0 },
    "med_monitoring": { "precision": null, "recall": null, "f1": null, "tp": 0, "fp": 0, "fn": 0 }
  },
  "macro_f1": null,
  "micro_f1": null,
  "grounding_accuracy": null,
  "unsupported_claim_rate": null,
  "extraction_accuracy": null,
  "latency": { "panel_p50_sec": null, "panel_p95_sec": null, "single_patient_sec": null },
  "status": "not_run",
  "disclaimer": "..."
}
```

The `null` values above are placeholders until the pipeline is actually run; `/api/eval` must return measured values or `status: "not_run"`. It must never return invented numbers.

## 10. POST /api/panels/{panelId}/load

Load demo panel (seeds synthetic data / serves cache).

**Request:** `{}` (empty) or `{ "mode": "demo" | "custom", "payload": {...} }`

**200**
```json
{ "panel_id": "demo", "patient_count": 80, "status": "loaded", "cached": true }
```

**400** for malformed custom payload.

## 11. POST /api/gaps/{gapId}/action

Record coordinator action (P1; local state only).

**Request:** `{ "action": "acknowledged" | "contacted" | "reviewed" }`

**200** `{ "gap_id": "uuid", "action": "contacted", "recorded_at": "..." }`

## Errors

| Code | When |
|---|---|
| `panel_not_found` | unknown panelId |
| `patient_not_found` | unknown patientId |
| `gap_not_found` | unknown gapId |
| `gap_not_grounded` | gap exists but failed verification (never returned as a gap) |
| `invalid_payload` | bad request body |
| `pipeline_error` | extraction/detection failed; message includes stage |

## Types (shared)

- `GapType = "missed_followup" | "duplicate_test" | "med_monitoring"`
- `PriorityBand = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"`
- `EventType = "surgery" | "imaging" | "consult" | "lab_result" | "medication_start" | "medication_stop" | "referral" | "followup"`

Shared in `lib/types.ts`; API and UI import the same types.
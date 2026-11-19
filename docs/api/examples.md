# continua-api-v1 examples

Run the demo locally with `npm run dev`, then use the calls below. Ids come from
the frozen snapshot; responses are abbreviated with `…` and request ids vary.
All data is synthetic.

## 1. Start with the panel

```bash
curl -s http://localhost:3000/api/v1/panels/demo | jq
```

```json
{
  "panel": {
    "panel_id": "demo",
    "name": "Oncology Continuity Demo",
    "patient_count": 80,
    "patients_with_verified_gaps": 42,
    "verified_gap_counts": {
      "missed_followup": 26,
      "duplicate_test": 20,
      "med_monitoring": 20
    }
  },
  "meta": {
    "api_version": "v1",
    "synthetic": true,
    "evaluation_as_of_date": "2026-06-05",
    "request_id": "req_9c2debd2a4a24cf8b392a2a7700328a1"
  },
  "disclaimer": "Synthetic demo data. For coordinator verification only. Not medical advice."
}
```

## 2. Read the queue

```bash
curl -s 'http://localhost:3000/api/v1/panels/demo/queue?k=5' | jq '.items[] | {rank, display_name, patient_priority_score}'
```

```json
{ "rank": 1, "display_name": "Devon Adeyemi", "patient_priority_score": 89 }
```

The first item in full:

```json
{
  "rank": 1,
  "patient_id": "485d8a51-07cb-52eb-8d3a-ac817458c0d0",
  "display_name": "Devon Adeyemi",
  "patient_priority_score": 89,
  "priority_band": "P1",
  "priority_label": "Act first",
  "verified_gap_count": 3,
  "top_gap_id": "fa473b12-7c80-53f4-8b31-43107c5d27b5",
  "top_gap_type": "med_monitoring",
  "top_gap_priority_score": 95,
  "headline": "Warfarin monitoring appears unresolved · 132 days overdue",
  "recommended_coordinator_action": "Verify monitoring status and coordinate follow-up if unresolved."
}
```

`rank` is the stored Phase-8 rank. `k` cannot re-rank; it only caps the slice.

## 3. Search and filter patients

```bash
curl -s 'http://localhost:3000/api/v1/panels/demo/patients?query=maria&limit=10' | jq '.total, .patients[0].display_name'
curl -s 'http://localhost:3000/api/v1/panels/demo/patients?gap_type=med_monitoring&priority_band=P1&sort=priority' | jq '.total'
```

`query` matches display names case-insensitively. `total` is the filtered count,
independent of `limit`/`offset`.

## 4. Patient detail

```bash
curl -s http://localhost:3000/api/v1/patients/09ec7b36-dc73-556a-b1f4-d0ef64897c1a | jq '.patient'
```

```json
{
  "patient_id": "09ec7b36-dc73-556a-b1f4-d0ef64897c1a",
  "display_name": "Keiko Adeyemi",
  "age": 62,
  "sex": "F",
  "primary_condition": "breast_cancer",
  "last_contact_date": "2026-04-25",
  "patient_priority_score": 81,
  "priority_band": "P1",
  "priority_label": "Act first",
  "priority_rank": 9,
  "verified_gap_count": 2,
  "priority_breakdown": {
    "top_gap_raw_score": 1.4,
    "top_gap_overdue_days": 64,
    "secondary_gap_count": 1,
    "secondary_bonus": 0.049163,
    "patient_raw_score": 1.449163
  }
}
```

`priority_breakdown` explains the stored score; it is not recomputed per request.

## 5. Timeline

```bash
curl -s http://localhost:3000/api/v1/patients/09ec7b36-dc73-556a-b1f4-d0ef64897c1a/timeline \
  | jq '.events[] | {date, event_type, description}'
```

Events are already in the canonical order (`sortClinicalEvents`): date ascending,
then the frozen tiebreaker. The route does not sort a second time.

## 6. Verified gaps

```bash
curl -s http://localhost:3000/api/v1/patients/09ec7b36-dc73-556a-b1f4-d0ef64897c1a/gaps | jq '.gaps[0]'
```

```json
{
  "gap_id": "7824607e-a210-56cc-adb8-8888cd2a5ff3",
  "gap_type": "missed_followup",
  "title": "Oncology follow-up unresolved",
  "workflow_severity": "high",
  "gap_priority_score": 93,
  "priority_band": "P1",
  "priority_label": "Act first",
  "summary": "Referral to Oncology recorded Feb 16, 2026. Expected follow-up window: 45 days (source-defined). No completed oncology consultation was found in the available records by Apr 2, 2026.",
  "recommended_coordinator_action": "Verify referral status and coordinate follow-up.",
  "evidence_status": "verified",
  "evidence_count": 3
}
```

Only verified gaps appear; there is no `candidate` variant of this route.

## 7. Evidence deep dive

```bash
curl -s http://localhost:3000/api/v1/evidence/660de088-7861-5723-bd42-319351764f5c | jq
```

Abbreviated:

```json
{
  "gap_id": "660de088-7861-5723-bd42-319351764f5c",
  "verification_status": "verified",
  "claims": [
    { "claim": "medication_identity", "value": "metformin", "status": "verified", "evidence_ids": ["e55f8eb3-…"] },
    { "claim": "no_qualifying_monitoring", "value": 0, "status": "verified", "evidence_ids": ["023fb460-…"] }
  ],
  "sources": [
    {
      "document_id": "c005badb-12a9-5f44-87a7-3d42f9bcfd8e",
      "document_type": "medication_list",
      "provider": "Dr. Sofia Alvarez",
      "date": "2026-02-14",
      "quoted_span": "Started metformin 1000 mg twice daily for type 2 diabetes.",
      "source_excerpt": "Dr. Sofia Alvarez … Started metformin 1000 mg twice daily for type 2 diabetes. …",
      "verification_method": "exact"
    }
  ],
  "absence_checks": [
    {
      "description": "No matching lab result for a1c or bmp within the verification window",
      "window_start": "2026-02-14",
      "window_end": "2026-05-15",
      "matching_event_count": 0,
      "status": "verified"
    }
  ],
  "policy_checks": [
    {
      "policy": "monitoring-registry",
      "status": "verified",
      "detail": "monitoring_target=a1c_or_bmp;window_days=90"
    }
  ],
  "meta": { "…": "…" },
  "disclaimer": "Synthetic demo data. For coordinator verification only. Not medical advice."
}
```

Every source belongs to the same patient as the gap; the freeze harness
cross-checks this against `records.json` ownership.

## 8. Impact metrics

```bash
curl -s 'http://localhost:3000/api/v1/metrics?panelId=demo' | jq '.measured[0]'
```

```json
{
  "metric": "cache_queue_read_p50_ms",
  "value": 1.6514,
  "unit": "ms",
  "classification": "MEASURED",
  "source": "frozen Phase-9 benchmark latency.json (cached_queue_read_parse.p50_ms)"
}
```

Buckets: `measured`, `modeled`, `scenario_assumptions`, `external_research`.
`classification` is repeated per row so downstream UI cannot mislabel an estimate.

## 9. Evaluation

```bash
curl -s http://localhost:3000/api/v1/evaluation | jq '.evaluation | {benchmark_run_id, status, partition, limitations}'
```

```json
{
  "benchmark_run_id": "benchmark-20261119-1400-14edc3e-final",
  "status": "COMPLETED",
  "partition": "final (final)",
  "limitations": ["…four frozen limitations…"]
}
```

The response reports aggregates only. Per-patient `truth_match` rows, gold event
ids, baseline details, and the scorecard are filtered out before the response is
validated.

## 10. Record a coordination action (P1)

```bash
curl -s -X POST http://localhost:3000/api/v1/gaps/<gapId>/actions \
  -H 'content-type: application/json' \
  -d '{"action":"contacted"}' | jq
```

```json
{
  "gap_id": "<gapId>",
  "action": "contacted",
  "recorded_at": "2026-11-19T10:00:39.124Z",
  "intelligence_unchanged": true,
  "meta": { "…": "…" },
  "disclaimer": "Synthetic demo data. For coordinator verification only. Not medical advice."
}
```

Actions are workflow state in process memory; they never change gaps, scores, or
rank. Unknown actions return `422 unsupported_action`.

## 11. Operations

```bash
curl -s http://localhost:3000/api/v1/health | jq
# {"status":"ok","api_version":"v1","request_id":"req_…"}

curl -s http://localhost:3000/api/v1/readiness | jq
# {"status":"ready","cache_version":"continua-demo-cache-v1","patient_count":80,"api_version":"v1","request_id":"req_…"}
```

If the cache fails validation, clinical routes and `/readiness` return 503 while
`/health` stays 200.

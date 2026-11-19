# continua-api-v1 error model

Every failure returns the same envelope. There are no HTML error pages and no raw
exception text on the wire.

```json
{
  "error": {
    "code": "patient_not_found",
    "message": "No patient with that id exists in the demo snapshot.",
    "request_id": "req_5de10fb6534141e8bc494f9d2706e9c6"
  }
}
```

`error.request_id` always equals the `X-Request-Id` response header. Messages are
written for a coordinator, never for a developer: they never contain stack
traces, file paths, SQL, cache directory names, or secrets.

## Codes and status

| Code | Status | When |
| --- | --- | --- |
| `invalid_request` | 400 | Path id fails the uuid/format rule, JSON body is malformed, or the body fails `ActionRequestSchema` |
| `invalid_query` | 400 | Unknown enum, non-numeric `limit`/`offset`/`k`, or a value outside the accepted shape |
| `panel_not_found` | 404 | Panel id is well formed but not in the snapshot |
| `patient_not_found` | 404 | Patient id is well formed but not in the snapshot |
| `gap_not_found` | 404 | No verified gap with that id |
| `evidence_not_found` | 404 | No evidence bundle for a verified gap (should not happen in a valid snapshot) |
| `unsupported_action` | 422 | Body is valid JSON but `action` is not `acknowledged`, `contacted`, or `reviewed` |
| `demo_cache_not_ready` | 503 | Cache is missing, invalid, or not initialized; clinical reads refuse to answer |
| `cache_version_mismatch` | 503 | Snapshot version does not match what the build expects |
| `data_integrity_error` | 500 | A DTO failed response validation, or stored data is internally inconsistent |
| `repository_error` | 500 | The repository rejected a read for a non-cache reason |
| `internal_error` | 500 | Anything unexpected; the message is always generic |

## Status transitions

- **404 vs 500.** A well-formed id that does not exist is 404. A verified gap
  whose evidence bundle is missing is *not* a normal miss: it means the snapshot
  is corrupt, so it returns `500 data_integrity_error`.
- **400 vs 422.** Shape and parameter errors are 400. A syntactically valid
  request that asks for an action the workflow does not support is 422.
- **503 vs 500.** `503` means "the data is not ready; retry after `/readiness`
  reports ready". `500` means "the request was fine but the server or snapshot
  is inconsistent". Neither leaks internals.

## Examples

Malformed id (path traversal attempt):

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  http://localhost:3000/api/v1/patients/..%2F..%2Fground_truth.json
# 400
```

Unknown filter:

```bash
curl -s 'http://localhost:3000/api/v1/panels/demo/patients?gap_type=cancer'
# {"error":{"code":"invalid_query","message":"Query parameters failed validation.","request_id":"req_…"}}
```

Oversized pagination is clamped, not rejected:

```bash
curl -s 'http://localhost:3000/api/v1/panels/demo/patients?limit=99999' | jq '.limit'
# 100
```

Unsupported action:

```bash
curl -s -X POST http://localhost:3000/api/v1/gaps/<gapId>/actions \
  -H 'content-type: application/json' -d '{"action":"delete"}'
# 422 unsupported_action
```

Unready cache:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/v1/panels/demo
# 503
curl -s http://localhost:3000/api/v1/readiness
# {"status":"not_ready","cache_version":null,"patient_count":0,"api_version":"v1","request_id":"req_…"}
```

`/health` continues to return 200 in that state: the process is alive, the data is
not ready. Use `/readiness` for traffic decisions.

## Logs

Each request produces one structured line:

```json
{"timestamp":"2026-11-19T10:00:39.124Z","level":"info","request_id":"req_ffa4…","route":"GET /api/v1/panels/[panelId]","status":200,"duration_ms":0.34,"repository_operation":"panel.getOverview"}
```

4xx is logged at `warn`, 5xx at `error`. Set `CONTINUA_API_LOG=off` to silence the
logger; tests do this automatically. No patient names, note text, or credentials
are logged.

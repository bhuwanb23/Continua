# Safety Contract — Continua Spec v1.0

> Part A (0.11): claim classification. Part B (0.14): action authority, prohibited claims, human gate. Resolves C-007, C-008, C-010, C-015, C-017.

## Part A — Claim classification (0.11)

Every operational-impact or performance claim in the product, docs, or demo must be assigned exactly one of four classes. No claim may be presented without its class.

| Class | Example | Rule |
|---|---|---|
| `baseline` | 12 min manual review | Always `baseline_type: "scenario_assumption"`. Never presented as measured. |
| `measured` | 8.1 s synthesis latency | Produced by a real run of the pipeline. Never hardcoded. Absent → `status: "not_measured"` and `modeled: null`. |
| `modeled` | ~15 h saved per panel | Always labeled modeled, formula shown. Derived arithmetic only. |
| `sourced` | "40% of cancer patients…" | Citation required (source + date). |

### Enforcement

- The metrics API (`api-contract-v1.md` §8) separates `baseline`, `measured`, `modeled` into distinct objects. They must never be merged into a single "savings" number.
- The UI must not display "12 min → 8 sec" as an established result. It may display it as *\"modeled: 12 min manual review assumption → 8.1 s measured synthesis.\"*
- If `measured` values are absent (pipeline not run), `modeled` must be `null` with `status: "not_measured"`.
- The eval report never contains invented numbers; `status: "not_run"` until measured.

### Wow line

"Sarah reviewed Maria's chart for 12 minutes yesterday… Continua found it in 8 seconds." — "12 minutes" is `baseline` (`scenario_assumption`); "8 seconds" must be `measured` (never hardcoded). If measurement is unavailable, the line is not used.

## Part B — Safety contract (0.14)

### MAY (system is permitted to)

- Extract structured clinical events from synthetic records.
- Detect candidate gaps deterministically from the event store.
- Verify evidence spans (Level A / Level B).
- Compute intervention priority (explainable formula).
- Generate plain-language explanations grounded in cited spans.
- Surface gaps for coordinator verification.
- Record coordinator actions (acknowledged / contacted / reviewed).

### MUST NOT (system is prohibited from)

- Diagnose, treat, prescribe, discontinue, or order anything.
- Assign clinical risk scores or predict patient harm.
- Decide whether a care gap exists autonomously when deterministic evidence can establish it (LLM must not decide gaps).
- Produce any field not in the clinical event schema.
- Infer clinical intent (e.g., `series_status` must be explicit or `unknown`).
- Present baseline assumptions as measured results.
- Use real PHI or fake Epic/FHIR integration in the MVP.
- Display `risk_level`, `risk_score`, or bare `priority_score`.
- Surface an ungrounded gap.
- Emit a gap for a not-yet-elapsed window.

### Human gate

- The coordinator is the final decision-maker. Every action includes "for coordinator verification."
- Recommended actions use only: verify, contact, review, coordinate, schedule, confirm, reconcile.
- No action executes without coordinator confirmation (P1 records intent only).

### Prohibited terms (mechanical)

`risk_level`, bare `priority_score`, "clinical risk score", "patient risk", "diagnosed", "prescribed", "ordered" (as system actions), "clinically validated", "FDA", "real-world efficacy", "intentional_series", "today_or_latest_record_date", "Epic"/"FHIR" in MVP scope.

### Enforcement

- `scripts/spec-audit.sh` (installed in Phase 1) greps for prohibited terms.
- AT-7.5, AT-7.6, AT-10.1 cover the API/UI surface.
- Every MUST NOT above has a corresponding test (see `acceptance-tests.md` §4).
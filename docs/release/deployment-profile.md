# Deployment Profile

The judge path requires no live LLM and no external database. The production
build must serve the frozen cache and API routes only.

Required runtime configuration:

- `CONTINUA_DEMO_MODE=true`
- no `LLM_API_KEY`
- no `SUPABASE_URL` or `SUPABASE_ANON_KEY`
- `CONTINUA_EVALUATION_AS_OF_DATE=2026-06-05`

Deployment smoke is recorded in
`artifacts/performance/deployment-smoke.json`. Hosted uptime or SLA is not
claimed.

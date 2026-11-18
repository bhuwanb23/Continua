# Needs Validation

## F-001 — Benchmark labels committed in repository
- Missing fact: repository visibility and sharing model.
- Safe validation: inspect remote/repository hosting settings and deployment pipeline. Do not expose labels to untrusted clients.

## F-008 — Dependency vulnerabilities
- Missing fact: successful advisory scan.
- Safe validation: run `npm audit --omit=dev --audit-level=high` in CI or an environment with registry TLS access.

## F-009 — Arbitrary path handling
- Missing fact: whether file utilities will be exposed to untrusted callers.
- Safe validation: review future API designs before enabling file path inputs.
# Security Policy

## Scope

Continua is a **prototype** built on fully synthetic data. It is not HIPAA
compliant, not clinically validated, and not a medical device. It must not be
used with real patient data.

## Reporting vulnerabilities

Please report suspected vulnerabilities privately to the maintainers rather
than opening a public issue. Include:

- A description of the issue and its impact.
- Steps to reproduce.
- Affected commit or version.

## Supported versions

Only the current `main` branch is supported.

## Security checks

The repository enforces `npm run check:safety`, `npm run check:secrets`,
`npm run check:leakage`, and `npm run audit:synthetic` as part of
`npm run validate`.

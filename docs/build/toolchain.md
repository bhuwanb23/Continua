# Toolchain baseline (Phase 1)

Frozen 2026-11-17. The lockfile (`package-lock.json`) is authoritative.

| Tool | Version |
|---|---|
| Node.js | 24.13.0 (engines: `>=20`) |
| npm | 11.6.2 |
| Next.js | 15.5.29 |
| React | 19.0.0 |
| React DOM | 19.0.0 |
| TypeScript | 5.7.3 |
| Tailwind CSS | 3.4.17 |
| PostCSS | 8.4.49 |
| Autoprefixer | 10.4.20 |
| Zod | 3.24.1 |
| ESLint | 9.39.1 |
| eslint-config-next | 15.5.29 |
| Vitest | 2.1.8 |
| Playwright | 1.51.1 |
| tsx | 4.19.2 |

## Rules

- One package manager: npm. Do not introduce pnpm/yarn/bun lockfiles.
- `npm ci` must resolve the committed lockfile exactly.
- New dependencies require a one-line justification in the commit message.
- Next.js is pinned to the patched 15.5.x backport (CVE-2025-66478).
